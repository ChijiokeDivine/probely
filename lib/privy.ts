import { PrivyClient } from "@privy-io/node";

let cached: PrivyClient | null = null;

/**
 * Server-only Privy client used purely as wallet infrastructure.
 *
 * We deliberately never use Privy's own auth/login UI or the
 * `@privy-io/react-auth` client SDK. Supabase is the single system of
 * record for identity — Privy only ever does one thing here: mint an
 * Ethereum wallet on request via the server Wallet API. The user never
 * sees Privy, never connects a wallet, never manages a key.
 */
export function getPrivyClient() {
  if (!cached) {
    cached = new PrivyClient({
      appId: process.env.PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    });
  }
  return cached;
}
