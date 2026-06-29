import { createAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/auth/authz";

export type NotificationType =
  | "reviewer_invited"
  | "reviewer_replaced"
  | "deadline_extended"
  | "review_cancelled"
  | "all_scores_submitted"
  | "reveal_requested"
  | "review_revealed"
  | "auto_advance"
  | "wallet_funding_low";

export interface CreateNotificationInput {
  profileId: string;
  type: NotificationType;
  title: string;
  body?: string;
  reviewId?: string;
}

/**
 * Pure DB write — no email/push wired up. Hook a real delivery channel in
 * here later (Resend, Postmark, web push, ...) without touching any caller;
 * every reveal/score/admin-action service already calls this at the right
 * moments.
 */
export async function createNotification(input: CreateNotificationInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    profile_id: input.profileId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    review_id: input.reviewId ?? null,
  });
  if (error) {
    // Notifications are best-effort — never let a notification failure
    // surface as the reason a chain action failed.
    console.error("Failed to create notification:", error.message);
  }
}

export async function createNotificationsForMany(profileIds: string[], input: Omit<CreateNotificationInput, "profileId">) {
  await Promise.all(profileIds.map((profileId) => createNotification({ ...input, profileId })));
}

export async function listNotifications(profileId: string, { unreadOnly = false }: { unreadOnly?: boolean } = {}) {
  const admin = createAdminClient();
  let query = admin
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (unreadOnly) query = query.is("read_at", null);

  const { data, error } = await query;
  if (error) throw new HttpError(500, `Failed to list notifications: ${error.message}`);
  return data;
}

export async function markNotificationRead(notificationId: string, profileId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("profile_id", profileId)
    .select("*")
    .single();
  if (error || !data) throw new HttpError(404, "Notification not found");
  return data;
}