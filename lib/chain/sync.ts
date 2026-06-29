import { parseEventLogs, type Log } from "viem";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContractAddress, getPublicClient } from "@/lib/contracts/client";
import { BlindReviewAbi } from "@/lib/contracts/BlindReview.abi";

const SYNC_KEY = "blind_review";
const BLOCK_CHUNK_SIZE = BigInt(2000);

/**
 * This indexer is a SAFETY NET, not the primary update path. Every action
 * service (createReview, submitScore, requestReveal, finalizeReveal, ...)
 * already awaits its own transaction receipt and updates the DB
 * synchronously. This catches:
 *   - events the originating request's process died before recording
 *     (e.g. serverless timeout right after broadcast)
 *   - `submitRevealedScores` calls that didn't go through our
 *     finalizeReveal() (it's permissionless on-chain — anyone can call it)
 *   - general drift / manual reconciliation
 *
 * Run this periodically (cron, QStash, etc.) hitting POST /api/chain/sync.
 * Safe to run concurrently with itself — every write here is upserted
 * against (tx_hash, log_index) or guarded with idempotent conditions.
 */
export async function syncChainEvents() {
  const admin = createAdminClient();
  const publicClient = getPublicClient();
  const contractAddress = getContractAddress();

  const { data: syncState } = await admin
    .from("chain_sync_state")
    .select("last_synced_block")
    .eq("id", SYNC_KEY)
    .maybeSingle();

  const deployBlock = process.env.CONTRACT_DEPLOY_BLOCK ? BigInt(process.env.CONTRACT_DEPLOY_BLOCK) : BigInt(0);
  let fromBlock = syncState ? BigInt(syncState.last_synced_block) + BigInt(1) : deployBlock;

  const latestBlock = await publicClient.getBlockNumber();
  if (fromBlock > latestBlock) {
    return { processed: 0, fromBlock: fromBlock.toString(), toBlock: latestBlock.toString() };
  }

  let processed = 0;

  while (fromBlock <= latestBlock) {
    const toBlock = fromBlock + BLOCK_CHUNK_SIZE - BigInt(1) > latestBlock ? latestBlock : fromBlock + BLOCK_CHUNK_SIZE - BigInt(1);

    const logs = await publicClient.getLogs({ address: contractAddress, fromBlock, toBlock });
    if (logs.length > 0) {
      const events = parseEventLogs({ abi: BlindReviewAbi, logs });
      for (const event of events) {
        await handleEvent(admin, event);
        processed++;
      }
    }

    await admin
      .from("chain_sync_state")
      .upsert({ id: SYNC_KEY, last_synced_block: toBlock.toString(), updated_at: new Date().toISOString() });

    fromBlock = toBlock + BigInt(1);
  }

  return { processed, fromBlock: fromBlock.toString(), toBlock: latestBlock.toString() };
}

type DecodedEvent = ReturnType<typeof parseEventLogs<typeof BlindReviewAbi>>[number] & Log;

async function findReviewByChainId(admin: ReturnType<typeof createAdminClient>, chainReviewId: bigint) {
  const { data } = await admin.from("reviews").select("*").eq("chain_review_id", chainReviewId.toString()).maybeSingle();
  return data;
}

async function logEvent(
  admin: ReturnType<typeof createAdminClient>,
  params: { reviewDbId: string | null; chainReviewId: bigint; eventType: string; event: DecodedEvent; payload: unknown }
) {
  await admin.from("review_events").upsert(
    {
      review_id: params.reviewDbId,
      chain_review_id: params.chainReviewId.toString(),
      event_type: params.eventType,
      tx_hash: params.event.transactionHash,
      block_number: params.event.blockNumber ? Number(params.event.blockNumber) : null,
      log_index: params.event.logIndex,
      payload: params.payload,
    },
    { onConflict: "tx_hash,log_index" }
  );
}

