import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureWalletForUser } from "@/lib/wallet";

// Called once from the signup page, right after supabase.auth.signUp()
// resolves with an immediate session (i.e. email confirmations are
// turned off in the Supabase dashboard, so there's no /auth/callback
// redirect to fall back on). Authenticated via the session cookie —
// a user can only ever provision their own wallet.
export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await ensureWalletForUser(data.user.id);
  return NextResponse.json(result);
}
