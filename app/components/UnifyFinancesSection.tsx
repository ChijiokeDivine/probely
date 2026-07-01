"use client";

import { useEffect, useRef } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const cardData = [
  {
    id: "laptop",
    type: "photo",
    src: "/greengirl.webp",
    top: "8%",
    left: "10%",
    initialTop: "8%",
    initialLeft: "-30%", // Start far left off-screen
    width: "w-32 sm:w-44 md:w-72",
    rotate: "-rotate-1",
  },
  {
    id: "balance",
    type: "card-blue",
    mobileSrc: "/darkwoman.webp",
    top: "10%",
    left: "80%",
    initialTop: "10%",
    initialLeft: "130%", // Start far right off-screen
    width: "w-28 sm:w-40 md:w-64",
  },
  {
    id: "exchange",
    type: "card-green",
    mobileSrc: "/pressingpc.webp",
    top: "45%",
    left: "8%",
    initialTop: "45%",
    initialLeft: "-30%", // Start far left off-screen
    width: "w-28 sm:w-36 md:w-60",
  },
  {
    id: "jane",
    type: "card-pink",
    top: "88%",
    src: "/guysonpc.webp",
    left: "25%",
    initialTop: "130%", // Start far bottom off-screen
    initialLeft: "25%",
    width: "w-28 sm:w-36 md:w-56",
  },
  {
    id: "coffee",
    type: "photo-badge",
    src: "/redgirl.webp",
    top: "80%",
    left: "85%",
    initialTop: "80%",
    initialLeft: "130%", // Start far right off-screen
    width: "w-32 sm:w-40 md:w-64",
    rotate: "rotate-1",
  },
];

