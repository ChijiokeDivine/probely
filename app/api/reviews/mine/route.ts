import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { listReviewsForReviewer } from "@/lib/services/reviews";

export async function GET() {
  try {
    const user = await requireSession();
    const assignments = await listReviewsForReviewer(user.id);
    return NextResponse.json({ assignments });
  } catch (err) {
    return errorResponse(err);
  }
}
