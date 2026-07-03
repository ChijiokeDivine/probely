// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/respond";
import { createAdminClient } from "@/lib/supabase/admin";

interface PatchProfileBody {
  fullName: string;
  company?: string;
  role: "admin" | "reviewer";
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
    if (body.role !== "admin" && body.role !== "reviewer") {
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
          role: body.role,
        })
        .select("id, full_name, company, role")
        .single());
    } else {
      // Profile exists: update it
      ({ data, error } = await admin
        .from("profiles")
        .update({
          full_name: body.fullName.trim(),
          company: body.company?.trim() || null,
          role: body.role,
        })
        .eq("id", user.id)
        .select("id, full_name, company, role")
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