export default function UnifyFinancesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);

      // anchor every card's CENTER at its own top/left point
      gsap.set(cards, { 
        xPercent: -50, 
        yPercent: -50, 
        opacity: 0 // Start hidden
      });

      // Set initial off-screen positions
      cards.forEach((card, index) => {
        const data = cardData[index];
        gsap.set(card, {
          top: data.initialTop,
          left: data.initialLeft
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=150%", // 1.5 viewport-heights to cover both animations
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          // markers: true, // uncomment while debugging
        },
      });

      // First animation: Slide cards into view
      cards.forEach((card, index) => {
        const data = cardData[index];
        tl.to(
          card,
          {
            left: data.left,
            top: data.top,
            opacity: 1,
            ease: "power3.out",
            duration: 0.5,
          },
          0 // Start all in-view animations at the same time
        );
      });

      // Second animation: Converge to center and fade out
      cards.forEach((card) => {
        tl.to(
          card,
          {
            left: "50%",
            top: "50%",
            scale: 0.25,
            opacity: 0,
            ease: "power2.inOut",
            duration: 1,
          },
          0.5 // Start converging after in-view animation completes
        );
      });

      // Animate headline color
      if (headlineRef.current) {
        tl.to(
          headlineRef.current,
          {
            color: "#3b82f6",
            ease: "power2.inOut",
            duration: 0.5
          },
          0.3 // Start color change 30% through
        );
        tl.to(
          headlineRef.current,
          {
            color: "#22c55e",
            ease: "power2.inOut",
            duration: 0.5
          },
          0.8 // Change to black at 80% through
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative w-screen max-w-full h-screen overflow-hidden overflow-x-hidden bg-white ${jakartaSans.className}`}
    >
      {/* decorative gradient arc, top edge */}
      <div
        className="pointer-events-none absolute -top-[30%] left-0 w-full h-[60%] opacity-90"

      />

      {/* center headline */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
        <h1 ref={headlineRef} className="text-center font-extrabold leading-[0.95] text-[#fe4525] text-[14vw] sm:text-[14vw] md:text-[15vw] lg:text-[10vw]">
          Blind hiring 
          <br />
          reviews
        </h1>
      </div>

      {/* floating elements */}
      {cardData.map((card, i) => (
        <div
          key={card.id}
          ref={(el) => { cardRefs.current[i] = el; }}
          className={`absolute z-10 ${card.width} ${card.rotate || ""}`}
          style={{ top: card.top, left: card.left }}
        >
          {card.type === "photo" && (
            <img
              src={card.src}
              alt=""
              className="w-full h-auto rounded-2xl object-cover shadow-xl aspect-[4/3]"
            />
          )}

          {card.type === "photo-badge" && (
            <div className="relative">
              <img
                src={card.src}
                alt=""
                className="w-full h-auto rounded-2xl object-cover shadow-xl aspect-[4/5]"
              />
             
            </div>
          )}

          {card.type === "card-blue" && (
            <>
              {/* Mobile: swap for a plain image */}
              <img
                src={card.mobileSrc}
                alt=""
                className="sm:hidden w-full h-auto rounded-2xl object-cover shadow-xl aspect-[4/5]"
              />

              {/* Tablet/desktop: full interactive card */}
              <div className="hidden sm:block rounded-2xl border-2 border-[#3b82f6] bg-white p-4 shadow-xl">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 27 27" fill="none">
                      <circle cx="9.5" cy="13.5" r="7.5" fill="#1A0E07" />
                      <circle cx="9.5" cy="13.5" r="3.4" fill="white" />
                      <circle cx="20" cy="13.5" r="4.8" fill="#1A0E07" opacity="0.35" />
                    </svg>
                    <span className="text-xs font-semibold tracking-tight text-gray-900">
                      Probely
                    </span>
                  </div>
                  <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Offer extended
                  </span>
                </div>

                {/* Headline */}
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  Adaeze, you got the job.
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400 leading-snug">
                  Senior Product Designer · Acme Corp
                </p>

                {/* Details */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">Panel score</span>
                    <span className="text-[11px] font-medium text-gray-900">8.4 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">Reviewers</span>
                    <span className="text-[11px] font-medium text-gray-900">4 panelists</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">Offer expires</span>
                    <span className="text-[11px] font-medium text-gray-900">Jul 8, 2025</span>
                  </div>
                </div>

                {/* Verified chip */}
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-600 flex-shrink-0">
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.4"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px]  text-green-700 font-medium">
                    Verified 
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-full bg-gray-900 py-2 text-[11px] font-semibold text-white">
                    Accept offer
                  </button>
                  <button className="flex-1 rounded-full bg-gray-100 py-2 text-[11px] font-semibold text-gray-900">
                    Request a call
                  </button>
                </div>

              </div>
            </>
          )}

          {card.type === "card-green" && (
            <>
              {/* Mobile: swap for a plain image */}
              <img
                src={card.mobileSrc}
                alt=""
                className="sm:hidden w-full h-auto rounded-2xl object-cover shadow-xl aspect-[4/3]"
              />

              {/* Tablet/desktop: full interactive card */}
              <div className="hidden sm:block rounded-2xl bg-[#1A0E07] p-4 shadow-xl text-white">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[8px] font-medium text-white/50 uppercase tracking-widest">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="5" width="10" height="7" rx="1.5"
                        stroke="currentColor" strokeWidth="1.2" />
                      <path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5"
                        stroke="currentColor" strokeWidth="1.2"
                        strokeLinecap="round" />
                    </svg>
                    Scores unlocked
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                    4 / 4
                  </span>
                </div>

                {/* Score */}
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-3xl font-bold tracking-tight leading-none">8.4</span>
                  <span className="mb-0.5 text-sm text-white/40 font-medium">/10</span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/40">
                  Senior Product Designer · Round 2
                </p>

                {/* Category bars */}
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: "Problem solving", val: 9 },
                    { label: "Technical depth", val: 8 },
                    { label: "Communication",   val: 8 },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 text-[10px] text-white/40 truncate">
                        {label}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-white/10">
                        <div
                          className="h-1 rounded-full bg-white/70"
                          style={{ width: `${val * 10}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-white/60 w-4 text-right">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-white/50">High panel agreement</span>
                  </div>
                 
                </div>

              </div>
            </>
          )}

          {card.type === "card-pink" && (
            <div className="relative">
              <img
                src={card.src}
                alt=""
                className="w-full h-auto rounded-2xl object-cover shadow-xl aspect-[4/3]"
              />
             
            </div>
          )}
        </div>
      ))}
    </section>
  );
}