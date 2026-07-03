import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/auth/respond";
import { declineInvite } from "@/lib/services/reviews";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const result = await declineInvite(token, body.reason);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
