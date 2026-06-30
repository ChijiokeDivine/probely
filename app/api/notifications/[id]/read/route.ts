import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { markNotificationRead } from "@/lib/services/notifications";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const notification = await markNotificationRead(id, user.id);
    return NextResponse.json({ notification });
  } catch (err) {
    return errorResponse(err);
  }
}
