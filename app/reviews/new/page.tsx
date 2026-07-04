"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Define our form state types
interface FormData {
  candidateId: string;
  role: string;
  reviewerProfileIds: string[];
  deadlineAt: string;
  categoryWeights: {
    problemSolving: number;
    technicalDepth: number;
    communication: number;
    collaboration: number;
    cultureGrowth: number;
  };
  autoAdvanceRule: {
    enabled: boolean;
    passThreshold: number;
    failThreshold: number;
    passAction: string;
    failAction: string;
  };
  notesForReviewers: string;
}

// Category configuration
const CATEGORIES = [
  { key: "problemSolving", label: "Problem Solving", description: "How well the candidate breaks down problems" },
  { key: "technicalDepth", label: "Technical Depth", description: "Understanding of core concepts and best practices" },
  { key: "communication", label: "Communication", description: "Clarity and effectiveness of communication" },
  { key: "collaboration", label: "Collaboration", description: "Teamwork and interpersonal skills" },
  { key: "cultureGrowth", label: "Culture & Growth", description: "Cultural fit and potential" },
] as const;

// Mock reviewers data
const MOCK_REVIEWERS = [
  { id: "1", name: "Jane Doe", email: "jane@example.com", walletStatus: "created" },
  { id: "2", name: "John Smith", email: "john@example.com", walletStatus: "created" },
  { id: "3", name: "Alice Johnson", email: "alice@example.com", walletStatus: "created" },
];

// Mock candidates data
const MOCK_CANDIDATES = [
  { id: "c1", full_name: "Sarah Chen", candidate_ref: "cand_abc123" },
  { id: "c2", full_name: "Mike Johnson", candidate_ref: "cand_def456" },
];

function NewReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    candidateId: "",
    role: "",
    reviewerProfileIds: [],
    deadlineAt: "",
    categoryWeights: {
      problemSolving: 2500,
      technicalDepth: 2500,
      communication: 2000,
      collaboration: 1500,
      cultureGrowth: 1500,
    },
    autoAdvanceRule: {
      enabled: false,
      passThreshold: 75,
      failThreshold: 40,
      passAction: "Next round",
      failAction: "Send rejection",
    },
    notesForReviewers: "",
  });

  useEffect(() => {
    const templateParam = searchParams.get("template");
    if (templateParam) {
      try {
        const template = JSON.parse(templateParam);
        setFormData((prev) => ({
          ...prev,
          role: template.role || prev.role,
          categoryWeights: {
            problemSolving: (template.categoryWeights?.problemSolving || 25) * 100,
            technicalDepth: (template.categoryWeights?.technicalDepth || 25) * 100,
            communication: (template.categoryWeights?.communication || 20) * 100,
            collaboration: (template.categoryWeights?.collaboration || 15) * 100,
            cultureGrowth: (template.categoryWeights?.cultureGrowth || 15) * 100,
          },
          autoAdvanceRule: template.autoAdvanceRule || prev.autoAdvanceRule,
          notesForReviewers: template.notesForReviewers || prev.notesForReviewers,
        }));
      } catch (e) {
        console.error("Failed to parse template data:", e);
      }
    }
  }, [searchParams]);

  // Helper function to convert basis points to percentage
  const bpsToPct = (bps: number) => (bps / 100).toFixed(0);
  // Helper function to convert percentage to basis points
  const pctToBps = (pct: number) => Math.round(pct * 100);

  // Check if weights sum to 100%
  const weightsSumTo100 = Object.values(formData.categoryWeights).reduce((sum, w) => sum + w, 0) === 10000;

  // Update a single category weight
  const updateCategoryWeight = (category: string, newPct: number) => {
    const totalOther = Object.entries(formData.categoryWeights)
      .filter(([key]) => key !== category)
      .reduce((sum, [, w]) => sum + w, 0);
    const remaining = 10000 - pctToBps(newPct);
    if (totalOther === 0) return; // Avoid division by zero

    const updatedWeights = { ...formData.categoryWeights, [category]: pctToBps(newPct) };
    const factor = remaining / totalOther;

    // Adjust other categories proportionally
    for (const key of Object.keys(updatedWeights) as Array<keyof typeof updatedWeights>) {
      if (key !== category) {
        updatedWeights[key] = Math.round(updatedWeights[key] * factor);
      }
    }

    // Fix any rounding errors to ensure sum is exactly 10000
    const sum = Object.values(updatedWeights).reduce((s, w) => s + w, 0);
    if (sum !== 10000) {
      const diff = 10000 - sum;
      const keys = Object.keys(updatedWeights) as Array<keyof typeof updatedWeights>;
      updatedWeights[keys[0]] += diff;
    }

    setFormData({ ...formData, categoryWeights: updatedWeights });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Submit to API
      await new Promise(r => setTimeout(r, 1000));
      router.push("/reviews");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/reviews" className="text-[14px] text-black/50 hover:text-black/70 mb-4 inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
            Back to reviews
          </Link>
          <h1 className="text-3xl font-bold text-[#1A0E07] mb-2">Create new review</h1>
          <p className="text-[14px] text-black/60">Step {step} of 3</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all ${
                s < step 
                  ? "bg-[#1A0E07] text-white" 
                  : s === step 
                    ? "bg-[#1A0E07] text-white ring-4 ring-[#1A0E07]/10" 
                    : "bg-black/[0.05] text-black/40"
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 rounded-full ${s < step ? "bg-[#1A0E07]" : "bg-black/[0.05]"}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A0E07]">Basic details</h2>
              
              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#1A0E07]">Candidate</label>
                <select
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  className="w-full px-4 text-black py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20 text-[14px]"
                >
                  <option value="">Select candidate</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.candidate_ref})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#1A0E07]">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="w-full px-4 text-black py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20 text-[14px]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#1A0E07]">Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.deadlineAt}
                  onChange={(e) => setFormData({ ...formData, deadlineAt: e.target.value })}
                  className="w-full px-4 text-black py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20 text-[14px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A0E07]">Reviewers</h2>
              
              <div className="space-y-3">
                {MOCK_REVIEWERS.map((reviewer) => (
                  <label
                    key={reviewer.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      formData.reviewerProfileIds.includes(reviewer.id) 
                        ? "border-[#1A0E07] bg-[#1A0E07]/[0.02]" 
                        : "border-black/[0.07] hover:border-black/10"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      formData.reviewerProfileIds.includes(reviewer.id) ? "border-[#1A0E07] bg-[#1A0E07]" : "border-black/20"
                    }`}>
                      {formData.reviewerProfileIds.includes(reviewer.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-[14px]">{reviewer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-[#1A0E07]">{reviewer.name}</div>
                      <div className="text-[12px] text-black/50">{reviewer.email}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.reviewerProfileIds.includes(reviewer.id)}
                      onChange={(e) => {
                        const ids = e.target.checked 
                          ? [...formData.reviewerProfileIds, reviewer.id] 
                          : formData.reviewerProfileIds.filter(id => id !== reviewer.id);
                        setFormData({ ...formData, reviewerProfileIds: ids });
                      }}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-[#1A0E07]">Weights & settings</h2>
              
              {/* Category weights */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-[#1A0E07]">Category weights</h3>
                  <span className={`text-[12px] font-semibold px-2 py-1 rounded-full ${
                    weightsSumTo100 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {weightsSumTo100 ? "Total: 100%" : "Total: " + bpsToPct(Object.values(formData.categoryWeights).reduce((s, w) => s + w, 0)) + "%"}
                  </span>
                </div>

                {CATEGORIES.map((category) => (
                  <div key={category.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[#1A0E07]">{category.label}</div>
                        <div className="text-[12px] text-black/50">{category.description}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={bpsToPct(formData.categoryWeights[category.key as keyof typeof formData.categoryWeights])}
                          onChange={(e) => updateCategoryWeight(category.key, parseFloat(e.target.value) || 0)}
                          className="w-20 text-black px-3 py-1.5 rounded-lg border border-black/10 text-right text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20"
                        />
                        <span className="text-[14px] font-semibold text-[#1A0E07]">%</span>
                      </div>
                    </div>
                    {/* Visual percentage bar */}
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A0E07] rounded-full transition-all duration-300"
                        style={{ width: `${bpsToPct(formData.categoryWeights[category.key as keyof typeof formData.categoryWeights])}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes for reviewers */}
              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#1A0E07]">Notes for reviewers (optional)</label>
                <textarea
                  value={formData.notesForReviewers}
                  onChange={(e) => setFormData({ ...formData, notesForReviewers: e.target.value })}
                  placeholder="Share any context about this candidate that reviewers should know..."
                  rows={4}
                  className="w-full text-black px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20 text-[14px]"
                />
              </div>

              {/* Auto-advance rules */}
              <div className="pt-4 border-t border-black/[0.05]">
                <label className="flex items-center gap-3 cursor-pointer mb-6">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    formData.autoAdvanceRule.enabled ? "border-[#1A0E07] bg-[#1A0E07]" : "border-black/20"
                  }`}>
                    {formData.autoAdvanceRule.enabled && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1A0E07]">Auto-advance or reject based on final score</div>
                    <div className="text-[12px] text-black/50">Thresholds are compared against the weighted average score</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoAdvanceRule.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      autoAdvanceRule: { ...formData.autoAdvanceRule, enabled: e.target.checked }
                    })}
                    className="hidden"
                  />
                </label>

                {formData.autoAdvanceRule.enabled && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl border border-black/[0.07]">
                      <label className="block text-[12px] font-semibold text-black/60 mb-2">Pass threshold</label>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] text-black/70">≥</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.autoAdvanceRule.passThreshold}
                          onChange={(e) => setFormData({
                            ...formData,
                            autoAdvanceRule: { ...formData.autoAdvanceRule, passThreshold: parseInt(e.target.value) || 0 }
                          })}
                          className="flex-1 text-black px-3 py-2 rounded-lg border border-black/10 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20"
                        />
                        <span className="text-[14px] text-black/70">% →</span>
                        <select
                          value={formData.autoAdvanceRule.passAction}
                          onChange={(e) => setFormData({
                            ...formData,
                            autoAdvanceRule: { ...formData.autoAdvanceRule, passAction: e.target.value }
                          })}
                          className="text-black px-3 py-2 rounded-lg border border-black/10 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20"
                        >
                          <option value="Next round">Next round</option>
                          <option value="Send offer">Send offer</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-black/[0.07]">
                      <label className="block text-[12px] font-semibold text-black/60 mb-2">Fail threshold</label>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] text-black/70">≤</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.autoAdvanceRule.failThreshold}
                          onChange={(e) => setFormData({
                            ...formData,
                            autoAdvanceRule: { ...formData.autoAdvanceRule, failThreshold: parseInt(e.target.value) || 0 }
                          })}
                          className="flex-1 text-black px-3 py-2 rounded-lg border border-black/10 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20"
                        />
                        <span className="text-[14px] text-black/70">% →</span>
                        <select
                          value={formData.autoAdvanceRule.failAction}
                          onChange={(e) => setFormData({
                            ...formData,
                            autoAdvanceRule: { ...formData.autoAdvanceRule, failAction: e.target.value }
                          })}
                          className="text-black px-3 py-2 rounded-lg border border-black/10 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A0E07]/20"
                        >
                          <option value="Send rejection">Send rejection</option>
                          <option value="No action">No action</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 rounded-full border border-black/10 text-[14px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={step < 3 ? handleNext : handleSubmit}
            disabled={loading || (step === 1 && (!formData.candidateId || !formData.role || !formData.deadlineAt))}
            className="flex-1 px-6 py-3 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating review..." : step < 3 ? "Continue" : "Create review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">Loading...</div>}>
      <NewReviewContent />
    </Suspense>
  );
}
