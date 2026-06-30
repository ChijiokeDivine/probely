import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { listNotifications } from "@/lib/services/notifications";

export async function GET(request: Request) {
  try {
    const user = await requireSession();
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const notifications = await listNotifications(user.id, { unreadOnly });
    return NextResponse.json({ notifications });
  } catch (err) {
    return errorResponse(err);
  }
}
