import { NextResponse } from "next/server";
import { ensureWalletForUser } from "@/lib/wallet";

// Configure this as a Database Webhook in the Supabase dashboard:
//   Table: public.profiles · Event: INSERT · Type: HTTP Request
//   URL: https://<your-app>/api/webhooks/wallet-provision
//   Header: x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>
//
// This fires automatically the instant any new user signs up, no matter
// which auth method they used — it's the path that makes wallet
// creation actually invisible to the user.
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const userId = payload?.record?.id;

  if (!userId) {
    return NextResponse.json({ error: "Missing record.id" }, { status: 400 });
  }

  const result = await ensureWalletForUser(userId);

  // Always respond 200 — ensureWalletForUser is idempotent and has two
  // more chances to run (the auth callback and the client-side fallback),
  // so there's no need for Supabase to retry this webhook on failure.
  return NextResponse.json(result);
}
