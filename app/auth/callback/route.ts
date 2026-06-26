import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureWalletForUser } from "@/lib/wallet";

// Handles the redirect back from:
//  - Google OAuth (signInWithOAuth)
//  - Email confirmation links (signUp, when confirmations are on)
//  - Password recovery links (resetPasswordForEmail) — these arrive
//    here too, with ?next=/reset-password
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Missing%20code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "Could not sign you in")}`
    );
  }

  // Fallback safety net. The Supabase database webhook normally creates
  // the wallet the instant the `profiles` row is inserted, well before
  // this callback ever runs — this call is almost always a no-op. It
  // only does real work if the webhook hasn't fired yet (e.g. local dev
  // with no public URL for Supabase to reach).
  await ensureWalletForUser(data.user.id);

  return NextResponse.redirect(`${origin}${next}`);
}
