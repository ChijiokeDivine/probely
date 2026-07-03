import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/auth/respond";
import { getScorecardByToken } from "@/lib/services/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const scorecard = await getScorecardByToken(token);
    return NextResponse.json(scorecard);
  } catch (err) {
    return errorResponse(err);
  }
}
