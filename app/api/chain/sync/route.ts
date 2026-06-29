import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/auth/respond";
import { syncChainEvents } from "@/lib/chain/sync";

/**
 * Synchronizes on-chain BlindReview contract events into our DB.
 *
 * Safe to run concurrently, idempotent, only processes blocks we haven't yet synced.
 * Should be triggered periodically by an external job scheduler (e.g. Vercel Cron, QStash).
 */
export async function POST() {
  try {
    const result = await syncChainEvents();
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
