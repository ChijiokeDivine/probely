import { createWalletClient, http, type Account, type Address, type WalletClient, type Transport, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createViemAccount } from "@privy-io/node/viem";
import { getPrivyClient } from "@/lib/privy";
import { sepolia } from "@/lib/contracts/client";

function getRpcUrl(): string {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("Missing required env var: SEPOLIA_RPC_URL");
  return url;
}

/**
 * Builds a viem WalletClient for the admin paymaster wallet that signs all transactions!
 */
export function getAdminWalletClient(): WalletClient<Transport, Chain, Account> {
  let privateKey = process.env.ADMIN_PRIVATE_KEY;
  const adminAddress = process.env.ADMIN_WALLET_ADDRESS;
  if (!privateKey || !adminAddress) {
    throw new Error("Missing required env vars: ADMIN_PRIVATE_KEY or ADMIN_WALLET_ADDRESS");
  }
  // Ensure private key must start with 0x, add prefix if missing
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(getRpcUrl()),
  });
}

/**
 * Builds a viem WalletClient whose signing is delegated to a Privy embedded
 * wallet (via `createViemAccount`).
 */
export function getWalletClientForWallet({
  walletId,
  address,
}: {
  walletId: string;
  address: Address;
}): WalletClient<Transport, Chain, Account> {
  const privy = getPrivyClient();
  const account = createViemAccount(privy as never, { walletId, address }) as unknown as Account;

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
}): WalletClient<Transport, Chain, Account> {
  if (!profile.privy_wallet_id || !profile.wallet_address) {
    throw new Error("Profile has no provisioned wallet yet");
  }
  return getWalletClientForWallet({
    walletId: profile.privy_wallet_id!,
    address: profile.wallet_address as Address,
  });
}