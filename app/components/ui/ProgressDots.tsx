// components/ui/ProgressDots.tsx
export default function ProgressDots({
  submitted,
  total,
  maxDots = 6,
}: {
  submitted: number;
  total: number;
  maxDots?: number;
}) {
  const dotsToShow = Math.min(total, maxDots);
  const overflow = total - dotsToShow;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: dotsToShow }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i < submitted ? "bg-green-500" : "bg-gray-200"}`}
          />
        ))}
        {overflow > 0 && <span className="text-[10px] text-black/35 ml-0.5">+{overflow}</span>}
      </div>
      <span className="text-[13px] text-black/60 font-medium tabular-nums">
        {submitted}/{total}
      </span>
    </div>
  );
}