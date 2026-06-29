import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createCandidate, listCandidatesForAdmin } from "@/lib/services/candidates";

export async function GET() {
  try {
    const user = await requireSession();
    const candidates = await listCandidatesForAdmin(user.id);
    return NextResponse.json({ candidates });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = await request.json();
    const { fullName, email, notes, candidateRef } = body ?? {};

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const candidate = await createCandidate({
      createdBy: user.id,
      fullName,
      email,
      notes,
      candidateRef,
    });
    return NextResponse.json({ candidate }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}