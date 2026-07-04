"use client";

import { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import UnifyFinancesSection from "./components/UnifyFinancesSection";
import FlowmapBackground from "./components/Flowmapbackground";
import LogoTicker from "./components/LogoTicker";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Custom hook to detect when an element is in view
function useInView(options = {}) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, options]);

  return [setRef, isInView] as const;
}

export default function Home() {
  const [qrHovered, setQrHovered] = useState(false);
  const [setHeroRef, isHeroInView] = useInView();
  return (
    <>
    <section
      className={`${jakartaSans.className} relative overflow-hidden min-h-screen`}
      style={{
        background: "#1A0E07",
      }}
    >
      {/* Animated flowmap-distorted background */}
      <FlowmapBackground src="/image.webp" className="z-0" />

    <style>{`
          .ready .anim-h1 {
            animation: revealUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.45s forwards;
          }
          .ready .anim-p {
            animation: revealRight 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.85s forwards;
          }
          .anim-h1, .anim-p {
            opacity: 0;
          }
          .anim-h1 {
            transform: translateY(24px);
            clip-path: inset(100% 0 0 0);
          }
          .anim-p {
            transform: translateX(-24px);
            clip-path: inset(0 100% 0 0);
          }
          @keyframes revealUp {
            from {
              opacity: 0;
              transform: translateY(24px);
              clip-path: inset(100% 0 0 0);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              clip-path: inset(0% 0 0 0);
            }
          }
          @keyframes revealRight {
            from {
              opacity: 0;
              transform: translateX(-24px);
              clip-path: inset(0 100% 0 0);
            }
            to {
              opacity: 1;
              transform: translateX(0);
              clip-path: inset(0 0% 0 0);
            }
          }
          @keyframes corgiBounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-12px);
            }
          }
      `}
    </style>


      {/* ══════════════ NAVBAR ══════════════ */}
      <nav
        className="flex items-center justify-between relative z-20 px-5 md:px-12"
        style={{ height: "78px" }}
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2 no-underline flex-shrink-0"
        >
          {/* MoonPay logomark: planet dot */}
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
          <span
            style={{
              color: "white",
              fontSize: "17.5px",
              fontWeight: "700",
              letterSpacing: "-0.3px",
            }}
          >
            Probely
          </span>
        </a>

        {/* Center nav links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-0.5">
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

        {/* Right actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Globe / language - hidden on mobile */}
          <button
            aria-label="Select language"
            className="hidden md:flex items-center justify-center bg-none border-none cursor-pointer p-2"
            style={{ color: "rgba(255,255,255,0.72)" }}
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

          {/* Get started */}
          <Link href="/signup">
            <button
              className="px-5 py-[9px] md:px-[26px] md:py-[11px] text-sm md:text-[15px] whitespace-nowrap"
              style={{
                background: "#fff",
                color: "#1A0E07",
                border: "1px solid #D9D9D9",
                borderRadius: "999px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
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
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <section
        className="flex items-start md:items-center justify-center md:justify-start relative z-[5] px-5 md:px-12 py-10 md:py-0"
        style={{
          minHeight: "calc(100vh - 78px)",
        }}
      >
        {/* ── Left: text content ── */}
        <div className="flex-none w-full md:w-[46%] max-w-full md:max-w-[46%] pb-10 md:pb-[72px] pt-10 md:pt-3 text-center md:text-left">
          {/* Trust badge */}
          <div className="inline-flex items-center rounded-[50px] overflow-hidden flex-wrap justify-center mb-7 md:mb-[38px]"
            style={{
              background: "rgba(255,255,255,0.065)",
              border: "1px solid rgba(255,255,255,0.11)",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: "11px",
                fontWeight: "400",
                padding: "8px 16px",
                letterSpacing: "0px",
              }}
            >
              Find the candidates who truly stand out
            </span>
          </div>

          {/* Headline */}
          <div ref={setHeroRef} className={isHeroInView ? "ready" : ""}>
            <h1
              className="anim-h1 text-[clamp(36px,10vw,48px)] md:text-[clamp(54px,6.2vw,86px)] tracking-[-1.5px] md:tracking-[-2.8px] mb-5 md:mb-[26px]"
              style={{
                color: "white",
                fontWeight: "300",
                lineHeight: "1.04",
                wordBreak: "keep-all",
              }}
            >
              Better hiring
              <br />
              starts here
            </h1>

            {/* Subtitle */}
            <p
              className="anim-p text-[15px] md:text-[17.5px] mx-auto md:mx-0 mb-8 md:mb-[46px] max-w-full md:max-w-[420px]"
              style={{
                color: "rgba(255, 255, 255, 0.93)",
                fontWeight: "400",
                lineHeight: "1.65",
                letterSpacing: "0px",
              }}
            >
              Collect unbiased interview feedback and make
              <br className="hidden md:block" /> more confident hiring decisions.
            </p>
          </div>

          {/* CTA Button */}
          <Link href="/signup">
            <button
              className="px-5 py-[9px] md:px-[26px] md:py-[11px] text-sm md:text-[15px] whitespace-nowrap"
              style={{
                background: "#fff",
                color: "#1A0E07",
                border: "1px solid #D9D9D9",
                borderRadius: "999px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
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
              Get started
            </button>
          </Link>

          <div className="h-64 mt-[50px] overflow-hidden relative md:hidden block rounded-[10px]">
            <Image
              src="/main.webp"
              alt="Collect Feedback"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
        
      </section>
      

      {/* ── QR code — bottom right ── */}
      <div
        onMouseEnter={() => setQrHovered(true)}
        onMouseLeave={() => setQrHovered(false)}
        className="absolute hidden md:block bottom-[15px] right-[15px] md:bottom-5 md:right-5 w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-[10px] border-[7px] md:border-[10px] border-black/[0.89] flex items-center justify-center p-[6px] md:p-2 z-20 cursor-pointer"
        style={{
          transform: qrHovered ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.2s ease-out",
        }}
      >
        <Image
          src="/qr-code.png"
          alt="QR code"
          width={74}
          height={74}
          loading="eager"
          className="w-[58px] h-[58px] md:w-[74px] md:h-[74px] aspect-square"
        />
      </div>
    </section>
    <LogoTicker />
    <UnifyFinancesSection />
    
    {/* Features Cards Section */}
    <section
      className={`${jakartaSans.className} min-h-[600px] flex flex-col items-center justify-center px-5 py-[60px]`}
      style={{
        background: "#ffffff",
      }}
    >
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-[#fafafa] md:rounded-[32px] rounded-[15px] overflow-hidden">
            <div className="h-64 overflow-hidden relative">
              <Image
                src="/reviews.webp"
                alt="Create Reviews"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <h3 className="text-[22px] font-bold text-[#1A0E07] mb-3">Create Reviews</h3>
              <p className="text-[14px] text-black/70 mb-8 leading-relaxed">
                Set up structured interviews with custom scoring criteria, category weights, and auto-advance rules for consistent hiring.
              </p>
              <button
                className="px-6 py-3 text-sm font-semibold"
                style={{
                  background: "#1A0E07",
                  color: "white",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Learn more
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#fafafa] md:rounded-[32px] rounded-[15px] overflow-hidden">
            <div className="h-64 overflow-hidden relative">
              <Image
                src="/feedback.webp"
                alt="Collect Feedback"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <h3 className="text-[22px] font-bold text-[#1A0E07] mb-3">Collect Feedback</h3>
              <p className="text-[14px] text-black/70 mb-8 leading-relaxed">
                Gather unbiased input from interviewers with blind scoring and encrypted scorecards to ensure fair evaluations.
              </p>
              <button
                className="px-6 py-3 text-sm font-semibold"
                style={{
                  background: "#1A0E07",
                  color: "white",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Learn more
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#fafafa] md:rounded-[32px] rounded-[15px] overflow-hidden">
            <div className="h-64 overflow-hidden relative">
              <Image
                src="/templatepage.webp"
                alt="Analytics Dashboard"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <h3 className="text-[22px] font-bold text-[#1A0E07] mb-3">Analytics Dashboard</h3>
              <p className="text-[14px] text-black/70 mb-8 leading-relaxed">
                Track hiring metrics, review turnaround times, and identify top-performing candidates with detailed insights.
              </p>
              <button
                className="px-6 py-3 text-sm font-semibold"
                style={{
                  background: "#1A0E07",
                  color: "white",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* Corgi Insurance Section */}
    <section
      className={`${jakartaSans.className} min-h-screen flex flex-col items-center justify-center px-5 py-[60px]`}
      style={{
        background: "#2a2a2a",
      }}
    >
      {/* Image */}
      <div className="w-full max-w-4xl h-auto relative overflow-hidden rounded-xl mb-10">
        <Image
          src="/main.webp"
          alt="Probely Dashboard"
          width={1000}
          height={600}
          className="w-full h-auto object-contain"
        />
      </div>
      
      {/* Headline */}
      <h2
        className="text-center max-w-[900px] mb-10"
        style={{
          color: "white",
          fontSize: "clamp(22px, 5vw, 40px)",
          fontWeight: "700",
          lineHeight: "1.2",
        }}
      >
        One bad hire costs 30% of their annual salary. Probely is priced against that risk, not your headcount.
      </h2>

      {/* Buttons Row */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          style={{
            background: "white",
            color: "#1a1a1a",
            border: "1px solid #e0e0e0",
            borderRadius: "999px",
            padding: "14px 28px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 0 #d0d0d0",
            transition: "transform 0.08s ease, box-shadow 0.08s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(4px)";
            e.currentTarget.style.boxShadow = "0 0 0 #d0d0d0";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 0 #d0d0d0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 0 #d0d0d0";
          }}
        >
          Get started
        </button>
      </div>
    </section>

    {/* Footer Section */}
    <section className={`${jakartaSans.className} bg-[#171717]`}>
      <div className="max-w-6xl mx-auto px-5 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo & Tagline */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-6">
              {/* Probely logomark */}
              <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9.5" cy="13.5" r="7.5" fill="white" />
                <circle cx="9.5" cy="13.5" r="3.4" fill="#171717" />
                <circle cx="20" cy="13.5" r="4.8" fill="rgba(255,255,255,0.52)" />
              </svg>
              <span style={{ color: "white", fontSize: "17.5px", fontWeight: 700, letterSpacing: "-0.3px" }}>Probely</span>
            </a>
            <p className="text-white/60 text-sm leading-relaxed">Better hiring starts here. Collect unbiased interview feedback and make confident decisions.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">How it works</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 text-sm hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs">© 2025 Probely. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
    </>
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
        color: `rgba(255,255,255,${opacity})`,
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
          "rgba(255,255,255,0.96)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.color =
          `rgba(255,255,255,${opacity})`)
      }
    >
      {children}
    </a>
  );
}