// components/ui/MetricCard.tsx
export default function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] px-5 py-4 flex items-center gap-3.5 min-w-0">
      <div className="w-9 h-9 rounded-full bg-[#FFFFFF] flex items-center justify-center shrink-0 text-[#1A0E07]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[20px] font-bold text-[#1A0E07] leading-tight truncate">{value}</div>
        <div className="md:text-[13px] text-[11px] text-black/45 truncate">{label}</div>
      </div>
      {hint && <div className="ml-auto text-[11px] text-black/35 hidden sm:block">{hint}</div>}
    </div>
  );
}