import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/auth/respond";
import { getInviteByToken } from "@/lib/services/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await getInviteByToken(token);
    return NextResponse.json(invite);
  } catch (err) {
    return errorResponse(err);
  }
}
