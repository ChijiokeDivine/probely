"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import CountdownTimer from "@/app/components/ui/CountdownTimer";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface CategoryWeights {
  problemSolving: number;
  technicalDepth: number;
  communication: number;
  collaboration: number;
  cultureGrowth: number;
}

interface ScorecardData {
  reviewId: string;
  role: string;
  deadline: string;
  categoryWeights: CategoryWeights;
  alreadySubmitted: boolean;
}

const CATEGORIES = [
  { key: "problemSolving", label: "Problem Solving", description: "Ability to break down and solve complex problems" },
  { key: "technicalDepth", label: "Technical Depth", description: "Understanding of technical concepts and best practices" },
  { key: "communication", label: "Communication", description: "Clarity of communication and collaboration style" },
  { key: "collaboration", label: "Collaboration", description: "Teamwork and interpersonal skills" },
  { key: "cultureGrowth", label: "Culture & Growth", description: "Cultural fit and potential for growth" },
] as const;

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

function ConfirmationModal({ isOpen, onConfirm, onCancel, title, message }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-[#1A0E07] mb-4">{title}</h2>
          <p className="text-[14px] text-black/70 mb-8">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-full border border-black/10 text-[14px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadScorecard() {
      try {
        const res = await fetch(`/api/scorecard/${token}`);
        if (!res.ok) throw new Error("Failed to load scorecard");
        const data = await res.json();
        setScorecard(data);
        
        // Initialize scores to 0
        const initialScores: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          initialScores[cat.key] = 0;
        });
        setScores(initialScores);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadScorecard();
  }, [token]);

  function getWeightDisplay(weightBps: number) {
    return `${(weightBps / 100).toFixed(0)}%`;
  }

  async function handleConfirmSubmit() {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      // TODO: Implement actual submission (call the on-chain submitScores
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit() {
    setShowConfirmModal(true);
  }

  if (loading) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-black/10 border-t-[#1A0E07] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[14px] text-black/60">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <lord-icon
              src="https://cdn.lordicon.com/tdfgxqoc.json"
              trigger="loop"
              style={{ width: "80px", height: "80px" }}
            />
          </div>
          <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Scorecard Not Found</h1>
          <p className="text-[14px] text-black/60">
            {error || "This scorecard link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  if (scorecard.alreadySubmitted || submitted) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <lord-icon
              src="https://cdn.lordicon.com/oqdmuxru.json"
              trigger="loop"
              style={{ width: "80px", height: "80px" }}
            />
          </div>
          <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Thank You!</h1>
          <p className="text-[14px] text-black/60 mb-6">
            Your scores have been submitted successfully. They will be revealed once all reviewers have submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
          <div className="p-8 border-b border-black/[0.05]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1A0E07]">Scorecard</h1>
                <p className="text-[14px] text-black/60">Reviewing for {scorecard.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-black/60">Deadline:</span>
                <CountdownTimer deadline={scorecard.deadline} />
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1A0E07] mb-4">Your Scores</h2>
              <div className="space-y-6">
                {CATEGORIES.map(category => {
                  const weight = scorecard.categoryWeights[category.key as keyof CategoryWeights];
                  return (
                    <div key={category.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[14px] font-semibold text-[#1A0E07]">{category.label}</h3>
                          <p className="text-[12px] text-black/50">{category.description}</p>
                        </div>
                        <span className="text-[12px] text-black/40 font-semibold bg-black/[0.05] px-2 py-1 rounded-full">
                          {getWeightDisplay(weight)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scores[category.key] || 0}
                        onChange={(e) => setScores({ ...scores, [category.key]: Number(e.target.value) })}
                        className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#1A0E07]"
                      />
                      <div className="text-right text-[13px] text-black/60 font-semibold">
                        {scores[category.key] || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1A0E07] mb-4">Notes (Optional)</h2>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional comments or observations..."
                className="w-full px-4 py-3 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-6 py-3 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Scores"}
            </button>
          </div>
          <div className="px-8 pb-8">
            <p className="text-[12px] text-black/40 text-center">
              Your scores will remain encrypted and only revealed once all reviewers have submitted.
            </p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        title="Submit Scores?"
        message="Are you sure you want to submit your scores? This cannot be undone."
      />
    </div>
  );
}
