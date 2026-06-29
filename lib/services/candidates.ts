import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";
import { getReadContract } from "@/lib/contracts/client";

export interface CreateCandidateInput {
  createdBy: string;
  fullName: string;
  email?: string;
  notes?: string;
  /** Optional explicit candidate_ref. If omitted, a unique one is generated. */
  candidateRef?: string;
}

function generateCandidateRef(): string {
  // Short, URL-safe, collision-resistant enough for this scale. candidate_ref
  // is globally unique on-chain (getCandidateRounds has no per-admin
  // namespacing) so this intentionally never embeds the candidate's name.
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `cand_${random}`;
}

/** Full candidate row, including PII. Admin-only — never expose this to reviewer-facing code paths. */
export async function createCandidate(input: CreateCandidateInput) {
  const admin = createAdminClient();
  const candidateRef = input.candidateRef ?? generateCandidateRef();

  const { data, error } = await admin
    .from("candidates")
    .insert({
      created_by: input.createdBy,
      candidate_ref: candidateRef,
      full_name: input.fullName,
      email: input.email ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new HttpError(500, `Failed to create candidate: ${error.message}`);
  return data;
}

export async function getCandidateForAdmin(candidateId: string, requestedBy: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("candidates").select("*").eq("id", candidateId).single();
  if (error || !data) throw new HttpError(404, "Candidate not found");
  if (data.created_by !== requestedBy) throw new HttpError(403, "Not your candidate");
  return data;
}

export async function listCandidatesForAdmin(createdBy: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("candidates")
    .select("*")
    .eq("created_by", createdBy)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, `Failed to list candidates: ${error.message}`);
  return data;
}

export interface CandidateBlindView {
  id: string;
  candidateRef: string;
  role: string | null;
}

/**
 * The ONLY sanctioned way for reviewer-facing code to learn anything about a
 * candidate. Returns just `candidate_ref` (plus the role taken from the
 * specific review, since "role" lives on `reviews`, not `candidates`) —
 * never `full_name`/`email`/`notes`. Keeping this projection in one place
 * means "blind" stays true even as more UI surfaces get built against it.
 */
export async function getCandidateBlindView(candidateId: string, reviewId: string): Promise<CandidateBlindView> {
  const admin = createAdminClient();
  const [{ data: candidate, error: candidateError }, { data: review, error: reviewError }] = await Promise.all([
    admin.from("candidates").select("id, candidate_ref").eq("id", candidateId).single(),
    admin.from("reviews").select("role").eq("id", reviewId).single(),
  ]);
  if (candidateError || !candidate) throw new HttpError(404, "Candidate not found");
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  return { id: candidate.id, candidateRef: candidate.candidate_ref, role: review.role };
}

/**
 * On-chain + off-chain merged view of every round for a candidate:
 * `getCandidateRounds` gives the authoritative list of chain review IDs;
 * we join against our `reviews` table for the human-friendly metadata.
 */
export async function getCandidateRounds(candidateRef: string) {
  const contract = getReadContract();
  const chainReviewIds = await contract.read.getCandidateRounds([candidateRef]);

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("reviews")
    .select("*")
    .eq("candidate_ref", candidateRef)
    .order("round_number", { ascending: true });
  if (error) throw new HttpError(500, `Failed to load review rounds: ${error.message}`);

  return {
    chainReviewIds: chainReviewIds.map((id) => id.toString()),
    rounds: rows,
  };
}