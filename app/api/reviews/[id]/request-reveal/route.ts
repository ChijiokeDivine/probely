import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";

// Force Next.js to treat this route as fully dynamic at build time
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    
    // Dynamically import the service here as well
    const { requestReveal } = await import("@/lib/services/reveal");
    const result = await requestReveal({ reviewId: id, requestedByProfileId: user.id });
    
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}