"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import jsPDF from "jspdf";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const CATEGORIES = [
  { key: "problemSolving", name: "Problem Solving" },
  { key: "technicalDepth", name: "Technical Depth" },
  { key: "communication", name: "Communication" },
  { key: "collaboration", name: "Collaboration" },
  { key: "cultureGrowth", name: "Culture & Growth" },
];

interface ReviewResults {
  reviewId: string;
  reviewerCount: number;
  categories: Array<{
    category: string;
    average: number;
    stdDev: number;
  }>;
  weightedAverageOutOf10: number;
  revealedAt: string;
  revealTxHash?: string;
}

interface Review {
  id: string;
  candidateRef: string;
  role: string;
  status: string;
  deadline: string;
}

const getScoreColor = (score: number) => {
  if (score >= 8) return "#16A34A"; // Green
  if (score >= 6) return "#D97706"; // Yellow
  return "#DC2626"; // Red
};

const getBlockchainLink = (txHash?: string): string => {
  if (!txHash) return "";
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

export default function ReviewResultsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const [review, setReview] = useState<Review | null>(null);
  const [results, setResults] = useState<ReviewResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/results`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load results");
        }
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    async function loadReview() {
      try {
        const res = await fetch(`/api/reviews/${reviewId}`);
        if (!res.ok) throw new Error("Failed to load review");
        const data = await res.json();
        setReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }

    loadReview();
    loadResults();
  }, [reviewId]);

  const handleExportJSON = () => {
    if (!results || !review) return;

    const blockchainLink = getBlockchainLink(results.revealTxHash);
    const overallScore = Math.round(results.weightedAverageOutOf10 * 10) / 10;

    const exportData = {
      review: {
        id: review.id,
        candidateRef: review.candidateRef,
        role: review.role,
        status: review.status,
        deadline: review.deadline,
      },
      results: {
        overallScore,
        weightedAverage: results.weightedAverageOutOf10,
        reviewerCount: results.reviewerCount,
        revealedAt: results.revealedAt,
        blockchainLink: blockchainLink,
        categories: results.categories.map(cat => ({
          category: CATEGORIES.find(c => c.key === cat.category)?.name || cat.category,
          average: Math.round(cat.average),
          standardDeviation: parseFloat(cat.stdDev.toFixed(2)),
        })),
      },
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `review-results-${review.candidateRef}-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    if (!results || !review) return;

    setExporting(true);
    try {
      const blockchainLink = getBlockchainLink(results.revealTxHash);
      const overallScore = Math.round(results.weightedAverageOutOf10 * 10) / 10;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;

      // Header
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Review Results", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;

      // Review Details
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Candidate: ${review.candidateRef}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Role: ${review.role}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Status: ${review.status}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Revealed: ${new Date(results.revealedAt).toLocaleDateString()}`, 15, yPosition);
      yPosition += 10;

      // Overall Score
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Overall Score", 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(32);
      pdf.text(`${overallScore}`, 15, yPosition);
      yPosition += 15;

      // Category Averages
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Category Averages", 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      results.categories.forEach(cat => {
        const categoryName = CATEGORIES.find(c => c.key === cat.category)?.name || cat.category;
        const score = Math.round(cat.average);
        pdf.text(`${categoryName}: ${score} (±${cat.stdDev.toFixed(1)})`, 15, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Blockchain Link
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Blockchain Verification", 15, yPosition);
      yPosition += 6;

      pdf.setFont("helvetica", "normal");
      if (blockchainLink) {
        pdf.setTextColor(0, 0, 255);
        pdf.textWithLink(blockchainLink, 15, yPosition, { url: blockchainLink });
        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.text("No blockchain transaction available", 15, yPosition);
      }
      yPosition += 8;

      // Export Info
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Exported on ${new Date().toLocaleString()}`, 15, pageHeight - 10);

      pdf.save(`review-results-${review.candidateRef}-${new Date().getTime()}.pdf`);
      setShowExportMenu(false);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-black/10 border-t-[#1A0E07] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[14px] text-black/60">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results || !review) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4`}>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Results Not Available</h1>
          <p className="text-[14px] text-black/60 mb-6">
            {error || "This review has not been revealed yet. Results will be available once all reviewers submit and the admin reveals the scores."}
          </p>
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors"
          >
            Back to reviews
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(results.weightedAverageOutOf10 * 10) / 10;
  const blockchainLink = getBlockchainLink(results.revealTxHash);

  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/reviews" className="text-[14px] text-black/50 hover:text-black/70 mb-4 inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
            Back to reviews
          </Link>
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1A0E07] mb-2">Results</h1>
              <p className="text-[14px] text-black/60">{review.role} • {review.candidateRef}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="px-6 py-2.5 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export results"}
              </button>
              {showExportMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg border border-black/[0.07] shadow-lg overflow-hidden z-10">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-3 text-left text-[11px] text-[#1A0E07] hover:bg-black/[0.02] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-3 text-left text-[11px] text-[#1A0E07] hover:bg-black/[0.02] transition-colors border-t border-black/[0.05] flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-[64px] font-extrabold mb-2" style={{ color: getScoreColor(overallScore) }}>
                {overallScore}
              </div>
              <div className="text-[14px] font-semibold text-[#1A0E07]">Overall score</div>
              <div className="text-[12px] text-black/50 mt-2">
                {results.reviewerCount} reviewer{results.reviewerCount !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#1A0E07] mb-4">Category averages</h2>
              <div className="space-y-4">
                {results.categories.map((cat) => {
                  const categoryName = CATEGORIES.find(c => c.key === cat.category)?.name || cat.category;
                  const score = Math.round(cat.average);
                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-[#1A0E07] font-medium">{categoryName}</div>
                        <div className="flex items-center gap-3">
                          <div className="text-[14px] font-bold" style={{ color: getScoreColor(score) }}>
                            {score}
                          </div>
                          <div className="text-[12px] text-black/40">±{cat.stdDev.toFixed(1)}</div>
                        </div>
                      </div>
                      <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(score * 10, 100)}%`,
                            backgroundColor: getScoreColor(score),
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Verification */}
        {blockchainLink && (
          <div className="bg-grey-50 border border-grey-200 rounded-2xl p-6 mb-6">
            <p className="text-[14px] text-black/80 mb-2">
              <span className="font-semibold">Blockchain Verified</span> 
            </p>
            <a
              href={blockchainLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-black/60 hover:text-blue-700 underline"
            >
              <span className="hidden md:inline break-all">{blockchainLink}</span>
              <span className="md:hidden">View on Etherscan</span>
            </a>
          </div>
        )}

        {/* Reveal info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <p className="text-[14px] text-blue-900">
            <span className="font-semibold">Results revealed</span> on {new Date(results.revealedAt).toLocaleDateString()} at{" "}
            {new Date(results.revealedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}