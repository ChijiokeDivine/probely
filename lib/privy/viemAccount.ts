import { createWalletClient, http, type Address, type WalletClient, type Transport, type Chain } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts"; // <-- Fixed import
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
export function getAdminWalletClient(): WalletClient<Transport, Chain, PrivateKeyAccount> {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const adminAddress = process.env.ADMIN_WALLET_ADDRESS;
  if (!privateKey || !adminAddress) {
    throw new Error("Missing required env vars: ADMIN_PRIVATE_KEY or ADMIN_WALLET_ADDRESS");
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
}): WalletClient<Transport, Chain, any> { // <-- Using 'any' or Custom Privy Account type bypasses viem's strict internal Account mismatch
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
}): WalletClient<Transport, Chain, any> { 
  if (!profile.privy_wallet_id || !profile.wallet_address) {
    throw new Error("Profile has no provisioned wallet yet");
  }
  return getWalletClientForWallet({
    walletId: profile.privy_wallet_id!,
    address: profile.wallet_address as Address,
  });
}