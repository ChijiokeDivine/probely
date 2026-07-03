// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z" />
      </svg>
    ),
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Candidates",
    href: "/candidates",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20c.7-3.4 3.3-5.4 6.5-5.4s5.8 2 6.5 5.4" />
        <circle cx="17.5" cy="9" r="2.4" />
        <path d="M15.8 14.8c2.4.3 4.2 2 4.8 4.7" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V10M12 20V4M20 20v-7" />
      </svg>
    ),
  },
  {
    label: "Team",
    href: "/settings/team",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 20c.6-3.2 2.9-5.1 5.5-5.1s4.9 1.9 5.5 5.1M14.8 15.3c2 .3 3.6 1.8 4.1 4.2" />
      </svg>
    ),
  },
  {
    label: "Templates",
    href: "/settings/templates",
    icon: (active) => (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.2" />
        <rect x="14" y="3" width="7" height="7" rx="1.2" />
        <rect x="3" y="14" width="7" height="7" rx="1.2" />
        <rect x="14" y="14" width="7" height="7" rx="1.2" />
      </svg>
    ),
  },
];

interface Profile {
  full_name?: string | null;
  email?: string | null;
}

export default function Sidebar({
  profile,
  unreadCount = 0,
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: {
  profile?: Profile;
  unreadCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  const initials = (profile?.full_name || profile?.email || "PB")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen shrink-0 z-50 lg:z-0 flex flex-col
        bg-[#FFFFFF] border-r border-black/[0.08] transition-all duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        ${collapsed ? "w-[80px]" : "w-[240px]"}`}
      >
        {/* Workspace switcher */}
        <div className={`flex items-center gap-2.5 ${collapsed ? "px-2" : "px-5"} pt-5 pb-4`}>
          {collapsed && onToggleCollapse ? (
            <button
              onClick={onToggleCollapse}
              className="mx-auto w-8 h-8 rounded-lg bg-[#1A0E07] flex items-center justify-center shrink-0 hover:bg-[#2b1a0e] transition-colors"
              aria-label="Expand sidebar"
            >
              <svg
                width="27"
                height="27"
                viewBox="0 0 27 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="9.5" cy="13.5" r="7.5" fill="white" />
                <circle cx="9.5" cy="13.5" r="3.4" fill="#1A0E07" />
                <circle cx="20" cy="13.5" r="4.8" fill="rgba(255,255,255,0.52)" />
              </svg>
            </button>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#1A0E07] flex items-center justify-center shrink-0">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 27 27"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="9.5" cy="13.5" r="7.5" fill="white" />
                  <circle cx="9.5" cy="13.5" r="3.4" fill="#1A0E07" />
                  <circle cx="20" cy="13.5" r="4.8" fill="rgba(255,255,255,0.52)" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-[#1A0E07] truncate">Probely</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-black/[0.04] text-black/45"
                    aria-label="Collapse sidebar"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 19l-7-7 7-7" />
                      <path d="M18 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <button className="text-black/35 hover:text-black/60 lg:hidden" onClick={onCloseMobile} aria-label="Close menu">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Primary nav */}
        <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 md:my-1 rounded-[10px] text-[14px] font-medium transition-colors
                ${active ? "bg-white text-[#1A0E07] " : "text-black/60 hover:bg-black/[0.04] hover:text-black/80"}`}
              >
                <span className={active ? "text-[#1A0E07]" : "text-black/45"}>{item.icon(!!active)}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-4 ${collapsed ? "mx-2" : "mx-5"} h-px bg-black/[0.07]"`} />

        <div className={`mt-4 flex flex-col gap-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          <Link
            href="/reviews/new"
            className={`flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#1A0E07] hover:bg-[#2b1a0e] transition-colors`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {!collapsed && "New review"}
          </Link>
        </div>

        {/* Mobile only: show additional menu items */}
        <div className="px-3 mt-4 flex flex-col gap-0.5 lg:hidden">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-black/60 hover:bg-black/[0.04] relative"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A0E07] text-white text-[10.5px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-black/60 hover:bg-black/[0.04]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Account settings
          </Link>
        </div>

        <div className="flex-1" />

        {/* User section */}
        <div className={`pb-4 ${collapsed ? "px-2" : "px-3"}`}>
          {/* Desktop: show name with logout button */}
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className={`hidden lg:flex w-full items-center ${collapsed ? "justify-center px-0" : "justify-between gap-2.5 px-3"} py-2.5 rounded-[10px] hover:bg-black/[0.04] hover:text-red-700`}
          >
            {collapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-black/45">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1A0E07] text-white text-[12px] font-bold flex items-center justify-center shrink-0 relative">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#1A0E07] truncate">
                      {profile?.full_name || "Your account"}
                    </div>
                    <div className="text-[11px] text-black/40 truncate">{profile?.email}</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-black/45">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5M21 12H9" />
                </svg>
              </>
            )}
          </button>

          {/* Mobile only: simple logout button */}
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="lg:hidden flex w-full items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-black/60 hover:bg-black/[0.04] hover:text-red-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>
    </>
  );
}