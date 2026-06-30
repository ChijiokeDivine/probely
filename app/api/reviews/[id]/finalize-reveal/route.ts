import { NextResponse } from "next/server";
import { requireSession, HttpError } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { getReviewById } from "@/lib/services/reviews";

// Force Next.js to treat this route as fully dynamic at build time
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const review = await getReviewById(id);
    const isAdmin = review.admin_id === user.id;
    const isReviewer = (review.review_reviewers ?? []).some(
      (r: { reviewer_id: string; is_active: boolean }) => r.reviewer_id === user.id && r.is_active
    );
    if (!isAdmin && !isReviewer) {
      throw new HttpError(403, "You don't have access to this review");
    }

    // Dynamically import the service that holds the Zama/node-tfhe dependency
    const { finalizeReveal } = await import("@/lib/services/reveal");
    const result = await finalizeReveal({ reviewId: id });
    
    return NextResponse.json({ result });
  } catch (err) {
    return errorResponse(err);
  }
}