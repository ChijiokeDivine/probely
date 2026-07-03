// components/ui/CountdownTimer.tsx
"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return { label: "Overdue", urgency: "over" as const };
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${minutes}m`;
  else label = `${minutes}m`;

  const urgency = ms < 24 * 3600 * 1000 ? "high" : ms < 72 * 3600 * 1000 ? "medium" : "low";
  return { label, urgency: urgency as "high" | "medium" | "low" };
}

const URGENCY_STYLES: Record<string, string> = {
  over: "text-red-600 font-semibold",
  high: "text-red-600 font-semibold",
  medium: "text-amber-600 font-medium",
  low: "text-black/60",
};

export default function CountdownTimer({ deadline }: { deadline: string | Date }) {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { label, urgency } = formatRemaining(target.getTime() - now);

  return <span className={`text-[13px] ${URGENCY_STYLES[urgency]}`}>{label}</span>;
}