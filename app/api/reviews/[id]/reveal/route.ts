import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";

// Force Next.js to treat this route as fully dynamic at build time
export const dynamic = 'force-dynamic';

/**
 * Convenience endpoint for a single "Reveal results" button: runs
 * requestReveal (admin-signed) then finalizeReveal (operator-signed,
 * including the relayer's publicDecrypt round-trip) in one call.
 *
 * If you'd rather show the two steps separately in the UI (e.g. "Locking
 * scores on-chain..." then "Decrypting..." then "Finalizing..."), call
 * POST /request-reveal and POST /finalize-reveal individually instead —
 * both are idempotent and safe to retry.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    
    // Lazy-load the service module to protect the build from WASM resolution crashes
    const { requestAndFinalizeReveal } = await import("@/lib/services/reveal");
    const results = await requestAndFinalizeReveal({ reviewId: id, requestedByProfileId: user.id });
    
    return NextResponse.json({ results });
  } catch (err) {
    return errorResponse(err);
  }
}