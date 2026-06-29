import { createPublicClient, getContract, http, type Address, type GetContractReturnType, type PublicClient, type WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { BlindReviewAbi } from "./BlindReview.abi";
import { type Account, type Transport, type Chain } from "viem";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** The deployed BlindReview contract address (Sepolia). */
export function getContractAddress(): Address {
  return requireEnv("CONTRACT_ADDRESS") as Address;
}

/** Sepolia RPC URL used for both reading chain state and broadcasting signed txs. */
function getRpcUrl(): string {
  return requireEnv("SEPOLIA_RPC_URL");
}

let publicClientSingleton: PublicClient | null = null;

/** A shared read-only client. Safe to reuse across requests (stateless). */
export function getPublicClient(): PublicClient {
  if (!publicClientSingleton) {
    publicClientSingleton = createPublicClient({
      chain: sepolia,
      transport: http(getRpcUrl()),
    });
  }
  return publicClientSingleton;
}

export type BlindReviewReadContract = GetContractReturnType<typeof BlindReviewAbi, PublicClient>;

/** Read-only contract instance — view functions only, no signer required. */
export function getReadContract(): BlindReviewReadContract {
  return getContract({
    address: getContractAddress(),
    abi: BlindReviewAbi,
    client: getPublicClient(),
  });
}

export type BlindReviewWriteContract = GetContractReturnType<
  typeof BlindReviewAbi,
  WalletClient<Transport, Chain, Account> // <--- Add generic arguments here
>;

/** Write-capable contract instance bound to a specific signer's wallet client. */
export function getWriteContract(
  walletClient: WalletClient<Transport, Chain, Account> // <--- Enforce it here too
): BlindReviewWriteContract {
  return getContract({
    address: getContractAddress(),
    abi: BlindReviewAbi,
    client: walletClient,
  });
}

export { sepolia };