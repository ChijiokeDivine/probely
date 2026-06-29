import { bytesToHex, type Address, type Hex } from "viem";
import { getFhevmInstance } from "./relayer";
import { MAX_SCORE_VALUE, MIN_SCORE_VALUE } from "@/lib/contracts/constants";
import type { RawCategoryScores } from "@/lib/contracts/types";

export interface EncryptedCategoryScores {
  problemSolving: Hex;
  technicalDepth: Hex;
  communication: Hex;
  collaboration: Hex;
  cultureGrowth: Hex;
  /** Single ZK proof covering all 5 handles — submitScores expects exactly one. */
  inputProof: Hex;
}

function assertValidScore(value: number, field: string) {
  if (!Number.isInteger(value) || value < MIN_SCORE_VALUE || value > MAX_SCORE_VALUE) {
    throw new Error(
      `Invalid score for "${field}": ${value}. Must be an integer between ${MIN_SCORE_VALUE} and ${MAX_SCORE_VALUE}.`
    );
  }
}

/**
 * Encrypts the 5 plaintext category scores (0-10 each) as `externalEuint16`
 * handles bound to (contractAddress, reviewerAddress), matching exactly what
 * BlindReview.submitScores expects: 5 handles sharing 1 ZK proof.
 *
 * The contract itself never validates score range (it physically can't see
 * the plaintext) — this is the only enforcement point, so the range check
 * here is load-bearing, not a nice-to-have.
 */
export async function encryptReviewScores(
  contractAddress: Address,
  reviewerAddress: Address,
  scores: RawCategoryScores
): Promise<EncryptedCategoryScores> {
  assertValidScore(scores.problemSolving, "problemSolving");
  assertValidScore(scores.technicalDepth, "technicalDepth");
  assertValidScore(scores.communication, "communication");
  assertValidScore(scores.collaboration, "collaboration");
  assertValidScore(scores.cultureGrowth, "cultureGrowth");

  const instance = await getFhevmInstance();
  const input = instance.createEncryptedInput(contractAddress, reviewerAddress);

  // Order here MUST match the order submitScores() reads its 5 parameters in.
  input.add16(scores.problemSolving);
  input.add16(scores.technicalDepth);
  input.add16(scores.communication);
  input.add16(scores.collaboration);
  input.add16(scores.cultureGrowth);

  const { handles, inputProof } = await input.encrypt();
  const [problemSolving, technicalDepth, communication, collaboration, cultureGrowth] = handles.map((h: Uint8Array) =>
    bytesToHex(h)
  );

  return {
    problemSolving,
    technicalDepth,
    communication,
    collaboration,
    cultureGrowth,
    inputProof: bytesToHex(inputProof),
  };
}