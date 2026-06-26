"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Custom hook to get viewport width
function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return width;
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { setMounted(true); }, []);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <div className={`min-h-screen w-full flex flex-col ${mounted ? "ready" : ""} ${jakartaSans.className}`}>
      <style>{`
        .anim-logo, .anim-form-header, .anim-form-field, .anim-form-button, .anim-form-link { opacity: 0; }
        input:focus { outline: none !important; box-shadow: none !important; }
        .ready .anim-logo { animation: slideDown 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-form-header { animation: revealUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-form-field:nth-child(1) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards; }
        .ready .anim-form-field:nth-child(2) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s forwards; }
        .ready .anim-form-button { animation: springUp 0.65s cubic-bezier(0.34,1.45,0.64,1) 0.6s forwards; }
        .ready .anim-form-link { animation: scaleFade 0.7s cubic-bezier(0.22,1,0.36,1) 0.75s forwards; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes revealUp { from { opacity:0; transform:translateY(24px); clip-path:inset(100% 0 0 0); } to { opacity:1; transform:translateY(0); clip-path:inset(0% 0 0 0); } }
        @keyframes scaleFade { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes springUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 20px" : "0 48px",
          height: "78px",
          position: "relative",
          zIndex: 20,
          background: "#f9f9f9",
          borderBottom: "1px solid #E5E5E5",
        }}
      >
        {/* Logo */}
        <Link href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {/* MoonPay logomark: planet dot */}
          <svg
            width="27"
            height="27"
            viewBox="0 0 27 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="9.5" cy="13.5" r="7.5" fill="#000" />
            <circle cx="9.5" cy="13.5" r="3.4" fill="white" />
            <circle cx="20" cy="13.5" r="4.8" fill="#000" />
          </svg>
          <span
            style={{
              color: "#000",
              fontSize: "17.5px",
              fontWeight: "700",
              letterSpacing: "-0.3px",
            }}
          >
            Probely
          </span>
        </Link>

        {/* Center nav links - hide on mobile */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {/* Section tabs */}
      
            <NavLink href="#" opacity={0.78}>
              How it works
            </NavLink>
            <NavLink href="#" opacity={0.78}>
              Features
            </NavLink>
            <NavLink href="#" opacity={0.78}>
              Security
            </NavLink>

         
          </div>
        )}

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {/* Globe / language - hide on mobile */}
          {!isMobile && (
            <button
              aria-label="Select language"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#000",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
          )}

          {/* Sign up button */}
          <Link href="/signup">
            <button
              style={{
                background: "#fff",
                color: "#1A0E07",
                border: "1px solid #D9D9D9",
                borderRadius: "999px",
                padding: isMobile ? "9px 20px" : "11px 26px",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                letterSpacing: "-0.1px",
                boxShadow: "0 4px 0 #CFCFCF",
                transition: "transform 0.08s ease, box-shadow 0.08s ease",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "0 0 0 #CFCFCF";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 0 #CFCFCF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 0 #CFCFCF";
              }}
            >
              Sign up
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">

          <div className="anim-form-header">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-5">
              Set a new password
            </h1>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {done ? (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              Password updated — taking you to log in…
            </div>
          ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="anim-form-field">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                New password
              </label>
              <input id="password" name="password" type="password" minLength={8}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm password
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" minLength={8}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="" required />
            </div>

            <button type="submit" disabled={loading}
              className="
                w-full
                rounded-full
                border border-neutral-700
                bg-neutral-900
                py-3.5
                font-semibold
                text-white

                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_0_rgb(38,38,38)]

                transition-all
                duration-75

                hover:bg-neutral-800

                active:translate-y-1
                active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]

                disabled:opacity-60
                disabled:cursor-not-allowed
              ">
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
          )}

          <p className="anim-form-link mt-4 text-center text-neutral-500 text-sm">
            Remembered it after all?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable nav link component ── */
function NavLink({
  href,
  children,
  opacity = 0.78,
}: {
  href: string;
  children: React.ReactNode;
  opacity?: number;
}) {
  return (
    <a
      href={href}
      style={{
        color: "#000",
        fontSize: "15px",
        fontWeight: "500",
        textDecoration: "none",
        padding: "7px 14px",
        borderRadius: "8px",
        letterSpacing: "-0.1px",
        transition: "color 0.18s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.color =
          "rgba(0,0,0,0.96)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.color =
          "#000")
      }
    >
      {children}
    </a>
  );
}
