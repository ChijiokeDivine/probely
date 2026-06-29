import { createAdminClient } from "@/lib/supabase/admin";

export type WalletAction =
  | "create_review"
  | "submit_score"
  | "request_reveal"
  | "finalize_reveal"
  | "cancel_review"
  | "extend_deadline"
  | "replace_reviewer"
  | "gas_drip";

export async function recordPendingTransaction(input: {
  profileId: string;
  action: WalletAction;
  reviewId?: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wallet_transactions")
    .insert({
      profile_id: input.profileId,
      action: input.action,
      review_id: input.reviewId ?? null,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to record pending wallet transaction:", error.message);
    return null;
  }
  return data.id as string;
}

export async function markTransactionConfirmed(id: string | null, txHash: string) {
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("wallet_transactions")
    .update({ tx_hash: txHash, status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("Failed to mark wallet transaction confirmed:", error.message);
}

export async function markTransactionFailed(id: string | null, errorMessage: string) {
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("wallet_transactions")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", id);
  if (error) console.error("Failed to mark wallet transaction failed:", error.message);
}