import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { extendDeadline } from "@/lib/services/reviews";

interface ExtendDeadlineBody {
  newDeadlineAt: string; // ISO date string
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = (await request.json()) as ExtendDeadlineBody;

    if (!body.newDeadlineAt) {
      return NextResponse.json({ error: "newDeadlineAt is required" }, { status: 400 });
    }

    const review = await extendDeadline({
      reviewId: id,
      requestedByProfileId: user.id,
      newDeadlineAt: new Date(body.newDeadlineAt),
    });
    return NextResponse.json({ review });
  } catch (err) {
    return errorResponse(err);
  }
}
