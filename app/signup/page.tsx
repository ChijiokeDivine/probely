"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Custom hook to get viewport width
function useViewportWidth() {
  const [width, setWidth] = useState(1200); // SSR-safe default; real width applied post-mount
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // sync to actual width once mounted
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return width;
}

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Get the next parameter from URL
  const next = searchParams.get("next") || "/dashboard";

  useEffect(() => { setMounted(true); }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmations are off — we already have a session.
      // Make sure this user has a wallet before we send them in,
      // in case the Supabase webhook hasn't fired yet.
      await fetch("/api/wallet/ensure", { method: "POST" });
      router.push(next);
      router.refresh();
      return;
    }

    // Email confirmation required — the wallet gets created in the
    // background (Supabase webhook) the moment the account exists,
    // well before the user ever confirms and lands on the dashboard.
    setCheckEmail(true);
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setError("");
    setGoogleLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google — nothing else to do here.
  }

  return (
      <div
        className={[
          "min-h-screen w-full flex flex-col",
          mounted && "ready",
          jakartaSans.className,
        ]
          .filter(Boolean)
          .join(" ")}
        >
      <style>{`
        .anim-logo, .anim-welcome, .anim-form-header, .anim-form-field, .anim-form-button, .anim-form-link { opacity: 0; }
        input:focus { outline: none !important; box-shadow: none !important; }
        .ready .anim-logo { animation: slideDown 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-welcome { animation: revealUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s forwards; }
        .ready .anim-form-header { animation: revealUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-form-field:nth-child(1) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards; }
        .ready .anim-form-field:nth-child(2) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s forwards; }
        .ready .anim-form-field:nth-child(3) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s forwards; }
        .ready .anim-form-button { animation: springUp 0.65s cubic-bezier(0.34,1.45,0.64,1) 0.75s forwards; }
        .ready .anim-form-link { animation: scaleFade 0.7s cubic-bezier(0.22,1,0.36,1) 0.9s forwards; }
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
            Honio
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
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
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

          {/* Log in button */}
          <Link href="/login">
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
              Log in
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left side image panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 bg-white">

        <div className="w-full max-w-md">
          <div className="anim-form-header">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-5">
              Create account
            </h1>
            
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {checkEmail ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-6 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900 mb-1.5">Check your inbox</p>
              <p>We sent a confirmation link to your email. Click it to activate your account — your wallet will already be set up by the time you log in.</p>
            </div>
          ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="anim-form-field">
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
              <input id="name" name="name" type="text"
                className="w-full px-4 py-2 text-black rounded-lg border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 md:text-md text-sm"
                placeholder="" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <input id="email" name="email" type="email"
                className="w-full px-4 py-2 text-black rounded-lg border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 md:text-md text-sm"
                placeholder="" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
              <input id="password" name="password" type="password" minLength={8}
                className="w-full px-4 py-2 text-black rounded-lg border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 md:text-md text-sm"
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
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 text-xs">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="
              w-full
              py-3.5
              rounded-full
              border
              border-neutral-300
              bg-white
              text-neutral-900
              font-semibold

              flex
              items-center
              justify-center
              gap-3

              shadow-[0_4px_0_rgb(212,212,212)]

              transition-all
              duration-75

              hover:bg-neutral-50

              active:translate-y-1
              active:shadow-none

              disabled:opacity-60
              disabled:cursor-not-allowed
              disabled:active:translate-y-0
              disabled:active:shadow-[0_4px_0_rgb(212,212,212)]
            "
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

        </div>
      </div>

      {/* Right side form */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/womancv.webp')" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
        <div className=" mb-12">
          <Link href="/" 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
       
          </Link>
        </div>
          <div className="anim-welcome">
            <h2 className="text-4xl font-normal leading-tight mb-4">
              The future of hiring<br />decisions.
            </h2>
            <p className="text-white/80 leading-relaxed">
              Structured reviews, private scoring, and fair candidate evaluation from start to finish.
            </p>
          </div>
        </div>
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
          "#000")
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
