"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES, ReviewTemplate } from "@/lib/templates";

const CATEGORIES = [
  { key: "problemSolving", label: "Problem Solving", description: "How well the candidate breaks down problems" },
  { key: "technicalDepth", label: "Technical Depth", description: "Understanding of core concepts and best practices" },
  { key: "communication", label: "Communication", description: "Clarity and effectiveness of communication" },
  { key: "collaboration", label: "Collaboration", description: "Teamwork and interpersonal skills" },
  { key: "cultureGrowth", label: "Culture & Growth", description: "Cultural fit and potential" },
] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null);

  const handleUseTemplate = (template: ReviewTemplate) => {
    // Pass template data via query params or state
    const params = new URLSearchParams({
      template: JSON.stringify({
        role: template.role,
        categoryWeights: template.categoryWeights,
        autoAdvanceRule: template.autoAdvanceRule,
        notesForReviewers: template.notesForReviewers,
      }),
    });
    router.push(`/reviews/new?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Review Templates</h1>
        <p className="text-[14px] text-black/60">Browse and use pre-built templates for your candidate reviews</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden hover:border-black/15 hover:shadow-md transition-all"
          >
            <div className="h-50 overflow-hidden">
              <img
                src={template.image}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="text-lg md:text-md  font-bold text-[#1A0E07] mb-2">{template.name}</h3>
              <p className="text-[14px] md:text-xs  text-black/60 mb-4">{template.description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="flex-1 px-4 py-2 rounded-full border border-black/10 text-[14px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 px-4 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-black/[0.05] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A0E07]">{selectedTemplate.name} Preview</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-black/40 hover:text-black/60"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Role */}
              <div>
                <h3 className="text-[13px] font-semibold text-black/60 mb-2">Role</h3>
                <p className="text-[14px] text-[#1A0E07]">{selectedTemplate.role}</p>
              </div>

              {/* Category Weights */}
              <div>
                <h3 className="text-[13px] font-semibold text-black/60 mb-4">Category Weights</h3>
                <div className="space-y-4">
                  {CATEGORIES.map((category) => (
                    <div key={category.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-semibold text-[#1A0E07]">{category.label}</div>
                        <div className="text-[14px] font-semibold text-[#1A0E07]">
                          {selectedTemplate.categoryWeights[category.key as keyof typeof selectedTemplate.categoryWeights]}%
                        </div>
                      </div>
                      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A0E07] rounded-full"
                          style={{
                            width: `${selectedTemplate.categoryWeights[category.key as keyof typeof selectedTemplate.categoryWeights]}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-advance Rule */}
              <div>
                <h3 className="text-[13px] font-semibold text-black/60 mb-2">Auto-advance Rule</h3>
                {selectedTemplate.autoAdvanceRule.enabled ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl border border-black/[0.07]">
                      <div className="text-[12px] font-semibold text-black/60 mb-1">Pass threshold</div>
                      <div className="text-[14px] text-[#1A0E07]">
                        ≥ {selectedTemplate.autoAdvanceRule.passThreshold}% → {selectedTemplate.autoAdvanceRule.passAction}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-black/[0.07]">
                      <div className="text-[12px] font-semibold text-black/60 mb-1">Fail threshold</div>
                      <div className="text-[14px] text-[#1A0E07]">
                        ≤ {selectedTemplate.autoAdvanceRule.failThreshold}% → {selectedTemplate.autoAdvanceRule.failAction}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[14px] text-black/60">Disabled</p>
                )}
              </div>

              {/* Notes for Reviewers */}
              {selectedTemplate.notesForReviewers && (
                <div>
                  <h3 className="text-[13px] font-semibold text-black/60 mb-2">Notes for Reviewers</h3>
                  <p className="text-[14px] text-black/70 p-4 rounded-xl bg-black/[0.02]">
                    {selectedTemplate.notesForReviewers}
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-6 py-2.5 rounded-full border border-black/10 text-[14px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="flex-1 px-6 py-2.5 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
