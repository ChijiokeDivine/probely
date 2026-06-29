import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { getCandidateForAdmin } from "@/lib/services/candidates";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const candidate = await getCandidateForAdmin(id, user.id);
    return NextResponse.json({ candidate });
  } catch (err) {
    return errorResponse(err);
  }
}