import { createWalletClient, http, type Address, type WalletClient, type Transport, type Chain, type Account } from "viem";
import { createViemAccount } from "@privy-io/node/viem";
import { getPrivyClient } from "@/lib/privy";
import { sepolia } from "@/lib/contracts/client";

function getRpcUrl(): string {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("Missing required env var: SEPOLIA_RPC_URL");
  return url;
}

/**
 * Builds a viem WalletClient whose signing is delegated to a Privy embedded
 * wallet (via `createViemAccount`). Privy only ever signs remotely — it
 * never sees this wallet's transaction broadcast; that happens over our own
 * RPC transport (SEPOLIA_RPC_URL), exactly like a normal viem account.
 *
 * Construct one of these per outgoing transaction (or cache per walletId for
 * the lifetime of a request) — it's cheap, holds no state besides the id/address.
 */
export function getWalletClientForWallet({
  walletId,
  address,
}: {
  walletId: string;
  address: Address;
}): WalletClient<Transport, Chain, Account> { // <--- Add generics here
  const privy = getPrivyClient();
  const account = createViemAccount(privy as any, { walletId, address });
  
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(getRpcUrl()),
  });
}

/** Convenience overload taking the shape we usually have on hand: a `profiles` row. */
export function getWalletClientForProfile(profile: {
  privy_wallet_id: string | null;
  wallet_address: string | null;
}): WalletClient<Transport, Chain, Account> { // <--- Add generics here too
  if (!profile.privy_wallet_id || !profile.wallet_address) {
    throw new Error("Profile has no provisioned wallet yet");
  }
  return getWalletClientForWallet({
    walletId: profile.privy_wallet_id!,
    address: profile.wallet_address as Address,
  });
}