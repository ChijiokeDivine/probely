// components/ui/EtherscanLink.tsx
export default function EtherscanLink({ txHash, label = "View on Etherscan" }: { txHash?: string | null; label?: string }) {
  if (!txHash) return null;
  const short = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`;
  return (
    <a
      href={`https://sepolia.etherscan.io/tx/${txHash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-black/55 hover:text-[#1A0E07] transition-colors"
    >
      <span className="font-mono">{short}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6M10 14 21 3" />
      </svg>
      <span className="sr-only">{label}</span>
    </a>
  );
}