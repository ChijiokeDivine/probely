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
    src: "https://picsum.photos/seed/laptop-desk/500/360",
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
    top: "10%",
    left: "80%",
    initialTop: "10%",
    initialLeft: "130%", // Start far right off-screen
    width: "w-28 sm:w-40 md:w-64",
  },
  {
    id: "exchange",
    type: "card-green",
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
    left: "25%",
    initialTop: "130%", // Start far bottom off-screen
    initialLeft: "25%",
    width: "w-28 sm:w-36 md:w-56",
  },
  {
    id: "coffee",
    type: "photo-badge",
    src: "https://picsum.photos/seed/friends-coffee/420/520",
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
        <h1 className="text-center font-extrabold leading-[0.95] text-[#fe4525] text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[11vw]">
          Unify your
          <br />
          finances
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
              <div className="absolute top-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-md">
                <span className="text-base">🗓️</span>
                <span className="text-xs md:text-sm font-medium text-gray-800">
                  Enjoy the coffee!
                </span>
              </div>
            </div>
          )}

          {card.type === "card-blue" && (
            <div className="rounded-2xl border-2 border-[#3b82f6] bg-white p-4 shadow-xl">
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                €100
                <span className="ml-0.5 inline-block w-[2px] h-5 bg-[#fe4525] align-middle" />
              </p>
              <p className="mt-1 text-xs md:text-sm text-gray-400">
                Balance: €4,921.22
              </p>
              <button className="mt-3 w-full rounded-full bg-gray-100 py-2 text-xs md:text-sm font-semibold text-gray-900">
                Send
              </button>
            </div>
          )}

          {card.type === "card-green" && (
            <div className="rounded-2xl bg-[#22c55e] p-4 shadow-xl text-white">
              <p className="flex items-center gap-1 text-xs opacity-80">
                <span>⇄</span> Exchange
              </p>
              <p className="mt-2 text-sm md:text-base font-medium opacity-80 line-through decoration-white/60">
                − €500.00
              </p>
              <p className="text-lg md:text-xl font-bold">+ zł2,179.92</p>
              <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] md:text-xs font-semibold">
                Approved
              </span>
            </div>
          )}

          {card.type === "card-pink" && (
            <div className="rounded-2xl bg-[#fbd7f0] p-4 shadow-xl text-center">
              <img
                src="https://i.pravatar.cc/80?img=47"
                alt=""
                className="mx-auto h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-white"
              />
              <p className="mt-2 text-sm md:text-base font-bold text-[#9333ea]">
                Jane Thomas
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[10px] md:text-xs text-gray-500">
                🔒 Secure payment
              </p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}