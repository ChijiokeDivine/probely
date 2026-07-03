// app/api/profile/team/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/profile/team
 * Returns every teammate the caller can invite as a reviewer, excluding
 * themselves. For hackathon scope there's no company/workspace table yet,
 * so this returns every profile except the caller — matches the spec in
 * technical.md ("For hackathon: return all profiles except the current user").
 */
export async function GET() {
  try {
    const user = await requireSession();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, email, wallet_status, wallet_address")
      .neq("id", user.id)
      .order("full_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: `Failed to load team: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ team: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}