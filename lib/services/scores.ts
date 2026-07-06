import { getAddress, parseEventLogs } from "viem";
import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";
import { getContractAddress, getPublicClient, getWriteContract, getReadContract } from "@/lib/contracts/client";
import { BlindReviewAbi } from "../contracts/BlindReview.abi";
import { getAdminWalletClient } from "@/lib/privy/viemAccount";
import { encryptReviewScores } from "@/lib/fhe/encryptScores";
import { recordPendingTransaction, markTransactionConfirmed, markTransactionFailed } from "@/lib/services/activity";
import { createNotification } from "@/lib/services/notifications";
import { encodeTagMask } from "@/lib/contracts/constants";
import type { RawCategoryScores } from "@/lib/contracts/types";

export interface SubmitScoreInput {
  reviewId: string;
  reviewerProfileId: string;
  scores: RawCategoryScores;
  /** Indices 0-7 of selected signal tags — see lib/contracts/constants.ts REVIEW_TAGS. */
  selectedTagBits?: number[];
}

/**
 * Encrypts and submits one reviewer's scorecard. The reviewer's own Privy
 * wallet signs the tx — this backend never sees, stores, or could
 * reconstruct the plaintext scores once this function returns; they exist
 * in memory only for the duration of the encrypt() call.
 */
export async function submitScore(input: SubmitScoreInput) {
  const admin = createAdminClient();

  const { data: review, error: reviewError } = await admin.from("reviews").select("*").eq("id", input.reviewId).single();
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (!review.chain_review_id) throw new HttpError(409, "Review has not been confirmed on-chain yet");
  if (review.status !== "active") throw new HttpError(409, `This review is not accepting scores (status: ${review.status})`);
  if (new Date(review.deadline).getTime() < Date.now()) throw new HttpError(409, "The deadline for this review has passed");

  const { data: reviewerRow, error: reviewerError } = await admin
    .from("review_reviewers")
    .select("*")
    .eq("review_id", input.reviewId)
    .eq("reviewer_id", input.reviewerProfileId)
    .eq("is_active", true)
    .single();
  if (reviewerError || !reviewerRow) throw new HttpError(403, "You are not an active reviewer on this review");
  if (reviewerRow.has_submitted) throw new HttpError(409, "You have already submitted scores for this review");

  const { data: reviewerProfile, error: reviewerProfileError } = await admin
    .from("profiles")
    .select("wallet_address, privy_wallet_id")
    .eq("id", input.reviewerProfileId)
    .single();
  if (reviewerProfileError || !reviewerProfile?.wallet_address || !reviewerProfile?.privy_wallet_id) {
    throw new HttpError(409, "Your wallet is still being set up");
  }

  const tagMask = encodeTagMask(input.selectedTagBits ?? []);
  const reviewerAddress = getAddress(reviewerProfile.wallet_address);

  const walletTxId = await recordPendingTransaction({
    profileId: input.reviewerProfileId,
    action: "submit_score",
    reviewId: input.reviewId,
  });

  try {
    // Defense-in-depth: re-check on-chain truth right before encrypting/sending,
    // in case our DB mirror has drifted from the contract for any reason.
    const readContract = getReadContract();
    const alreadySubmittedOnChain = await readContract.read.hasReviewerSubmitted([
      BigInt(review.chain_review_id),
      reviewerAddress,
    ]);
    if (alreadySubmittedOnChain) {
      throw new HttpError(409, "You have already submitted scores for this review (on-chain)");
    }

    const encrypted = await encryptReviewScores(getContractAddress(), reviewerAddress, input.scores);

    const walletClient = getAdminWalletClient();
    const contract = getWriteContract(walletClient);

    const txHash = await contract.write.submitScores([
      BigInt(review.chain_review_id),
      encrypted.problemSolving,
      encrypted.technicalDepth,
      encrypted.communication,
      encrypted.collaboration,
      encrypted.cultureGrowth,
      encrypted.inputProof,
      tagMask,
    ]);

    await admin.from("review_score_submissions").insert({
      review_id: input.reviewId,
      reviewer_id: input.reviewerProfileId,
      tx_hash: txHash,
      handles: {
        problemSolving: encrypted.problemSolving,
        technicalDepth: encrypted.technicalDepth,
        communication: encrypted.communication,
        collaboration: encrypted.collaboration,
        cultureGrowth: encrypted.cultureGrowth,
      },
      tag_mask: tagMask,
      status: "pending",
    });

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash: txHash });
    const [event] = parseEventLogs({ abi: BlindReviewAbi, eventName: "ScoreSubmitted", logs: receipt.logs });
    const submittedCount = event?.args.submittedCount ?? review.submitted_count + 1;

    await admin
      .from("review_reviewers")
      .update({ has_submitted: true, tag_mask: tagMask, submitted_at: new Date().toISOString(), submit_tx_hash: txHash })
      .eq("id", reviewerRow.id);

    await admin
      .from("review_score_submissions")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("tx_hash", txHash);

    await admin.from("reviews").update({ submitted_count: submittedCount }).eq("id", input.reviewId);

    await admin.from("review_events").upsert(
      {
        review_id: input.reviewId,
        chain_review_id: review.chain_review_id,
        event_type: "ScoreSubmitted",
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        log_index: event?.logIndex ?? 0,
        payload: { submittedCount },
      },
      { onConflict: "tx_hash,log_index" }
    );

    if (submittedCount === review.reviewer_count) {
      await createNotification({
        profileId: review.admin_id,
        type: "all_scores_submitted",
        title: `All reviewers have submitted for "${review.role}"`,
        body: "Results are ready to be revealed.",
        reviewId: input.reviewId,
      });
    }

    await markTransactionConfirmed(walletTxId, txHash);
    return { txHash, submittedCount, reviewerCount: review.reviewer_count };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("review_score_submissions")
      .update({ status: "failed", error_message: message })
      .eq("review_id", input.reviewId)
      .eq("reviewer_id", input.reviewerProfileId)
      .is("confirmed_at", null);
    await markTransactionFailed(walletTxId, message);
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, `Failed to submit scores on-chain: ${message}`);
  }
}

export async function hasReviewerSubmittedOnChain(chainReviewId: string, walletAddress: string) {
  const contract = getReadContract();
  return contract.read.hasReviewerSubmitted([BigInt(chainReviewId), getAddress(walletAddress)]);
}