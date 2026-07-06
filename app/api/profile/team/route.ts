// app/api/profile/team/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * GET /api/profile/team
 * Returns every teammate the caller can invite as a reviewer, excluding
 * themselves AND pending team invites!
 */
export async function GET() {
  try {
    const user = await requireSession();
    const admin = createAdminClient();

    // First get all team invites the user has sent
    const { data: invites, error: invitesError } = await admin
      .from("team_invites")
      .select("id, email, status, created_at, inviter_id")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false });

    if (invitesError) {
      return NextResponse.json({ error: `Failed to load invites: ${invitesError.message}` }, { status: 500 });
    }

    // Then get existing profiles that aren't the user
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name, email, wallet_status, wallet_address")
      .neq("id", user.id)
      .order("full_name", { ascending: true });

    if (profilesError) {
      return NextResponse.json({ error: `Failed to load team: ${profilesError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      team: profiles || [], 
      invites: invites || [] 
    });
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

    // Create new invite with token
    const inviteToken = crypto.randomUUID();
    const { data: newInvite, error: inviteError } = await admin
      .from("team_invites")
      .insert({
        inviter_id: user.id,
        email: email,
        status: "pending",
        invite_token: inviteToken,
      })
      .select("*")
      .single();

    if (inviteError) {
      return NextResponse.json({ error: `Failed to create invite: ${inviteError.message}` }, { status: 500 });
    }

    // Get inviter's full name
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || "Someone";
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${inviteToken}`;


    // Send email with Resend
    const emailResult = await resend.emails.send({
      from: "Honio <no-reply@honio.xyz>",
      to: email,
      subject: `You've been invited to join ${inviterName}'s team on Honio`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A0E07;">You've been invited to Honio!</h2>
          <p style="font-size: 16px;">Hi there,</p>
          <p style="font-size: 16px;">
            ${inviterName} has invited you to join their team on Honio to review candidates.
          </p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #1A0E07; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Or copy and paste this link into your browser:<br />
            <a href="${inviteUrl}" style="color: #1A0E07;">${inviteUrl}</a>
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 32px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      `,
    });

    console.log("Resend email result:", emailResult);

    return NextResponse.json({ invite: newInvite }, { status: 201 });
  } catch (err) {
    console.error("Error sending invite:", err);
    return errorResponse(err);
  }
}
