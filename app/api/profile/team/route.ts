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

/**
 * POST /api/profile/team
 * Sends a new team invitation
 */
export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const admin = createAdminClient();
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if the user already exists in profiles
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await admin
      .from("team_invites")
      .select("id, email, status")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: "Pending invite already exists for this email" }, { status: 409 });
    }

    // Create new invite
    const { data: newInvite, error: inviteError } = await admin
      .from("team_invites")
      .insert({
        inviter_id: user.id,
        email: email,
        status: "pending"
      })
      .select("*")
      .single();

    if (inviteError) {
      return NextResponse.json({ error: `Failed to create invite: ${inviteError.message}` }, { status: 500 });
    }

    // TODO: In a real implementation, we would send an email here
    // For now, we just return the invite

    return NextResponse.json({ invite: newInvite }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}