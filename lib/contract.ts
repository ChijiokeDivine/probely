// Mirrors the `constant`s, enums, and tag bit semantics declared in
// contracts/BlindReview.sol. These are compile-time constants on-chain, so
// it's safe (and avoids an RPC round-trip) to hardcode them here for
// client/server-side pre-validation. If the contract is ever redeployed with
// different values, update this file to match.

/** Number of scoring categories per review. */
export const CATEGORY_COUNT = 5;

/** Number of signal tag bits (4 positive, 4 negative). */
export const NUM_TAGS = 8;

/** Category weights must sum to exactly this many basis points. */
export const BASIS_POINTS = 10_000;

/** Minimum number of reviewers a review can be created with. */
export const MIN_REVIEWERS = 2;

/** Maximum number of reviewers a review can be created with. */
export const MAX_REVIEWERS = 20;

/** Maximum amount (in seconds) a deadline may be extended, once. */
export const MAX_EXTENSION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Minimum gap (in seconds) the deadline must be ahead of `now` at creation. */
export const MIN_DEADLINE_GAP_SECONDS = 60 * 60; // 1 hour

/** Maximum number of review rounds a single candidateRef can accumulate. */
export const MAX_ROUNDS_PER_CANDIDATE = 10;

/**
 * Individual reviewer category scores are encrypted as `externalEuint16` and
 * are expected (by contract doc-comments, not enforced on-chain since the
 * contract can never see plaintext) to be integers on a 0-10 scale. The
 * encryption layer is the only place that can enforce this, so it must.
 */
export const MIN_SCORE_VALUE = 0;
export const MAX_SCORE_VALUE = 10;

/** `ReviewStatus` enum — order is load-bearing, mirrors the Solidity enum exactly. */
export enum ReviewStatus {
  Active = 0,
  RevealRequested = 1,
  Revealed = 2,
  Cancelled = 3,
}

export function reviewStatusLabel(status: ReviewStatus | number): string {
  switch (status) {
    case ReviewStatus.Active:
      return "active";
    case ReviewStatus.RevealRequested:
      return "reveal_requested";
    case ReviewStatus.Revealed:
      return "revealed";
    case ReviewStatus.Cancelled:
      return "cancelled";
    default:
      return "unknown";
  }
}

/**
 * `AutoAdvanceAction` enum — order is load-bearing, mirrors the Solidity enum
 * exactly. The contract never acts on these itself (by design, to avoid a
 * re-entrancy surface) — it only emits `AutoAdvanceTriggered`. Acting on the
 * signal (e.g. actually sending an offer/rejection email, or spinning up the
 * next round) is entirely this backend's job — see lib/services/reveal.ts.
 */
export enum AutoAdvanceAction {
  None = 0,
  AdvanceToNextRound = 1,
  SendOffer = 2,
  SendRejection = 3,
}

export function autoAdvanceActionLabel(action: AutoAdvanceAction | number): string {
  switch (action) {
    case AutoAdvanceAction.AdvanceToNextRound:
      return "advance_to_next_round";
    case AutoAdvanceAction.SendOffer:
      return "send_offer";
    case AutoAdvanceAction.SendRejection:
      return "send_rejection";
    default:
      return "none";
  }
}

/**
 * Signal tag bit semantics. These are NOT stored or interpreted on-chain
 * (the contract treats tagMask as an opaque uint8) — this array is purely an
 * off-chain labeling convention so the bit position a reviewer toggles in the
 * UI matches the bit position counted in `revealedTagCounts`.
 *
 * Bits 0-3 are positive signals, bits 4-7 are negative signals (per the
 * contract's own comment block above `NUM_TAGS`).
 */
export const REVIEW_TAGS = [
  { bit: 0, polarity: "positive", label: "Strong first-principles" },
  { bit: 1, polarity: "positive", label: "Excellent communicator" },
  { bit: 2, polarity: "positive", label: "Growth trajectory" },
  { bit: 3, polarity: "positive", label: "Handled ambiguity well" },
  { bit: 4, polarity: "negative", label: "Vague on technicals" },
  { bit: 5, polarity: "negative", label: "Seemed disengaged" },
  { bit: 6, polarity: "negative", label: "Struggled under pressure" },
  { bit: 7, polarity: "negative", label: "Rehearsed answers" },
] as const satisfies ReadonlyArray<{ bit: number; polarity: "positive" | "negative"; label: string }>;

/** Encode an array of selected tag bit indices (0-7) into the contract's uint8 mask. */
export function encodeTagMask(selectedBits: readonly number[]): number {
  let mask = 0;
  for (const bit of selectedBits) {
    if (bit < 0 || bit >= NUM_TAGS) {
      throw new Error(`Tag bit ${bit} out of range 0-${NUM_TAGS - 1}`);
    }
    mask |= 1 << bit;
  }
  return mask;
}

/** Decode a uint8 tag mask back into an array of selected bit indices (0-7). */
export function decodeTagMask(mask: number): number[] {
  const bits: number[] = [];
  for (let bit = 0; bit < NUM_TAGS; bit++) {
    if ((mask & (1 << bit)) !== 0) bits.push(bit);
  }
  return bits;
}

/** Decode per-bit reviewer counts (from `getRevealedScores`/`Revealed`) into labeled rows. */
export function decodeTagCounts(tagCounts: readonly number[]) {
  return REVIEW_TAGS.map((tag, i) => ({ ...tag, count: tagCounts[i] ?? 0 }));
}