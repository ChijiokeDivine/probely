import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";
import { decodeTagCounts } from "@/lib/contracts/constants";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/contracts/types";

export interface CategoryResult {
  category: CategoryKey;
  sum: number;
  sumOfSquares: number;
  average: number;
  /** Population standard deviation across reviewers for this category — a low value means panel consensus. */
  stdDev: number;
}

export interface ReviewResultsView {
  reviewId: string;
  reviewerCount: number;
  categories: CategoryResult[];
  /** Σ(sum_i × weight_i) / reviewerCount, same 0-100,000 scale the contract's AutoAdvanceRule uses. */
  weightedScoreRaw: number;
  /** The same value rescaled to a familiar 0-10 average. */
  weightedAverageOutOf10: number;
  tags: ReturnType<typeof decodeTagCounts>;
  revealedAt: string;
  revealTxHash: string | null;
}

const SUM_COLUMN: Record<CategoryKey, string> = {
  problemSolving: "sum_problem_solving",
  technicalDepth: "sum_technical_depth",
  communication: "sum_communication",
  collaboration: "sum_collaboration",
  cultureGrowth: "sum_culture_growth",
};

const SUM_SQ_COLUMN: Record<CategoryKey, string> = {
  problemSolving: "sum_sq_problem_solving",
  technicalDepth: "sum_sq_technical_depth",
  communication: "sum_sq_communication",
  collaboration: "sum_sq_collaboration",
  cultureGrowth: "sum_sq_culture_growth",
};

/**
 * Population variance for category i, derived purely from the revealed sum
 * and sum-of-squares (per the contract's own doc comment):
 *   variance_i = (sumSq_i - sum_i² / N) / N
 * No individual score is ever involved — this is the whole point of
 * accumulating sum-of-squares homomorphically on-chain.
 */
function populationStdDev(sum: number, sumSq: number, n: number): number {
  if (n <= 0) return 0;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return Math.sqrt(Math.max(variance, 0));
}

export async function getReviewResults(reviewId: string): Promise<ReviewResultsView> {
  const admin = createAdminClient();
  const [{ data: review, error: reviewError }, { data: results, error: resultsError }] = await Promise.all([
    admin.from("reviews").select("*").eq("id", reviewId).single(),
    admin.from("review_results").select("*").eq("review_id", reviewId).single(),
  ]);
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (resultsError || !results) throw new HttpError(404, "This review has not been revealed yet");

  const n = results.reviewer_count;
  const categories: CategoryResult[] = CATEGORY_KEYS.map((category) => {
    const sum = results[SUM_COLUMN[category]] as number;
    const sumOfSquares = results[SUM_SQ_COLUMN[category]] as number;
    return {
      category,
      sum,
      sumOfSquares,
      average: n > 0 ? sum / n : 0,
      stdDev: populationStdDev(sum, sumOfSquares, n),
    };
  });

  const weightedScoreRaw = Number(results.weighted_score ?? 0);

  return {
    reviewId,
    reviewerCount: n,
    categories,
    weightedScoreRaw,
    weightedAverageOutOf10: weightedScoreRaw / 10000,
    tags: decodeTagCounts(results.tag_counts as number[]),
    revealedAt: results.revealed_at,
    revealTxHash: results.reveal_tx_hash,
  };
}