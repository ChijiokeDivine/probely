import { NextResponse } from "next/server";
import { syncChainEvents } from "@/lib/chain/sync";
import { errorResponse } from "@/lib/auth/respond";
import { HttpError } from "@/lib/auth/authz";

/**
 * Intended to be hit by a scheduled job (Vercel Cron, QStash, GitHub
 * Actions, etc.), NOT by a logged-in user — so this checks a shared secret
 * header rather than a Supabase session.
 *
 * Example Vercel cron config (vercel.json):
 *   { "crons": [{ "path": "/api/chain/sync", "schedule": "*\/5 * * * *" }] }
 * Vercel Cron sends an Authorization: Bearer $CRON_SECRET header automatically
 * when CRON_SECRET is set as an env var — this checks for exactly that.
 *
 * Safe to call concurrently with itself or skip entirely for a while; it's a
 * pure catch-up mechanism (see lib/chain/sync.ts for why it's not on the
 * critical path of any user-facing action).
 */
export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${expectedSecret}`) {
        throw new HttpError(401, "Unauthorized");
      }
    }

    const result = await syncChainEvents();
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

// Also allow GET for manual triggering / cron providers that only do GET.
export async function GET(request: Request) {
  return POST(request);
}
