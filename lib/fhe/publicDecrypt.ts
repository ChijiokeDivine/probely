import type { Hex } from "viem";
import { getFhevmInstance } from "./relayer";
import type { RevealHandles } from "@/lib/contracts/types";

export interface PublicDecryptOutcome {
  /** Pass straight through to `submitRevealedScores(reviewId, abiEncodedClearValues, ...)`. */
  abiEncodedClearValues: Hex;
  /** Pass straight through to `submitRevealedScores(reviewId, ..., decryptionProof)`. */
  decryptionProof: Hex;
  /** Decoded {handle -> cleartext} map, handy for logging/debugging — not needed on-chain. */
  clearValues: Readonly<Record<string, bigint | boolean | Hex>>;
}

/**
 * Publicly decrypts the 10 FHE handles snapshotted by `requestReveal()`.
 *
 * Handle ORDER matters: it must exactly match the order returned by
 * `getRevealHandles(reviewId)` (which is itself the fixed order the contract
 * snapshotted: 5 sums then 5 sums-of-squares, both in
 * [problemSolving, technicalDepth, communication, collaboration, cultureGrowth]
 * order). Don't sort or otherwise reorder `handles` before calling this —
 * the contract's `FHE.checkSignatures` call rebuilds the same array in the
 * same order and will reject a mismatched proof.
 */
export async function publicDecryptRevealHandles(handles: RevealHandles): Promise<PublicDecryptOutcome> {
  const instance = await getFhevmInstance();
  const result = await instance.publicDecrypt([...handles]);
  return {
    abiEncodedClearValues: result.abiEncodedClearValues,
    decryptionProof: result.decryptionProof,
    clearValues: result.clearValues,
  };
}