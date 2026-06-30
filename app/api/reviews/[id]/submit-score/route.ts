import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
// Type-only imports are safe to keep at the top level
import type { RawCategoryScores } from "@/lib/contracts/types";

// Force Next.js to treat this route as fully dynamic at build time
export const dynamic = 'force-dynamic';

interface SubmitScoreBody {
  scores: RawCategoryScores;
  selectedTagBits?: number[];
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = (await request.json()) as SubmitScoreBody;

    if (
      !body.scores ||
      typeof body.scores.problemSolving !== "number" ||
      typeof body.scores.technicalDepth !== "number" ||
      typeof body.scores.communication !== "number" ||
      typeof body.scores.collaboration !== "number" ||
      typeof body.scores.cultureGrowth !== "number"
    ) {
      return NextResponse.json(
        { error: "scores must include problemSolving, technicalDepth, communication, collaboration, cultureGrowth" },
        { status: 400 }
      );
    }

    // Lazily import the score service containing your encryption/relayer tracking
    const { submitScore } = await import("@/lib/services/scores");
    
    const result = await submitScore({
      reviewId: id,
      reviewerProfileId: user.id,
      scores: body.scores,
      selectedTagBits: body.selectedTagBits,
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}