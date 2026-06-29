import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createReview, listReviewsForAdmin } from "@/lib/services/reviews";
import { AutoAdvanceAction } from "@/lib/contracts/constants";
import type { AutoAdvanceRule, CategoryWeights } from "@/lib/contracts/types";

export async function GET() {
  try {
    const user = await requireSession();
    const reviews = await listReviewsForAdmin(user.id);
    return NextResponse.json({ reviews });
  } catch (err) {
    return errorResponse(err);
  }
}

interface CreateReviewBody {
  candidateId: string;
  role: string;
  reviewerProfileIds: string[];
  deadlineAt: string; // ISO date string
  categoryWeights: CategoryWeights;
  autoAdvanceRule?: AutoAdvanceRule;
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = (await request.json()) as CreateReviewBody;

    if (!body.candidateId || !body.role || !Array.isArray(body.reviewerProfileIds) || !body.deadlineAt || !body.categoryWeights) {
      return NextResponse.json(
        { error: "candidateId, role, reviewerProfileIds, deadlineAt, and categoryWeights are required" },
        { status: 400 }
      );
    }

    const review = await createReview({
      adminProfileId: user.id,
      candidateId: body.candidateId,
      role: body.role,
      reviewerProfileIds: body.reviewerProfileIds,
      deadlineAt: new Date(body.deadlineAt),
      categoryWeights: body.categoryWeights,
      autoAdvanceRule: body.autoAdvanceRule ?? {
        enabled: false,
        passThreshold: 0,
        failThreshold: 0,
        passAction: AutoAdvanceAction.None,
        failAction: AutoAdvanceAction.None,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}