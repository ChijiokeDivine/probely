import type { Address, Hex } from "viem";
import type { AutoAdvanceAction, ReviewStatus } from "./constants";

export type { Address, Hex };

/** Mirrors `BlindReview.CategoryWeights` — must sum to BASIS_POINTS (10_000). */
export interface CategoryWeights {
  problemSolving: number;
  technicalDepth: number;
  communication: number;
  collaboration: number;
  cultureGrowth: number;
}

/** Mirrors `BlindReview.AutoAdvanceRule`. */
export interface AutoAdvanceRule {
  enabled: boolean;
  passThreshold: number;
  failThreshold: number;
  passAction: AutoAdvanceAction;
  failAction: AutoAdvanceAction;
}

/** Tuple shape returned by `getReviewSummary`. */
export interface ReviewSummaryOnChain {
  admin: Address;
  candidateRef: string;
  role: string;
  roundNumber: number;
  deadline: bigint;
  reviewerCount: bigint;
  submittedCount: number;
  status: ReviewStatus;
  extensionUsed: boolean;
}

/** The 5 raw category scores a reviewer submits, plaintext, pre-encryption. 0-10 scale. */
export interface RawCategoryScores {
  problemSolving: number;
  technicalDepth: number;
  communication: number;
  collaboration: number;
  cultureGrowth: number;
}

/** Tuple shape returned by `getRevealedScores`, fully decrypted on-chain. */
export interface RevealedScoresOnChain {
  sumProblemSolving: number;
  sumTechnicalDepth: number;
  sumCommunication: number;
  sumCollaboration: number;
  sumCultureGrowth: number;
  sumSqProblemSolving: number;
  sumSqTechnicalDepth: number;
  sumSqCommunication: number;
  sumSqCollaboration: number;
  sumSqCultureGrowth: number;
  reviewerCount: bigint;
  tagCounts: number[]; // length NUM_TAGS (8)
}

/** The 10 FHE handles snapshotted at requestReveal(), in fixed contract order. */
export type RevealHandles = readonly [Hex, Hex, Hex, Hex, Hex, Hex, Hex, Hex, Hex, Hex];

export const CATEGORY_KEYS = [
  "problemSolving",
  "technicalDepth",
  "communication",
  "collaboration",
  "cultureGrowth",
] as const satisfies readonly (keyof CategoryWeights)[];

export type CategoryKey = (typeof CATEGORY_KEYS)[number];