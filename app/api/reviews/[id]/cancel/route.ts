import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { cancelReview } from "@/lib/services/reviews";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const review = await cancelReview({ reviewId: id, requestedByProfileId: user.id });
    return NextResponse.json({ review });
  } catch (err) {
    return errorResponse(err);
  }
}
