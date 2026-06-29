import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { getCandidateForAdmin, getCandidateRounds } from "@/lib/services/candidates";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const candidate = await getCandidateForAdmin(id, user.id);
    const rounds = await getCandidateRounds(candidate.candidate_ref);
    return NextResponse.json(rounds);
  } catch (err) {
    return errorResponse(err);
  }
}