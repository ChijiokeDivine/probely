import { parseEther, type Address } from "viem";
import { getPublicClient } from "@/lib/contracts/client";
import { getOperatorWallet } from "@/lib/privy/operatorWallet";
import { getWalletClientForWallet } from "@/lib/privy/viemAccount";

/** Drip amount per wallet. ~enough for a few dozen contract calls on Sepolia. */
const DRIP_AMOUNT_ETH = process.env.GAS_DRIP_AMOUNT_ETH ?? "0.02";

/** Only top up if the wallet's balance has fallen below this. */
const TOP_UP_THRESHOLD_ETH = process.env.GAS_TOP_UP_THRESHOLD_ETH ?? "0.005";

export interface FundingResult {
  funded: boolean;
  reason: "below_threshold" | "already_sufficient" | "operator_unfunded" | "error";
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Sends a small Sepolia ETH drip from the operator wallet to `address` if its
 * balance is below TOP_UP_THRESHOLD_ETH. Safe to call liberally (e.g. right
 * after wallet creation, and again before any write the user is about to
 * make) — it no-ops when the wallet already has enough gas.
 *
 * Never throws on funding failure (e.g. operator wallet itself out of funds)
 * — callers (wallet provisioning, score submission, etc.) should treat this
 * as best-effort and surface `reason: 'operator_unfunded'` to an admin/ops
 * channel rather than blocking the user's flow on it.
 */
export async function ensureWalletFunded(address: Address): Promise<FundingResult> {
  const publicClient = getPublicClient();

  let balance: bigint;
  try {
    balance = await publicClient.getBalance({ address });
  } catch (err) {
    return { funded: false, reason: "error", error: err instanceof Error ? err.message : String(err) };
  }

  const threshold = parseEther(TOP_UP_THRESHOLD_ETH);
  if (balance >= threshold) {
    return { funded: false, reason: "already_sufficient" };
  }

  try {
    const operator = await getOperatorWallet();
    const operatorBalance = await publicClient.getBalance({ address: operator.address });
    const dripAmount = parseEther(DRIP_AMOUNT_ETH);

    if (operatorBalance < dripAmount) {
      return { funded: false, reason: "operator_unfunded" };
    }

    const walletClient = getWalletClientForWallet(operator);
    const txHash = await walletClient.sendTransaction({
      chain: undefined,
      account: walletClient.account!,
      to: address,
      value: dripAmount,
    });

    return { funded: true, reason: "below_threshold", txHash };
  } catch (err) {
    return { funded: false, reason: "error", error: err instanceof Error ? err.message : String(err) };
  }
}