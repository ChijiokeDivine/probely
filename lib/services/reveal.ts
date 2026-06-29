import { parseEventLogs } from "viem";
import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";
import { getPublicClient, getWriteContract, getReadContract } from "@/lib/contracts/client";
import { BlindReviewAbi } from "../contracts/BlindReview.abi";
import { getWalletClientForProfile } from "@/lib/privy/viemAccount";
import { getOperatorWallet } from "@/lib/privy/operatorWallet";
import { getWalletClientForWallet } from "@/lib/privy/viemAccount";
import { ensureWalletFunded } from "@/lib/services/walletFunding";
import { publicDecryptRevealHandles } from "@/lib/fhe/publicDecrypt";
import { recordPendingTransaction, markTransactionConfirmed, markTransactionFailed } from "@/lib/services/activity";
import { createNotification, createNotificationsForMany } from "@/lib/services/notifications";
import { autoAdvanceActionLabel, AutoAdvanceAction } from "@/lib/contracts/constants";
import type { RevealHandles } from "@/lib/contracts/types";

/**
 * Step 1/2 — admin-signed tx. Requires every invited reviewer to have
 * already submitted (the contract itself enforces this with a `require`;
 * we also check our DB mirror first purely to give a clearer error message
 * before spending gas).
 */
export async function requestReveal({ reviewId, requestedByProfileId }: { reviewId: string; requestedByProfileId: string }) {
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (review.admin_id !== requestedByProfileId) throw new HttpError(403, "Only the review's admin can request reveal");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");
  if (review.status !== "active") throw new HttpError(409, `Cannot request reveal for a review in status "${review.status}"`);
  if (review.submitted_count < review.reviewer_count) {
    throw new HttpError(409, `Not all reviewers have submitted yet (${review.submitted_count}/${review.reviewer_count})`);
  }

  const { data: adminProfile, error: adminProfileError } = await admin
    .from("profiles")
    .select("wallet_address, privy_wallet_id")
    .eq("id", requestedByProfileId)
    .single();
  if (adminProfileError || !adminProfile?.wallet_address || !adminProfile?.privy_wallet_id) {
    throw new HttpError(409, "Your wallet is still being set up");
  }

  const walletTxId = await recordPendingTransaction({ profileId: requestedByProfileId, action: "request_reveal", reviewId });

  try {
    const walletClient = getWalletClientForProfile(adminProfile);
    const contract = getWriteContract(walletClient);
    const txHash = await contract.write.requestReveal([BigInt(review.chain_review_id)]);

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "RevealRequested", logs: receipt.logs });
    if (!event) throw new Error("requestReveal confirmed but RevealRequested event was not found");

    const handles = event.args.handles as RevealHandles;

    await admin.from("reviews").update({ status: "reveal_requested" }).eq("id", reviewId);

    await admin.from("review_reveals").upsert(
      {
        review_id: reviewId,
        requested_by: requestedByProfileId,
        request_tx_hash: txHash,
        handles,
        status: "requested",
        requested_at: new Date().toISOString(),
      },
      { onConflict: "review_id" }
    );

    await admin.from("review_events").upsert(
      {
        review_id: reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "RevealRequested",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event.logIndex,
        payload: { handles },
      },
      { onConflict: "tx_hash,log_index" }
    );

    await markTransactionConfirmed(walletTxId, txHash);
    return { txHash, handles };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to request reveal on-chain: ${message}`);
  }
}

/**
 * Step 2/2 — no human signer required. `submitRevealedScores` is callable by
 * anyone on-chain (authenticity comes entirely from the KMS signature
 * check), so this signs with the app's operator wallet rather than the
 * admin's. Safe to call repeatedly / from a retry — no-ops if already
 * finalized.
 */
export async function finalizeReveal({ reviewId }: { reviewId: string }) {
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");

  if (review.status === "revealed") {
    const { data: existing } = await admin.from("review_results").select("*").eq("review_id", reviewId).single();
    return existing;
  }
  if (review.status !== "reveal_requested") {
    throw new HttpError(409, `Cannot finalize reveal for a review in status "${review.status}"`);
  }

  const { data: revealRow, error: revealRowError } = await admin
    .from("review_reveals")
    .select("*")
    .eq("review_id", reviewId)
    .single();
  if (revealRowError || !revealRow) throw new HttpError(409, "No reveal request found for this review");

  await admin.from("review_reveals").update({ status: "decrypting" }).eq("review_id", reviewId);

  const operator = await getOperatorWallet();
  const walletTxId = await recordPendingTransaction({ profileId: review.admin_id, action: "finalize_reveal", reviewId });

  try {
    const handles = revealRow.handles as RevealHandles;
    const decrypted = await publicDecryptRevealHandles(handles);

    await admin
      .from("review_reveals")
      .update({
        status: "finalizing",
        decryption_proof: decrypted.decryptionProof,
        abi_encoded_clear_values: decrypted.abiEncodedClearValues,
      })
      .eq("review_id", reviewId);

    await ensureWalletFunded(operator.address);
    const walletClient = getWalletClientForWallet(operator);
    const contract = getWriteContract(walletClient);

    const txHash = await contract.write.submitRevealedScores([
      BigInt(review.chain_review_id),
      decrypted.abiEncodedClearValues,
      decrypted.decryptionProof,
    ]);

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [revealedEvent] = parseEventLogs({ abi: BlindReviewAbi, eventName: "Revealed", logs: receipt.logs });
    if (!revealedEvent) throw new Error("submitRevealedScores confirmed but Revealed event was not found");

    const a = revealedEvent.args;
    const weights = review.category_weights as Record<string, number>;
    const weightedNumerator =
      Number(a.sumProblemSolving) * weights.problemSolving +
      Number(a.sumTechnicalDepth) * weights.technicalDepth +
      Number(a.sumCommunication) * weights.communication +
      Number(a.sumCollaboration) * weights.collaboration +
      Number(a.sumCultureGrowth) * weights.cultureGrowth;
    const weightedScore = Math.floor(weightedNumerator / Number(a.reviewerCount));

    const { data: results, error: resultsError } = await admin
      .from("review_results")
      .upsert(
        {
          review_id: reviewId,
          sum_problem_solving: a.sumProblemSolving,
          sum_technical_depth: a.sumTechnicalDepth,
          sum_communication: a.sumCommunication,
          sum_collaboration: a.sumCollaboration,
          sum_culture_growth: a.sumCultureGrowth,
          sum_sq_problem_solving: a.sumSqProblemSolving,
          sum_sq_technical_depth: a.sumSqTechnicalDepth,
          sum_sq_communication: a.sumSqCommunication,
          sum_sq_collaboration: a.sumSqCollaboration,
          sum_sq_culture_growth: a.sumSqCultureGrowth,
          reviewer_count: Number(a.reviewerCount),
          tag_counts: a.tagCounts,
          weighted_score: weightedScore,
          reveal_tx_hash: txHash,
        },
        { onConflict: "review_id" }
      )
      .select("*")
      .single();
    if (resultsError || !results) throw new Error(`Failed to store revealed results: ${resultsError?.message}`);

    await admin.from("reviews").update({ status: "revealed" }).eq("id", reviewId);
    await admin
      .from("review_reveals")
      .update({ status: "finalized", finalize_tx_hash: txHash, finalized_at: new Date().toISOString() })
      .eq("review_id", reviewId);

    await admin.from("review_events").upsert(
      {
        review_id: reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "Revealed",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: revealedEvent.logIndex,
        payload: { reviewerCount: Number(a.reviewerCount), tagCounts: a.tagCounts, weightedScore },
      },
      { onConflict: "tx_hash,log_index" }
    );

    const { data: reviewerRows } = await admin.from("review_reviewers").select("reviewer_id").eq("review_id", reviewId);
    await createNotificationsForMany((reviewerRows ?? []).map((r) => r.reviewer_id), {
      type: "review_revealed",
      title: `Results are in for "${review.role}"`,
      reviewId,
    });

    // The contract only emits AutoAdvanceTriggered when an enabled rule's
    // threshold is actually crossed — handle it the same way here: log it
    // and notify the admin with the suggested next action. The contract
    // deliberately does NOT act on this itself (avoids a re-entrancy
    // surface) — acting on it (sending an offer/rejection, spinning up the
    // next round) is this backend's job.
    const [autoAdvanceEvent] = parseEventLogs({ abi: BlindReviewAbi, eventName: "AutoAdvanceTriggered", logs: receipt.logs });
    if (autoAdvanceEvent && autoAdvanceEvent.args.action !== AutoAdvanceAction.None) {
      await admin.from("review_events").upsert(
        {
          review_id: reviewId,
          chain_review_id: review.chain_review_id,
          event_type: "AutoAdvanceTriggered",
          tx_hash: txHash,
          block_number: receipt.blockNumber,
          log_index: autoAdvanceEvent.logIndex,
          payload: { action: autoAdvanceEvent.args.action, weightedScore: autoAdvanceEvent.args.weightedScore },
        },
        { onConflict: "tx_hash,log_index" }
      );

      await createNotification({
        profileId: review.admin_id,
        type: "auto_advance",
        title: `Suggested action for "${review.role}": ${autoAdvanceActionLabel(autoAdvanceEvent.args.action)}`,
        body: `Weighted score: ${(Number(autoAdvanceEvent.args.weightedScore) / 10000).toFixed(2)} / 10`,
        reviewId,
      });
    }

    await markTransactionConfirmed(walletTxId, txHash);
    return results;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("review_reveals").update({ status: "failed", error_message: message }).eq("review_id", reviewId);
    await markTransactionFailed(walletTxId, message);
    throw new HttpError(502, `Failed to finalize reveal on-chain: ${message}`);
  }
}

/** Convenience: runs both steps back-to-back for a single "Reveal results" button. */
export async function requestAndFinalizeReveal(input: { reviewId: string; requestedByProfileId: string }) {
  await requestReveal(input);
  return finalizeReveal({ reviewId: input.reviewId });
}

export async function getRevealHandlesOnChain(chainReviewId: string) {
  const contract = getReadContract();
  return contract.read.getRevealHandles([BigInt(chainReviewId)]);
}