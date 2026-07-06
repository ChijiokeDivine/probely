import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/auth/respond";
import { getInviteByToken } from "@/lib/services/reviews";
import { requireSession } from "@/lib/auth/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // First check if it's a team invite
    const admin = createAdminClient();
    console.log("Checking team invite for token:", token);
    const { data: teamInvite, error: teamInviteError } = await admin
      .from("team_invites")
      .select("id, email, status, created_at, inviter_id")
      .eq("invite_token", token)
      .single();

    console.log("Team invite error:", teamInviteError);
    console.log("Team invite data:", teamInvite);

    // Check if the error is a "not found" error (code PGRST116)
    if (!teamInviteError || teamInviteError.code !== "PGRST116") {
      if (teamInvite) {
        // Get inviter's name
        const { data: inviterProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", teamInvite.inviter_id)
          .single();

        return NextResponse.json({ 
          type: "team", 
          ...teamInvite, 
          inviterName: inviterProfile?.full_name 
        });
      }
      // If there's an error that's not "not found", return it
      if (teamInviteError) {
        return NextResponse.json({ error: teamInviteError.message }, { status: 500 });
      }
    }

    // If we get here, it's not a team invite, check if it's a review invite
    console.log("Checking review invite for token:", token);
    const reviewInvite = await getInviteByToken(token);
    return NextResponse.json({ type: "review", ...reviewInvite });
  } catch (err) {
    console.error("Error loading invite:", err);
    return errorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireSession();
    const { token } = await params;
    const admin = createAdminClient();
    const body = await request.json();
    const { action } = body;

    // First check if it's a team invite
    const { data: teamInvite, error: teamInviteError } = await admin
      .from("team_invites")
      .select("*")
      .eq("invite_token", token)
      .single();

    if (teamInviteError) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    // Check if invite is expired or already accepted/declined
    if (teamInvite.status !== "pending") {
      return NextResponse.json({ error: "Invite is no longer valid" }, { status: 409 });
    }

    if (new Date(teamInvite.expires_at) < new Date()) {
      await admin
        .from("team_invites")
        .update({ status: "expired" })
        .eq("id", teamInvite.id);
      return NextResponse.json({ error: "Invite has expired" }, { status: 409 });
    }

    // Check if email matches the user's email
    if (teamInvite.email !== user.email) {
      return NextResponse.json({ error: "This invite is not for you" }, { status: 403 });
    }

    if (action === "accept") {
      // Update invite status to accepted
      await admin
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", teamInvite.id);

      // Update the new user's role to reviewer (if needed)
      // Also, here's where you could add them to a team table if you have one
      return NextResponse.json({ success: true, status: "accepted" });
    } else if (action === "decline") {
      await admin
        .from("team_invites")
        .update({ status: "declined" })
        .eq("id", teamInvite.id);
      return NextResponse.json({ success: true, status: "declined" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
