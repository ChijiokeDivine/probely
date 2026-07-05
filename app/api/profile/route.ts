// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/profile
 * Returns the profile of the currently authenticated user.
 * If no profile row exists yet (user hasn't hit /onboarding's PATCH),
 * one is created on the fly so this never 500s on a missing row.
 */
export async function GET() {
  try {
    const user = await requireSession();
    const admin = createAdminClient();

    const { data: existingProfile, error: fetchError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: `Failed to load profile: ${fetchError.message}` }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile });
    }

    // No profile row yet — create a minimal one so the client always gets a profile back.
    const { data: created, error: createError } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: null,
        company: null,
        role: "admin",
      })
      .select("*")
      .single();

    if (createError) {
      return NextResponse.json({ error: `Failed to load profile: ${createError.message}` }, { status: 500 });
    }

    return NextResponse.json({ profile: created });
  } catch (err) {
    return errorResponse(err);
  }
}

interface PatchProfileBody {
  fullName: string;
  company?: string;
  role?: "admin" | "reviewer";
}

/**
 * PATCH /api/profile
 * Called once, from /onboarding, right after signup. Sets full_name (the
 * signal /dashboard's layout checks to decide whether onboarding is done)
 * plus company + role.
 *
 * NOTE: `role` and `company` aren't in the `profiles` reference schema in
 * technical.md — if your migration doesn't have them yet, add:
 *   ALTER TABLE profiles ADD COLUMN role text DEFAULT 'admin';
 *   ALTER TABLE profiles ADD COLUMN company text;
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireSession();
    const body = (await request.json()) as PatchProfileBody;

    if (!body.fullName || typeof body.fullName !== "string") {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }
    if (body.role !== undefined && body.role !== "admin" && body.role !== "reviewer") {
      return NextResponse.json({ error: "role must be 'admin' or 'reviewer'" }, { status: 400 });
    }

    const admin = createAdminClient();

    // First check if the profile exists
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    let data, error;
    if (!existingProfile) {
      // Profile doesn't exist yet: create it with upsert
      ({ data, error } = await admin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: body.fullName.trim(),
          company: body.company?.trim() || null,
          role: body.role || "admin",
        })
        .select("*")
        .single());
    } else {
      // Profile exists: update it
      const updateData: any = {
        full_name: body.fullName.trim(),
      };
      if (body.company !== undefined) {
        updateData.company = body.company?.trim() || null;
      }
      if (body.role) {
        updateData.role = body.role;
      }

      ({ data, error } = await admin
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select("*")
        .single());
    }

    if (error) {
      return NextResponse.json({ error: `Failed to update profile: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ profile: data });
  } catch (err) {
    return errorResponse(err);
  }
}