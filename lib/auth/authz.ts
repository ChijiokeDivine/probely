import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  wallet_address: string | null;
  privy_wallet_id: string | null;
  wallet_status: string | null;
}

/** Resolves the signed-in user from the request's session cookie. Throws 401 if absent. */
export async function requireSession() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return data.user;
}

/** Fetches the caller's profile row via the admin client (bypasses RLS — we already know who they are). */
export async function getProfile(userId: string): Promise<ProfileRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, wallet_address, privy_wallet_id, wallet_status")
    .eq("id", userId)
    .single();
  if (error || !data) {
    throw new HttpError(404, "Profile not found");
  }
  return data;
}

/**
 * Resolves the caller's session AND profile, and asserts their embedded
 * wallet has actually finished provisioning. Almost every write action
 * (create review, submit score, ...) needs this — they all sign with the
 * caller's own wallet.
 */
export async function requireProfileWithWallet(): Promise<ProfileRow & { wallet_address: string; privy_wallet_id: string }> {
  const user = await requireSession();
  const profile = await getProfile(user.id);
  if (!profile.wallet_address || !profile.privy_wallet_id || profile.wallet_status !== "created") {
    throw new HttpError(409, "Your wallet is still being set up — try again in a moment.");
  }
  return profile as ProfileRow & { wallet_address: string; privy_wallet_id: string };
}

/** Asserts `profileId` is the admin_id on `reviewId`. Returns the review row. */
export async function requireReviewAdmin(reviewId: string, profileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("reviews").select("*").eq("id", reviewId).single();
  if (error || !data) throw new HttpError(404, "Review not found");
  if (data.admin_id !== profileId) throw new HttpError(403, "Only the review's admin can do this");
  return data;
}

/** Asserts `profileId` is an active invited reviewer on `reviewId`. Returns the review + reviewer rows. */
export async function requireActiveReviewer(reviewId: string, profileId: string) {
  const admin = createAdminClient();
  const [{ data: review, error: reviewError }, { data: reviewer, error: reviewerError }] = await Promise.all([
    admin.from("reviews").select("*").eq("id", reviewId).single(),
    admin
      .from("review_reviewers")
      .select("*")
      .eq("review_id", reviewId)
      .eq("reviewer_id", profileId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  if (reviewError || !review) throw new HttpError(404, "Review not found");
  if (reviewerError || !reviewer) throw new HttpError(403, "You are not an active reviewer on this review");
  return { review, reviewer };
}