import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { getCandidateForAdmin, updateCandidate, deleteCandidate } from "@/lib/services/candidates";

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const { fullName, email, notes } = body ?? {};

    const candidate = await updateCandidate(id, user.id, {
      fullName,
      email,
      notes,
    });

    return NextResponse.json({ candidate });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    await deleteCandidate(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}