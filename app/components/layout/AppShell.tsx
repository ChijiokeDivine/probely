// components/layout/AppShell.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardShell from "@/app/dashboard/DashboardShell";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", data.user.id)
    .single();

  if (!profile?.full_name) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell profile={{ full_name: profile.full_name, email: profile.email ?? data.user.email }}>
      {children}
    </DashboardShell>
  );
}