import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { replaceReviewer } from "@/lib/services/reviews";

interface ReplaceReviewerBody {
  oldReviewerProfileId: string;
  newReviewerProfileId: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = (await request.json()) as ReplaceReviewerBody;

    if (!body.oldReviewerProfileId || !body.newReviewerProfileId) {
      return NextResponse.json(
        { error: "oldReviewerProfileId and newReviewerProfileId are required" },
        { status: 400 }
      );
    }

    const result = await replaceReviewer({
      reviewId: id,
      requestedByProfileId: user.id,
      oldReviewerProfileId: body.oldReviewerProfileId,
      newReviewerProfileId: body.newReviewerProfileId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
