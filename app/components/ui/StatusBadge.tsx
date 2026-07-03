// components/ui/StatusBadge.tsx
export type ReviewStatus =
  | "draft"
  | "pending_tx"
  | "active"
  | "reveal_requested"
  | "revealed"
  | "cancelled"
  | "failed";

const STATUS_CONFIG: Record<ReviewStatus, { label: string; dot: string; bg: string; text: string; spin?: boolean }> = {
  draft: { label: "Draft", dot: "#9CA3AF", bg: "bg-gray-100", text: "text-gray-600" },
  pending_tx: { label: "Broadcasting", dot: "#9CA3AF", bg: "bg-gray-100", text: "text-gray-600", spin: true },
  active: { label: "Active", dot: "#3B82F6", bg: "bg-blue-50", text: "text-blue-700" },
  reveal_requested: { label: "Decrypting", dot: "#D97706", bg: "bg-amber-50", text: "text-amber-700", spin: true },
  revealed: { label: "Revealed", dot: "#16A34A", bg: "bg-green-50", text: "text-green-700" },
  cancelled: { label: "Cancelled", dot: "#9CA3AF", bg: "bg-gray-100", text: "text-gray-500" },
  failed: { label: "Failed", dot: "#DC2626", bg: "bg-red-50", text: "text-red-700" },
};

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.spin ? "animate-pulse" : ""}`}
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}