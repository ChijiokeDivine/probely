"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

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

const MOCK_REVIEWER_SCORES = [
  {
    name: "Jane Doe",
    scores: {
      problemSolving: 85,
      technicalDepth: 80,
      communication: 90,
      collaboration: 88,
      cultureGrowth: 82,
    },
    notes: "Strong problem solver, great communication skills.",
  },
  {
    name: "John Smith",
    scores: {
      problemSolving: 78,
      technicalDepth: 85,
      communication: 75,
      collaboration: 80,
      cultureGrowth: 78,
    },
    notes: "Deep technical knowledge, could improve communication.",
  },
  {
    name: "Alice Johnson",
    scores: {
      problemSolving: 82,
      technicalDepth: 78,
      communication: 88,
      collaboration: 85,
      cultureGrowth: 85,
    },
    notes: "Great team player, very collaborative.",
  },
];

// Calculate averages
const calculateAverages = () => {
  const sums: Record<string, number> = {};
  CATEGORIES.forEach(cat => sums[cat.key] = 0);

  MOCK_REVIEWER_SCORES.forEach(reviewer => {
    CATEGORIES.forEach(cat => {
      sums[cat.key] += reviewer.scores[cat.key as keyof typeof reviewer.scores];
    });
  });

  const averages: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    averages[cat.key] = Math.round(sums[cat.key] / MOCK_REVIEWER_SCORES.length);
  });

  return averages;
};

// Calculate weighted average (mock weights)
const WEIGHTS = {
  problemSolving: 25,
  technicalDepth: 25,
  communication: 20,
  collaboration: 15,
  cultureGrowth: 15,
};

const calculateWeightedAverage = (scores: Record<string, number>) => {
  let sum = 0;
  let totalWeight = 0;
  Object.entries(WEIGHTS).forEach(([key, weight]) => {
    sum += scores[key] * weight;
    totalWeight += weight;
  });
  return Math.round(sum / totalWeight);
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "#16A34A"; // Green
  if (score >= 60) return "#D97706"; // Yellow
  return "#DC2626"; // Red
};

export default function ReviewResultsPage() {
  const [expandedReviewer, setExpandedReviewer] = useState<string | null>(null);
  const averages = calculateAverages();
  const overallWeightedAverage = calculateWeightedAverage(averages);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1A0E07] mb-2">Results</h1>
              <p className="text-[14px] text-black/60">Senior Frontend Engineer • cand_abc123</p>
            </div>
            <button className="px-6 py-2.5 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors">
              Export results
            </button>
          </div>
        </div>

        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-[64px] font-extrabold mb-2" style={{ color: getScoreColor(overallWeightedAverage) }}>
                {overallWeightedAverage}
              </div>
              <div className="text-[14px] font-semibold text-[#1A0E07]">Overall score</div>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#1A0E07] mb-4">Category averages</h2>
              <div className="space-y-4">
                {CATEGORIES.map(cat => (
                  <div key={cat.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] text-[#1A0E07] font-medium">{cat.name}</div>
                      <div className="text-[14px] font-bold" style={{ color: getScoreColor(averages[cat.key]) }}>
                        {averages[cat.key]}
                      </div>
                    </div>
                    <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${averages[cat.key]}%`,
                          backgroundColor: getScoreColor(averages[cat.key]),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Individual reviewer scores */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#1A0E07]">Individual reviewer scores</h2>
          {MOCK_REVIEWER_SCORES.map((reviewer) => (
            <div
              key={reviewer.name}
              className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden"
            >
              <button
                onClick={() => setExpandedReviewer(expandedReviewer === reviewer.name ? null : reviewer.name)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-[16px]">{reviewer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold text-[#1A0E07]">{reviewer.name}</div>
                    <div className="text-[13px] text-black/50">
                      Weighted average: <span className="font-bold" style={{ color: getScoreColor(calculateWeightedAverage(reviewer.scores)) }}>
                        {calculateWeightedAverage(reviewer.scores)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex gap-2">
                    {CATEGORIES.slice(0, 3).map(cat => (
                      <div
                        key={cat.key}
                        className="px-2 py-1 rounded-full text-[12px] font-semibold"
                        style={{ backgroundColor: `${getScoreColor(reviewer.scores[cat.key as keyof typeof reviewer.scores])}15`, color: getScoreColor(reviewer.scores[cat.key as keyof typeof reviewer.scores]) }}
                      >
                        {reviewer.scores[cat.key as keyof typeof reviewer.scores]}
                      </div>
                    ))}
                  </div>
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-black/40 transition-transform duration-200 ${expandedReviewer === reviewer.name ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </div>
              </button>

              {expandedReviewer === reviewer.name && (
                <div className="px-6 pb-6 border-t border-black/[0.05] pt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-[14px] font-bold text-[#1A0E07]">Category scores</h3>
                      {CATEGORIES.map(cat => (
                        <div key={cat.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-black/60">{cat.name}</span>
                            <span className="font-bold" style={{ color: getScoreColor(reviewer.scores[cat.key as keyof typeof reviewer.scores]) }}>
                              {reviewer.scores[cat.key as keyof typeof reviewer.scores]}
                            </span>
                          </div>
                          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${reviewer.scores[cat.key as keyof typeof reviewer.scores]}%`,
                                backgroundColor: getScoreColor(reviewer.scores[cat.key as keyof typeof reviewer.scores]),
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[14px] font-bold text-[#1A0E07]">Notes</h3>
                      <p className="text-[14px] text-black/70 leading-relaxed">{reviewer.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
