import { getAddress, parseEventLogs, type Address } from "viem";
import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";
import { getPublicClient, getWriteContract, getReadContract } from "@/lib/contracts/client";
import { BlindReviewAbi } from "../contracts/BlindReview.abi";
import { getWalletClientForProfile, getAdminWalletClient } from "@/lib/privy/viemAccount";
import { recordPendingTransaction, markTransactionConfirmed, markTransactionFailed } from "@/lib/services/activity";
import { createNotification, createNotificationsForMany } from "@/lib/services/notifications";
import {
  BASIS_POINTS,
  MAX_EXTENSION_SECONDS,
  MAX_REVIEWERS,
  MIN_DEADLINE_GAP_SECONDS,
  MIN_REVIEWERS,
  AutoAdvanceAction,
} from "@/lib/contracts/constants";
import type { AutoAdvanceRule, CategoryWeights } from "@/lib/contracts/types";

export async function getInviteByToken(token: string) {
  const admin = createAdminClient();
  const { data: reviewerRow, error: reviewerError } = await admin
    .from("review_reviewers")
    .select("*, reviews(*)")
    .eq("id", token)
    .eq("is_active", true)
    .single();

  if (reviewerError || !reviewerRow) throw new HttpError(404, "Invite not found");

  return {
    role: reviewerRow.reviews.role,
    deadline: reviewerRow.reviews.deadline,
    totalReviewers: reviewerRow.reviews.reviewer_count,
    reviewId: reviewerRow.review_id,
    alreadySubmitted: reviewerRow.has_submitted,
  };
}

export async function declineInvite(token: string, reason?: string) {
  const admin = createAdminClient();
  const { data: reviewerRow, error: reviewerError } = await admin
    .from("review_reviewers")
    .select("*, reviews(admin_id, chain_review_id)")
    .eq("id", token)
    .single();

  if (reviewerError || !reviewerRow) throw new HttpError(404, "Invite not found");

  const { data, error } = await admin
    .from("review_reviewers")
    .update({ 
      status: "declined", 
      is_active: false,
      declined_at: new Date().toISOString(),
      decline_reason: reason
    })
    .eq("id", token)
    .select("*")
    .single();

  if (error || !data) throw new HttpError(404, "Invite not found");

  // Add a review event for the decline
  await admin.from("review_events").insert({
    review_id: reviewerRow.review_id,
    chain_review_id: reviewerRow.reviews?.chain_review_id,
    event_type: "ReviewerDeclined",
    payload: { reason: reason || null }
  });

  return { success: true };
}

export interface ScorecardResponse {
  reviewId: string;
  role: string;
  deadline: string;
  categoryWeights: CategoryWeights;
  alreadySubmitted: boolean;
  submittedScores?: {
    problemSolving: string;
    technicalDepth: string;
    communication: string;
    collaboration: string;
    cultureGrowth: string;
  };
}

export async function getScorecardByToken(token: string): Promise<ScorecardResponse> {
  const admin = createAdminClient();
  const { data: reviewerRow, error: reviewerError } = await admin
    .from("review_reviewers")
    .select("*, reviews(*)")
    .eq("id", token)
    .in("status", ["invited", "active"])
    .single();

  if (reviewerError || !reviewerRow) throw new HttpError(404, "Scorecard not found");

  const result: ScorecardResponse = {
    reviewId: reviewerRow.review_id,
    role: reviewerRow.reviews.role,
    deadline: reviewerRow.reviews.deadline,
    categoryWeights: reviewerRow.reviews.category_weights,
    alreadySubmitted: reviewerRow.has_submitted,
  };

  // If already submitted, fetch the submitted scores
  if (reviewerRow.has_submitted) {
    const { data: submission } = await admin
      .from("review_score_submissions")
      .select("handles")
      .eq("review_id", reviewerRow.review_id)
      .eq("reviewer_id", reviewerRow.reviewer_id)
      .single();

    if (submission?.handles) {
      result.submittedScores = submission.handles;
    }
  }

  return result;
}

const ZERO_AUTO_ADVANCE_RULE: AutoAdvanceRule = {
  enabled: false,
  passThreshold: 0,
  failThreshold: 0,
  passAction: AutoAdvanceAction.None,
  failAction: AutoAdvanceAction.None,
};

