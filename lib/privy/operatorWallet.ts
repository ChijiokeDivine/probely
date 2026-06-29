import { createAdminClient } from "@/lib/supabase/admin";
import { getPrivyClient } from "@/lib/privy";
import type { Address } from "viem";

export interface OperatorWallet {
  walletId: string;
  address: Address;
}

let cached: OperatorWallet | null = null;

/**
 * Returns the app's single "operator" wallet — used for transactions that
 * aren't naturally owned by any one human user:
 *
 *  - `submitRevealedScores` (BlindReview.sol allows ANY caller, by design —
 *    authenticity comes entirely from the KMS signature check, not msg.sender)
 *  - gas drips to freshly-created reviewer/admin wallets (see walletFunding.ts)
 *  - the chain event indexer never needs to sign anything, but if you later
 *    add e.g. an automated "request reveal once deadline passes" cron, this
 *    is the wallet it should sign with too.
 *
 * Resolution order:
 *   1. PRIVY_OPERATOR_WALLET_ID / PRIVY_OPERATOR_WALLET_ADDRESS env vars, if
 *      you'd rather pin this explicitly (e.g. to a wallet you've pre-funded).
 *   2. The `app_wallets` row keyed 'operator', if one was already created.
 *   3. Otherwise, create a new Privy wallet once and persist it — every
 *      subsequent call (including across cold starts / other instances)
 *      reuses the same wallet.
 *
 * IMPORTANT: this wallet pays its own gas. Fund it with Sepolia ETH after
 * first deploying (its address is logged / stored in `app_wallets`).
 */
export async function getOperatorWallet(): Promise<OperatorWallet> {
  if (cached) return cached;

  const envWalletId = process.env.PRIVY_OPERATOR_WALLET_ID;
  const envAddress = process.env.PRIVY_OPERATOR_WALLET_ADDRESS;
  if (envWalletId && envAddress) {
    cached = { walletId: envWalletId, address: envAddress as Address };
    return cached;
  }

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("app_wallets")
    .select("privy_wallet_id, wallet_address")
    .eq("key", "operator")
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to look up operator wallet: ${fetchError.message}`);
  }

  if (existing) {
    cached = { walletId: existing.privy_wallet_id, address: existing.wallet_address as Address };
    return cached;
  }

  const privy = getPrivyClient();
  const wallet = await privy.wallets().create({ chain_type: "ethereum" });

  const { error: insertError } = await supabase.from("app_wallets").insert({
    key: "operator",
    privy_wallet_id: wallet.id,
    wallet_address: wallet.address,
  });

  // If two instances race to create the operator wallet simultaneously,
  // the unique constraint on `key` will reject the loser's insert — re-fetch
  // and use whichever one actually won, rather than orphaning a second wallet.
  if (insertError) {
    const { data: winner, error: refetchError } = await supabase
      .from("app_wallets")
      .select("privy_wallet_id, wallet_address")
      .eq("key", "operator")
      .single();
    if (refetchError || !winner) {
      throw new Error(`Failed to persist operator wallet: ${insertError.message}`);
    }
    cached = { walletId: winner.privy_wallet_id, address: winner.wallet_address as Address };
    return cached;
  }

  cached = { walletId: wallet.id, address: wallet.address as Address };
  return cached;
}