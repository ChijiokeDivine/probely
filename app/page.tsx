"use client";

import { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

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
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const [setHeroRef, isHeroInView] = useInView();
  return (
    <div
      className={jakartaSans.className}
      style={{
        minHeight: "100vh",
        background: "url('/image.webp') center/cover no-repeat, #1A0E07",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
      `}
    </style>
     

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
        }}
      >
        {/* Logo */}
        <a
          href="#"
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
                color: "rgba(255,255,255,0.72)",
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

          {/* Get started */}

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
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <section
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: isMobile ? "center" : "flex-start",
          minHeight: "calc(100vh - 78px)",
          padding: isMobile ? "40px 20px" : "0 48px",
          position: "relative",
          zIndex: 5,
        }}
        

      >
        {/* ── Left: text content ── */}
        <div
          style={{
            flex: isMobile ? "0 0 100%" : "0 0 46%",
            maxWidth: isMobile ? "100%" : "46%",
            paddingBottom: isMobile ? "40px" : "72px",
            paddingTop: isMobile ? "40px" : "12px",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {/* Trust badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.065)",
              border: "1px solid rgba(255,255,255,0.11)",
              borderRadius: "50px",
              marginBottom: isMobile ? "28px" : "38px",
              overflow: "hidden",
              flexWrap: "wrap",
              justifyContent: "center",
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
              style={{
                color: "white",
                fontSize: isMobile ? "clamp(36px, 10vw, 48px)" : "clamp(54px, 6.2vw, 86px)",
                fontWeight: "300",
                lineHeight: "1.04",
                letterSpacing: isMobile ? "-1.5px" : "-2.8px",
                margin: isMobile ? "0 0 20px 0" : "0 0 26px 0",
                wordBreak: "keep-all",
              }}
              className="anim-h1"
          
            >
              Better hiring 
              <br />
              starts here
            </h1>

            {/* Subtitle */}
            <p
              style={{
                color: "rgba(255, 255, 255, 0.93)",
                fontSize: isMobile ? "15px" : "17.5px",
                fontWeight: "400",
                lineHeight: "1.65",
                margin: isMobile ? "0 auto 32px auto" : "0 0 46px 0",
                maxWidth: isMobile ? "100%" : "420px",
                letterSpacing: "0px",
              }}
              className="anim-p"
            >
              Collect unbiased interview feedback and make 
              <br className="hidden md:block" /> more confident hiring decisions.
            </p>
          </div>

          {/* CTA Button */}
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

                // The magic
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

   
      </section>



      {/* ── QR code — bottom right ── */}
      <div
        onMouseEnter={() => setQrHovered(true)}
        onMouseLeave={() => setQrHovered(false)}
        style={{
          position: "absolute",
          bottom: isMobile ? "15px" : "20px",
          right: isMobile ? "15px" : "20px",
          width: isMobile ? "70px" : "90px",
          height: isMobile ? "70px" : "90px",
          background: "white",
          borderRadius: "10px",
          border: isMobile ? "7px solid rgba(0, 0, 0, 0.89)" : "10px solid rgba(0, 0, 0, 0.89)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "6px" : "8px",
          zIndex: 20,
          cursor: "pointer",
          transform: qrHovered ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.2s ease-out",
        }}
      >
        <Image
          src="/qr-code.png"
          alt="QR code"
          width={isMobile ? 58 : 74}
          height={isMobile ? 58 : 74}
          loading="eager"
        />
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