function toEpochSeconds(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

function assertValidWeights(weights: CategoryWeights) {
  const total =
    weights.problemSolving + weights.technicalDepth + weights.communication + weights.collaboration + weights.cultureGrowth;
  if (total !== BASIS_POINTS) {
    throw new HttpError(400, `Category weights must sum to ${BASIS_POINTS} basis points (got ${total})`);
  }
}

function assertValidAutoAdvanceRule(rule: AutoAdvanceRule) {
  if (rule.enabled && rule.passThreshold <= rule.failThreshold) {
    throw new HttpError(400, "Auto-advance passThreshold must be greater than failThreshold");
  }
}

interface ReviewerProfileForChain {
  id: string;
  wallet_address: string;
}

async function resolveReviewerProfilesOrThrow(reviewerProfileIds: string[], adminProfileId: string) {
  const unique = new Set(reviewerProfileIds);
  if (unique.size !== reviewerProfileIds.length) {
    throw new HttpError(400, "Reviewer list contains duplicates");
  }
  if (unique.has(adminProfileId)) {
    throw new HttpError(400, "The review admin cannot also be a reviewer");
  }
  if (reviewerProfileIds.length < MIN_REVIEWERS || reviewerProfileIds.length > MAX_REVIEWERS) {
    throw new HttpError(400, `Reviewer count must be between ${MIN_REVIEWERS} and ${MAX_REVIEWERS}`);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, wallet_address, wallet_status")
    .in("id", reviewerProfileIds);
  if (error) throw new HttpError(500, `Failed to load reviewer profiles: ${error.message}`);

  const byId = new Map(data?.map((p) => [p.id, p]));
  const notReady: string[] = [];
  const resolved: ReviewerProfileForChain[] = [];

  for (const id of reviewerProfileIds) {
    const profile = byId.get(id);
    if (!profile || !profile.wallet_address || profile.wallet_status !== "created") {
      notReady.push(id);
      continue;
    }
    resolved.push({ id, wallet_address: profile.wallet_address });
  }

  if (notReady.length > 0) {
    throw new HttpError(409, `Reviewer wallet(s) not ready yet: ${notReady.join(", ")}`);
  }

  return resolved;
}

export interface CreateReviewInput {
  adminProfileId: string;
  candidateId: string;
  role: string;
  reviewerProfileIds: string[];
  deadlineAt: Date;
  categoryWeights: CategoryWeights;
  autoAdvanceRule?: AutoAdvanceRule;
}

/**
 * Orchestrates the full create-review pipeline:
 *   1. validate inputs against the same constraints the contract enforces
 *      (fail fast, before spending any gas)
 *   2. write a `draft` row so intent is captured even if step 3 fails
 *   3. sign + send createReview() from the admin's Privy wallet
 *   4. wait for the receipt, decode ReviewCreated to get reviewId + roundNumber
 *   5. mark the row `active`, seed review_reviewers, notify invited reviewers
 */
export async function createReview(input: CreateReviewInput) {
  assertValidWeights(input.categoryWeights);
  const autoAdvanceRule = input.autoAdvanceRule ?? ZERO_AUTO_ADVANCE_RULE;
  assertValidAutoAdvanceRule(autoAdvanceRule);

  const deadlineEpoch = toEpochSeconds(input.deadlineAt);
  const nowEpoch = BigInt(Math.floor(Date.now() / 1000));
  if (deadlineEpoch <= nowEpoch + BigInt(MIN_DEADLINE_GAP_SECONDS)) {
    throw new HttpError(400, "Deadline must be at least 1 hour in the future");
  }

  const admin = createAdminClient();

  const { data: adminProfile, error: adminProfileError } = await admin
    .from("profiles")
    .select("id, wallet_address, privy_wallet_id, wallet_status")
    .eq("id", input.adminProfileId)
    .single();
  if (adminProfileError || !adminProfile?.wallet_address || !adminProfile?.privy_wallet_id || adminProfile.wallet_status !== "created") {
    throw new HttpError(409, "Your wallet is still being set up — try again in a moment.");
  }

  const { data: candidate, error: candidateError } = await admin
    .from("candidates")
    .select("id, candidate_ref, created_by")
    .eq("id", input.candidateId)
    .single();
  if (candidateError || !candidate) throw new HttpError(404, "Candidate not found");
  if (candidate.created_by !== input.adminProfileId) throw new HttpError(403, "Not your candidate");

  const reviewers = await resolveReviewerProfilesOrThrow(input.reviewerProfileIds, input.adminProfileId);

  const { data: draftRow, error: draftError } = await admin
    .from("reviews")
    .insert({
      admin_id: input.adminProfileId,
      candidate_id: candidate.id,
      candidate_ref: candidate.candidate_ref,
      role: input.role,
      reviewer_count: reviewers.length,
      deadline: input.deadlineAt.toISOString(),
      category_weights: input.categoryWeights,
      auto_advance_rule: autoAdvanceRule,
      status: "draft",
    })
    .select("*")
    .single();
  if (draftError || !draftRow) throw new HttpError(500, `Failed to create review draft: ${draftError?.message}`);

  const walletTxId = await recordPendingTransaction({
    profileId: input.adminProfileId,
    action: "create_review",
    reviewId: draftRow.id,
  });

  try {
    const walletClient = getAdminWalletClient();
    const contract = getWriteContract(walletClient);

    const reviewerAddresses = reviewers.map((r) => getAddress(r.wallet_address));

    const txHash = await contract.write.createReview([
      candidate.candidate_ref,
      input.role,
      reviewerAddresses,
      deadlineEpoch,
      {
        problemSolving: input.categoryWeights.problemSolving,
        technicalDepth: input.categoryWeights.technicalDepth,
        communication: input.categoryWeights.communication,
        collaboration: input.categoryWeights.collaboration,
        cultureGrowth: input.categoryWeights.cultureGrowth,
      },
      {
        enabled: autoAdvanceRule.enabled,
        passThreshold: autoAdvanceRule.passThreshold,
        failThreshold: autoAdvanceRule.failThreshold,
        passAction: autoAdvanceRule.passAction,
        failAction: autoAdvanceRule.failAction,
      },
    ]);

    await admin.from("reviews").update({ status: "pending_tx", create_tx_hash: txHash }).eq("id", draftRow.id);

    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "ReviewCreated", logs: receipt.logs });
    if (!event) throw new Error("createReview confirmed but ReviewCreated event was not found in the receipt");

    const chainReviewId = event.args.reviewId.toString();
    const roundNumber = event.args.roundNumber;

    const { data: activeRow, error: activeError } = await admin
      .from("reviews")
      .update({ chain_review_id: chainReviewId, round_number: roundNumber, status: "active" })
      .eq("id", draftRow.id)
      .select("*")
      .single();
    if (activeError || !activeRow) throw new Error(`Failed to finalize review row: ${activeError?.message}`);

    await admin.from("review_reviewers").insert(
      reviewers.map((r) => ({
        review_id: draftRow.id,
        reviewer_id: r.id,
        wallet_address: r.wallet_address,
        status: "active",
      }))
    );

    await admin.from("review_events").upsert(
      {
        review_id: draftRow.id,
        chain_review_id: chainReviewId,
        event_type: "ReviewCreated",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event.logIndex,
        payload: { roundNumber, reviewerCount: reviewers.length, deadline: deadlineEpoch.toString() },
      },
      { onConflict: "tx_hash,log_index" }
    );

    await createNotificationsForMany(
      reviewers.map((r) => r.id),
      {
        type: "reviewer_invited",
        title: `You've been invited to review for "${input.role}"`,
        body: `Round ${roundNumber}. Deadline: ${input.deadlineAt.toISOString()}.`,
        reviewId: draftRow.id,
      }
    );

    await markTransactionConfirmed(walletTxId, txHash);

    return activeRow;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("reviews").update({ status: "failed", error_message: message }).eq("id", draftRow.id);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to create review on-chain: ${message}`);
  }
}

export async function getReviewById(reviewId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();
  console.log("[getReviewById] Query result:", { data, error });
  if (error || !data) throw new HttpError(404, "Review not found");

  // Now get reviewers with profiles separately
  const { data: reviewers, error: reviewersError } = await admin
    .from("review_reviewers")
    .select("*, profiles(id, full_name)")
    .eq("review_id", reviewId);
  console.log("[getReviewById] Reviewers result:", { reviewers, reviewersError });

  return { ...data, review_reviewers: reviewers || [] };
}

export async function getReviewEvents(reviewId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("review_events")
    .select("*")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, `Failed to get review events: ${error.message}`);
  return data;
}

export async function listReviewsForAdmin(adminProfileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select("*")
    .eq("admin_id", adminProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, `Failed to list reviews: ${error.message}`);
  return data;
}

export async function listReviewsForReviewer(reviewerProfileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("review_reviewers")
    .select("*, reviews(*)")
    .eq("reviewer_id", reviewerProfileId)
    .eq("is_active", true)
    .order("invited_at", { ascending: false });
  if (error) throw new HttpError(500, `Failed to list assigned reviews: ${error.message}`);
  return data;
}

export async function cancelReview({ reviewId, requestedByProfileId }: { reviewId: string; requestedByProfileId: string }) {
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (review.admin_id !== requestedByProfileId) throw new HttpError(403, "Only the review's admin can cancel it");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");
  if (review.status !== "active" && review.status !== "reveal_requested") {
    throw new HttpError(409, `Cannot cancel a review in status "${review.status}"`);
  }

  const { data: adminProfile, error: adminProfileError } = await admin
    .from("profiles")
    .select("wallet_address, privy_wallet_id")
    .eq("id", requestedByProfileId)
    .single();
  if (adminProfileError || !adminProfile?.wallet_address || !adminProfile?.privy_wallet_id) {
    throw new HttpError(409, "Your wallet is still being set up");
  }

  const walletTxId = await recordPendingTransaction({ profileId: requestedByProfileId, action: "cancel_review", reviewId });

  try {
    const walletClient = getAdminWalletClient();
    const contract = getWriteContract(walletClient);
    const txHash = await contract.write.cancelReview([BigInt(review.chain_review_id)]);

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "ReviewCancelled", logs: receipt.logs });

    const { data: updated, error: updateError } = await admin
      .from("reviews")
      .update({ status: "cancelled" })
      .eq("id", reviewId)
      .select("*")
      .single();
    if (updateError || !updated) throw new Error(`Failed to mark review cancelled: ${updateError?.message}`);

    await admin.from("review_events").upsert(
      {
        review_id: reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "ReviewCancelled",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event?.logIndex ?? 0,
        payload: { submittedCountAtCancellation: event?.args.submittedCountAtCancellation ?? review.submitted_count },
      },
      { onConflict: "tx_hash,log_index" }
    );

    const { data: reviewers } = await admin.from("review_reviewers").select("reviewer_id").eq("review_id", reviewId);
    await createNotificationsForMany((reviewers ?? []).map((r) => r.reviewer_id), {
      type: "review_cancelled",
      title: `Review for "${review.role}" was cancelled`,
      reviewId,
    });

    await markTransactionConfirmed(walletTxId, txHash);
    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to cancel review on-chain: ${message}`);
  }
}

