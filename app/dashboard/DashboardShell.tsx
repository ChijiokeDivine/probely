// app/dashboard/DashboardShell.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "../components/layout/Sidebar";

interface Profile {
  full_name?: string | null;
  email?: string | null;
}

const ProfileContext = createContext<Profile>({});

/** Read the signed-in admin's profile from anywhere under /dashboard. */
export function useProfile() {
  return useContext(ProfileContext);
}

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setUnreadCount(json.notifications?.length ?? 0);
      } catch {
        // non-critical — silently ignore
      }
    }
    loadUnread();
    const id = setInterval(loadUnread, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    setShowDropdown(false);
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
    <div className="flex min-h-screen">
      <Sidebar
        profile={profile}
        unreadCount={unreadCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-only top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-[#FFFFFF]/95 backdrop-blur border-b border-black/[0.07]">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] text-[#1A0E07]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center">
              <svg
                width="27"
                height="27"
                viewBox="0 0 27 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <circle cx="9.5" cy="13.5" r="7.5" fill="#1A0E07" />
                <circle cx="9.5" cy="13.5" r="3.4" fill="#1A0E07" />
                <circle cx="20" cy="13.5" r="4.8" fill="#1A0E07" />
              </svg>
            </div>
            <span className="text-[14.5px] font-bold text-[#1A0E07]">Probely</span>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex sticky top-0 z-30 items-center justify-between px-8 h-16 bg-[#FFFFFF]/95 backdrop-blur border-b border-black/[0.07]">
          <span className="text-[15px] font-semibold text-black/70"></span>

          <div className="flex items-center gap-3" ref={dropdownRef}>
            

            <div className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-black/[0.04] cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="w-9 h-9 rounded-full bg-[#1A0E07] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/45">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute top-14 right-8 w-64 bg-white rounded-xl border border-black/[0.08] shadow-lg py-2 z-50">
                <Link
                  href="/notifications"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-black/70 hover:bg-black/[0.03] hover:text-black/90"
                  onClick={() => setShowDropdown(false)}
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
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-black/70 hover:bg-black/[0.03] hover:text-black/90"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Account settings
                </Link>
                <div className="h-px bg-black/[0.07] my-2" />
                <button
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-black/70 hover:bg-black/[0.03] hover:text-red-700 w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  {signingOut ? "Logging out…" : "Log out"}
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 min-w-0">
          <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
        </main>
      </div>
    </div>
  );
}