async function handleEvent(admin: ReturnType<typeof createAdminClient>, event: DecodedEvent) {
  switch (event.eventName) {
    case "ScoreSubmitted": {
      const { reviewId: chainReviewId, reviewer, submittedCount } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;

      await admin
        .from("review_reviewers")
        .update({ has_submitted: true, submitted_at: new Date().toISOString(), submit_tx_hash: event.transactionHash })
        .eq("review_id", review.id)
        .ilike("wallet_address", reviewer);

      // Only move forward — never let a stale/out-of-order log lower the count.
      if (submittedCount > review.submitted_count) {
        await admin.from("reviews").update({ submitted_count: submittedCount }).eq("id", review.id);
      }

      await logEvent(admin, { reviewDbId: review.id, chainReviewId, eventType: "ScoreSubmitted", event, payload: { reviewer, submittedCount } });
      break;
    }

    case "ReviewCancelled": {
      const { reviewId: chainReviewId, submittedCountAtCancellation } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;
      if (review.status !== "cancelled") {
        await admin.from("reviews").update({ status: "cancelled" }).eq("id", review.id);
      }
      await logEvent(admin, {
        reviewDbId: review.id,
        chainReviewId,
        eventType: "ReviewCancelled",
        event,
        payload: { submittedCountAtCancellation },
      });
      break;
    }

    case "DeadlineExtended": {
      const { reviewId: chainReviewId, newDeadline } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;
      await admin
        .from("reviews")
        .update({ deadline: new Date(Number(newDeadline) * 1000).toISOString(), extension_used: true })
        .eq("id", review.id);
      await logEvent(admin, { reviewDbId: review.id, chainReviewId, eventType: "DeadlineExtended", event, payload: event.args });
      break;
    }

    case "ReviewerReplaced": {
      const { reviewId: chainReviewId, oldReviewer, newReviewer } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;
      // Best-effort DB mirror — the `review_reviewers` rows for old/new
      // reviewers are normally already updated synchronously by
      // lib/services/reviews.ts#replaceReviewer. We only patch wallet-address
      // mismatches here (e.g. if the replacement happened via a path other
      // than our API), matched by address since profile IDs aren't on-chain.
      await admin.from("review_reviewers").update({ is_active: false }).eq("review_id", review.id).ilike("wallet_address", oldReviewer);
      await logEvent(admin, { reviewDbId: review.id, chainReviewId, eventType: "ReviewerReplaced", event, payload: { oldReviewer, newReviewer } });
      break;
    }

    case "RevealRequested": {
      const { reviewId: chainReviewId, handles } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;
      if (review.status === "active") {
        await admin.from("reviews").update({ status: "reveal_requested" }).eq("id", review.id);
      }
      await admin.from("review_reveals").upsert(
        { review_id: review.id, request_tx_hash: event.transactionHash, handles, status: "requested" },
        { onConflict: "review_id" }
      );
      await logEvent(admin, { reviewDbId: review.id, chainReviewId, eventType: "RevealRequested", event, payload: { handles } });
      break;
    }

    case "Revealed": {
      const { reviewId: chainReviewId, ...rest } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      if (!review) break;

      const weights = (review.category_weights ?? {}) as Record<string, number>;
      const weightedNumerator =
        Number(rest.sumProblemSolving) * (weights.problemSolving ?? 0) +
        Number(rest.sumTechnicalDepth) * (weights.technicalDepth ?? 0) +
        Number(rest.sumCommunication) * (weights.communication ?? 0) +
        Number(rest.sumCollaboration) * (weights.collaboration ?? 0) +
        Number(rest.sumCultureGrowth) * (weights.cultureGrowth ?? 0);
      const weightedScore = Math.floor(weightedNumerator / Number(rest.reviewerCount));

      await admin.from("review_results").upsert(
        {
          review_id: review.id,
          sum_problem_solving: rest.sumProblemSolving,
          sum_technical_depth: rest.sumTechnicalDepth,
          sum_communication: rest.sumCommunication,
          sum_collaboration: rest.sumCollaboration,
          sum_culture_growth: rest.sumCultureGrowth,
          sum_sq_problem_solving: rest.sumSqProblemSolving,
          sum_sq_technical_depth: rest.sumSqTechnicalDepth,
          sum_sq_communication: rest.sumSqCommunication,
          sum_sq_collaboration: rest.sumSqCollaboration,
          sum_sq_culture_growth: rest.sumSqCultureGrowth,
          reviewer_count: Number(rest.reviewerCount),
          tag_counts: rest.tagCounts,
          weighted_score: weightedScore,
          reveal_tx_hash: event.transactionHash,
        },
        { onConflict: "review_id" }
      );
      await admin.from("reviews").update({ status: "revealed" }).eq("id", review.id);
      await admin
        .from("review_reveals")
        .update({ status: "finalized", finalize_tx_hash: event.transactionHash, finalized_at: new Date().toISOString() })
        .eq("review_id", review.id);

      await logEvent(admin, { reviewDbId: review.id, chainReviewId, eventType: "Revealed", event, payload: rest });
      break;
    }

    case "AutoAdvanceTriggered": {
      const { reviewId: chainReviewId, action, weightedScore } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      await logEvent(admin, {
        reviewDbId: review?.id ?? null,
        chainReviewId,
        eventType: "AutoAdvanceTriggered",
        event,
        payload: { action, weightedScore },
      });
      break;
    }

    case "ReviewCreated": {
      // Normally already handled synchronously by lib/services/reviews.ts#createReview.
      // If a review with this chain_review_id doesn't exist in our DB at all,
      // it was created through some path other than our API — we don't have
      // the candidate_id FK this schema requires, so we just log the raw
      // event for visibility rather than fabricating a partial row.
      const { reviewId: chainReviewId } = event.args;
      const review = await findReviewByChainId(admin, chainReviewId);
      await logEvent(admin, { reviewDbId: review?.id ?? null, chainReviewId, eventType: "ReviewCreated", event, payload: event.args });
      break;
    }

    default:
      break;
  }
}