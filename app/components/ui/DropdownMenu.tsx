// components/ui/DropdownMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export default function DropdownMenu({
  trigger,
  items,
  align = "right",
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute z-40 mt-1.5 w-[190px] bg-white rounded-xl border border-black/10 py-1.5 ${align === "right" ? "right-0" : "left-0"}`}
          style={{ animation: "menuPop 0.14s ease-out" }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-3.5 py-2 text-[13.5px] font-medium hover:bg-black/[0.04] disabled:opacity-35 disabled:cursor-not-allowed ${
                item.destructive ? "text-red-600" : "text-black/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes menuPop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}