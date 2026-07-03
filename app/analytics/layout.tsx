import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardShell from "@/app/dashboard/DashboardShell";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, wallet_status")
    .eq("id", data.user.id)
    .single();

  if (!profile?.full_name) {
    redirect("/onboarding");
  }

  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <DashboardShell profile={{ full_name: profile.full_name, email: profile.email ?? data.user.email }}>
        {children}
      </DashboardShell>
    </div>
  );
}
