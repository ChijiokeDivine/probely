import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses Row Level Security.
 *
 * Server-only. Never import this from a Client Component, a file with
 * "use client", or anything that ends up in a browser bundle — the
 * service role key must never reach the client.
 *
 * Used by:
 *  - lib/wallet.ts, to write the Privy wallet address/id onto `profiles`
 *    (regular users can read their own profile via RLS, but only this
 *    key can write the wallet fields).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
