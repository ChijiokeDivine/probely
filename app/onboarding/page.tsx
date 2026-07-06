// app/onboarding/page.tsx
"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

function useViewportWidth() {
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

type Role = "admin" | "reviewer";

function OnboardingPageContent() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the next parameter from URL
  const next = searchParams.get("next");

  useEffect(() => setMounted(true), []);

  async function handleFinish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!role) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          company: role === "admin" ? company.trim() || undefined : undefined,
          role,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong — try again.");
      }

      router.push(next || (role === "admin" ? "/dashboard" : "/inbox"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className={["min-h-screen w-full flex flex-col", mounted && "ready", jakartaSans.className]
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
        <div className="anim-logo" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.5" cy="13.5" r="7.5" fill="#000" />
            <circle cx="9.5" cy="13.5" r="3.4" fill="white" />
            <circle cx="20" cy="13.5" r="4.8" fill="#000" />
          </svg>
          <span style={{ color: "#000", fontSize: "17.5px", fontWeight: 700, letterSpacing: "-0.3px" }}>Honio</span>
        </div>

        <div className="text-[13px] font-medium text-black/40">Step {step} of 2</div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left — form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 bg-white">
          <div className="w-full max-w-md">
            {step === 1 ? (
              <>
                <div className="anim-form-header">
                  <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">How will you use Honio?</h1>
                  <p className="text-sm text-neutral-500 mb-7">You can always invite people into the other role later.</p>
                </div>

                <div className="space-y-3 mb-7">
                  <RoleCard
                    className="anim-form-field"
                    selected={role === "admin"}
                    onClick={() => setRole("admin")}
                    title="I'm hiring"
                    subtitle="Create reviews, manage interviewers"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    }
                  />
                  <RoleCard
                    className="anim-form-field"
                    selected={role === "reviewer"}
                    onClick={() => setRole("reviewer")}
                    title="I was invited to review"
                    subtitle="Submit interview feedback"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    }
                  />
                </div>

                <button
                  type="button"
                  disabled={!role}
                  onClick={() => setStep(2)}
                  className="anim-form-button w-full rounded-full border border-neutral-700 bg-neutral-900 py-3.5 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_0_rgb(38,38,38)] transition-all duration-75 hover:bg-neutral-800 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_0_rgb(38,38,38)]"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="anim-form-header">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-neutral-400 hover:text-neutral-700 mb-4 flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    Back
                  </button>
                  <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-5">Your details</h1>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <form onSubmit={handleFinish} className="space-y-5">
                  <div className="anim-form-field">
                    <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">Full name</label>
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 text-black rounded-lg border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 md:text-md text-sm"
                      placeholder=""
                      required
                    />
                  </div>

                  {role === "admin" && (
                    <div className="anim-form-field">
                      <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-2">
                        Company <span className="text-neutral-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        type="text"
                        className="w-full px-4 py-2 text-black rounded-lg border border-neutral-200 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 md:text-md text-sm"
                        placeholder=""
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !fullName.trim()}
                    className="anim-form-button w-full rounded-full border border-neutral-700 bg-neutral-900 py-3.5 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_0_rgb(38,38,38)] transition-all duration-75 hover:bg-neutral-800 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Setting up…" : "Finish setup"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right — image panel, same as signup/login */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/womancv.webp')" }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            <div className="mb-12">
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9.5" cy="13.5" r="7.5" fill="white" />
                  <circle cx="9.5" cy="13.5" r="3.4" fill="#1A0E07" />
                  <circle cx="20" cy="13.5" r="4.8" fill="rgba(255,255,255,0.52)" />
                </svg>
                <span style={{ color: "white", fontSize: "17.5px", fontWeight: 700, letterSpacing: "-0.3px" }}>Honio</span>
              </Link>
            </div>
            <div className="anim-welcome">
              <h2 className="text-4xl font-normal leading-tight mb-4">
                {role === "reviewer" ? (
                  <>Your read on this<br />candidate matters.</>
                ) : (
                  <>Almost there —<br />set up your workspace.</>
                )}
              </h2>
              <p className="text-white/80 leading-relaxed">
                {role === "reviewer"
                  ? "Your scores stay encrypted until every interviewer has submitted. No anchoring, no bias, no one peeking early — not even us."
                  : "One more step and you're ready to create your first blind, encrypted review."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">Loading...</div>}>
      <OnboardingPageContent />
    </Suspense>
  );
}

function RoleCard({
  selected,
  onClick,
  title,
  subtitle,
  icon,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className ?? ""} w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border transition-colors ${
        selected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-neutral-900">{title}</div>
        <div className="text-[13px] text-neutral-500">{subtitle}</div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-neutral-900" : "border-neutral-300"
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />}
      </div>
    </button>
  );
}
