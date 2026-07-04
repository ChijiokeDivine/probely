import React from "react";

const CLIENTS = [
  "Private",
  "Anonymous",
  "Encrypted",
  "Verified",
  "Confidential",
  "Secure",
  "Trusted",
  "Transparent",
  "Protected",
  "Honest Reviews",
];

export default function LogoTicker() {
  return (
    <section
      style={{
        background: "#ffffffff",
        padding: "20px 0px 30px 0px",
        fontFamily:
          '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
        borderBottom: "0.6px solid #b3b2b2ff",
      }}
    >
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 34s linear infinite;
        }
        .ticker-viewport:hover .ticker-track {
          animation-play-state: paused;
        }
        .ticker-logo {
          color: rgba(0, 0, 0, 0.4);
          transition: color 0.35s ease, transform 0.35s ease, opacity 0.35s ease;
        }
        .ticker-logo:hover {
          color: rgba(0, 0, 0, 0.96);
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
          }
        }
        @media (max-width: 640px) {
          .ticker-eyebrow {
            font-size: 10.5px !important;
          }
          .ticker-logo {
            font-size: 19px !important;
          }
          .ticker-track {
            gap: 56px !important;
          }
        }
      `}</style>


      {/* Viewport with edge fade mask */}
      <div
        className="ticker-viewport"
        style={{
          position: "relative",
          overflow: "hidden",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
        }}
      >
        <div
          className="ticker-track"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "88px",
            width: "max-content",
          }}
        >
          {/* Two identical sets back to back = seamless -50% loop */}
          {[0, 1].map((setIndex) => (
            <div
              key={setIndex}
              style={{ display: "flex", alignItems: "center", gap: "88px" }}
              aria-hidden={setIndex === 1 ? "true" : undefined}
            >
              {CLIENTS.map((name, i) => (
                <span
                  key={`${setIndex}-${i}`}
                  className="ticker-logo"
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.4px",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    cursor: "default",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}