export async function extendDeadline({
  reviewId,
  requestedByProfileId,
  newDeadlineAt,
}: {
  reviewId: string;
  requestedByProfileId: string;
  newDeadlineAt: Date;
}) {
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (review.admin_id !== requestedByProfileId) throw new HttpError(403, "Only the review's admin can extend its deadline");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");
  if (review.status !== "active") throw new HttpError(409, `Cannot extend deadline for a review in status "${review.status}"`);
  if (review.extension_used) throw new HttpError(409, "Deadline has already been extended once for this review");

  const newDeadlineEpoch = toEpochSeconds(newDeadlineAt);
  const currentDeadlineEpoch = toEpochSeconds(new Date(review.deadline));
  if (newDeadlineEpoch <= currentDeadlineEpoch) throw new HttpError(400, "New deadline must be later than the current one");
  if (newDeadlineEpoch > currentDeadlineEpoch + BigInt(MAX_EXTENSION_SECONDS)) {
    throw new HttpError(400, "Extension exceeds the 7-day maximum");
  }

  const { data: adminProfile, error: adminProfileError } = await admin
    .from("profiles")
    .select("wallet_address, privy_wallet_id")
    .eq("id", requestedByProfileId)
    .single();
  if (adminProfileError || !adminProfile?.wallet_address || !adminProfile?.privy_wallet_id) {
    throw new HttpError(409, "Your wallet is still being set up");
  }

  const walletTxId = await recordPendingTransaction({ profileId: requestedByProfileId, action: "extend_deadline", reviewId });

  try {
    const walletClient = getAdminWalletClient();
    const contract = getWriteContract(walletClient);
    const txHash = await contract.write.extendDeadline([BigInt(review.chain_review_id), newDeadlineEpoch]);

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "DeadlineExtended", logs: receipt.logs });

    const { data: updated, error: updateError } = await admin
      .from("reviews")
      .update({ deadline: newDeadlineAt.toISOString(), extension_used: true })
      .eq("id", reviewId)
      .select("*")
      .single();
    if (updateError || !updated) throw new Error(`Failed to update deadline: ${updateError?.message}`);

    await admin.from("review_events").upsert(
      {
        review_id: reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "DeadlineExtended",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event?.logIndex ?? 0,
        payload: { oldDeadline: currentDeadlineEpoch.toString(), newDeadline: newDeadlineEpoch.toString() },
      },
      { onConflict: "tx_hash,log_index" }
    );

    const { data: reviewers } = await admin.from("review_reviewers").select("reviewer_id").eq("review_id", reviewId);
    await createNotificationsForMany((reviewers ?? []).map((r) => r.reviewer_id), {
      type: "deadline_extended",
      title: `Deadline extended for "${review.role}"`,
      body: `New deadline: ${newDeadlineAt.toISOString()}`,
      reviewId,
    });

    await markTransactionConfirmed(walletTxId, txHash);
    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to extend deadline on-chain: ${message}`);
  }
}

export async function replaceReviewer({
  reviewId,
  requestedByProfileId,
  oldReviewerProfileId,
  newReviewerProfileId,
}: {
  reviewId: string;
  requestedByProfileId: string;
  oldReviewerProfileId: string;
  newReviewerProfileId: string;
}) {
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (review.admin_id !== requestedByProfileId) throw new HttpError(403, "Only the review's admin can replace a reviewer");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");
  if (review.status !== "active") throw new HttpError(409, `Cannot replace a reviewer for a review in status "${review.status}"`);
  if (newReviewerProfileId === requestedByProfileId) throw new HttpError(400, "The admin cannot be a reviewer");

  const { data: oldReviewerRow, error: oldReviewerError } = await admin
    .from("review_reviewers")
    .select("*")
    .eq("review_id", reviewId)
    .eq("reviewer_id", oldReviewerProfileId)
    .in("status", ["invited", "active"])
    .single();
  if (oldReviewerError || !oldReviewerRow) throw new HttpError(404, "Reviewer to replace is not on this panel");
  if (oldReviewerRow.has_submitted) throw new HttpError(409, "Cannot replace a reviewer who has already submitted");

  const { data: existingNewReviewer } = await admin
    .from("review_reviewers")
    .select("id")
    .eq("review_id", reviewId)
    .eq("reviewer_id", newReviewerProfileId)
    .in("status", ["invited", "active"])
    .maybeSingle();
  if (existingNewReviewer) throw new HttpError(409, "New reviewer is already on this panel");

  const [{ data: adminProfile, error: adminProfileError }, { data: newReviewerProfile, error: newReviewerError }] = await Promise.all([
    admin.from("profiles").select("wallet_address, privy_wallet_id").eq("id", requestedByProfileId).single(),
    admin.from("profiles").select("id, wallet_address, wallet_status").eq("id", newReviewerProfileId).single(),
  ]);
  if (adminProfileError || !adminProfile?.wallet_address || !adminProfile?.privy_wallet_id) {
    throw new HttpError(409, "Your wallet is still being set up");
  }
  if (newReviewerError || !newReviewerProfile?.wallet_address || newReviewerProfile.wallet_status !== "created") {
    throw new HttpError(409, "New reviewer's wallet is not ready yet");
  }

  const walletTxId = await recordPendingTransaction({ profileId: requestedByProfileId, action: "replace_reviewer", reviewId });

  try {
    const walletClient = getAdminWalletClient();
    const contract = getWriteContract(walletClient);
    const txHash = await contract.write.replaceReviewer([
      BigInt(review.chain_review_id),
      getAddress(oldReviewerRow.wallet_address),
      getAddress(newReviewerProfile.wallet_address),
    ]);

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "ReviewerReplaced", logs: receipt.logs });

    await admin
      .from("review_reviewers")
      .update({ 
        status: "replaced", 
        is_active: false, 
        replaced_by_reviewer_id: newReviewerProfileId 
      })
      .eq("id", oldReviewerRow.id);

    await admin.from("review_reviewers").insert({
      review_id: reviewId,
      reviewer_id: newReviewerProfileId,
      wallet_address: newReviewerProfile.wallet_address,
      status: "active",
    });

    await admin.from("review_events").upsert(
      {
        review_id: reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "ReviewerReplaced",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event?.logIndex ?? 0,
        payload: { oldReviewerProfileId, newReviewerProfileId },
      },
      { onConflict: "tx_hash,log_index" }
    );

    await createNotification({
      profileId: newReviewerProfileId,
      type: "reviewer_invited",
      title: `You've been added as a reviewer for "${review.role}"`,
      reviewId,
    });
    await createNotification({
      profileId: oldReviewerProfileId,
      type: "reviewer_replaced",
      title: `You've been removed from the review panel for "${review.role}"`,
      reviewId,
    });

    await markTransactionConfirmed(walletTxId, txHash);
    return { reviewId, oldReviewerProfileId, newReviewerProfileId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to replace reviewer on-chain: ${message}`);
  }
}