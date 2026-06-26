import { createAdminClient } from "./supabase/admin";
import { getPrivyClient } from "./privy";

type WalletResult =
  | { status: "already-exists" | "created"; walletAddress: string }
  | { status: "failed"; error: string };

/**
 * Makes sure `userId` has a Privy embedded Ethereum wallet, creating one
 * if it doesn't, and writes it onto `profiles`. Safe to call as many
 * times as you like for the same user — it's a no-op once a wallet
 * exists.
 *
 * This is the single place wallet creation happens. It's called from
 * three places, so a wallet gets created no matter which signup path a
 * user takes and even if any one of these is delayed or misconfigured:
 *
 *  1. /api/webhooks/wallet-provision — fires automatically the instant
 *     a new row lands in `profiles` (i.e. immediately on every signup:
 *     email/password, Google OAuth, magic link, ...). This is the
 *     "real" path — wallet creation happens in the background and the
 *     user never sees it.
 *  2. /auth/callback — fallback for OAuth/email-confirmation logins, in
 *     case the database webhook hasn't fired yet (e.g. local dev with
 *     no public URL for Supabase to call).
 *  3. /api/wallet/ensure — fallback for email/password signups that get
 *     an immediate session (no email confirmation step), called once
 *     right after signUp() resolves on the client.
 *
 * Known limitation: if two of these somehow run concurrently for the
 * very first signup of a given user, there's a small race window where
 * both could pass the "does a wallet exist yet" check before either has
 * written one, creating two Privy wallets for one user (only the first
 * write wins on the `profiles` row, thanks to the `.is("wallet_address",
 * null)` guard below, but the second Privy-side wallet would be
 * orphaned). For hackathon scope this is fine; to fully close it, add a
 * Postgres advisory lock (`pg_advisory_xact_lock`) keyed on the user id
 * around the create-then-write step.
 */
export async function ensureWalletForUser(userId: string): Promise<WalletResult> {
  const supabase = createAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (fetchError) {
    return { status: "failed", error: fetchError.message };
  }

  if (profile?.wallet_address) {
    return { status: "already-exists", walletAddress: profile.wallet_address };
  }

  try {
    const privy = getPrivyClient();
    const wallet = await privy.wallets().create({ chain_type: "ethereum" });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        privy_wallet_id: wallet.id,
        wallet_address: wallet.address,
        wallet_status: "created",
      })
      .eq("id", userId)
      .is("wallet_address", null); // guards against a concurrent double-write

    if (updateError) {
      return { status: "failed", error: updateError.message };
    }

    return { status: "created", walletAddress: wallet.address };
  } catch (err) {
    await supabase.from("profiles").update({ wallet_status: "failed" }).eq("id", userId);

    const message = err instanceof Error ? err.message : "Unknown error creating wallet";
    return { status: "failed", error: message };
  }
}
