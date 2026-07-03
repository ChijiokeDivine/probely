"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/app/components/ui/StatusBadge";
import CountdownTimer from "@/app/components/ui/CountdownTimer";

// Mock reviewers data
const MOCK_REVIEWERS = [
  { id: "1", name: "Jane Doe", hasSubmitted: true, submittedAt: "2024-05-15T14:30:00Z" },
  { id: "2", name: "John Smith", hasSubmitted: false },
  { id: "3", name: "Alice Johnson", hasSubmitted: true, submittedAt: "2024-05-16T09:15:00Z" },
];

const TABS = ["Overview", "Activity", "Settings"] as const;

export default function ReviewDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof TABS[0]>("Overview");
  const [loading, setLoading] = useState(true);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealStatus, setRevealStatus] = useState<"idle" | "requesting" | "decrypting" | "storing">("idle");

  const review = {
    id: params.id as string,
    role: "Senior Frontend Engineer",
    candidateRef: "cand_abc123",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reviewerCount: 3,
    submittedCount: 2,
    status: "active" as const,
  };

  const allSubmitted = review.submittedCount === review.reviewerCount;
  const deadlinePassed = new Date(review.deadline) < new Date();
  const canReveal = allSubmitted || deadlinePassed;

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleReveal = async () => {
    if (!confirm("Are you sure you want to reveal the results?")) return;
    setRevealStatus("requesting");
    setRevealLoading(true);

    // Simulate the reveal process
    setTimeout(() => setRevealStatus("decrypting"), 1000);
    setTimeout(() => setRevealStatus("storing"), 2000);
    setTimeout(() => {
      router.push(`/reviews/${review.id}/results`);
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `${diffHours}h ago`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-black/5 rounded"></div>
          <div className="h-10 bg-black/5 rounded w-2/3"></div>
          <div className="bg-white rounded-2xl border border-black/[0.07] h-80"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/reviews" className="text-[14px] text-black/50 hover:text-black/70 mb-4 inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          Back to reviews
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1A0E07]">{review.role}</h1>
              <StatusBadge status={review.status} />
            </div>
            <p className="text-[14px] text-black/60">Candidate: {review.candidateRef}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full border border-black/10 text-[13px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors">
              Send reminder to all
            </button>
            <button className="px-4 py-2 rounded-full border border-black/10 text-[13px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors">
              Extend deadline
            </button>
            <button className="px-4 py-2 rounded-full border border-red-200 text-[13px] font-semibold text-red-700 hover:bg-red-50 transition-colors">
              Cancel review
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-black/[0.07] pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[14px] font-semibold border-b-2 transition-colors ${
              activeTab === tab ? "border-[#1A0E07] text-[#1A0E07]" : "border-transparent text-black/40 hover:text-black/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Reveal banner */}
          {canReveal && (
            <div className={`p-6 rounded-2xl border ${
              allSubmitted ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-bold mb-1 text-[#1A0E07]">
                    {allSubmitted ? "All reviewers have submitted. Ready to reveal!" : "Deadline passed with partial submissions."}
                  </h3>
                  <p className="text-[13px] text-black/60">
                    {allSubmitted 
                      ? `${review.submittedCount}/${review.reviewerCount} reviewers submitted.` 
                      : `${review.submittedCount}/${review.reviewerCount} reviewers submitted before the deadline.`
                    }
                  </p>
                </div>
                <button
                  onClick={handleReveal}
                  disabled={revealLoading}
                  className="px-6 py-2.5 rounded-full bg-[#1A0E07] text-white text-[13px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-70"
                >
                  {revealLoading ? (
                    revealStatus === "requesting" ? "Requesting decryption..." :
                    revealStatus === "decrypting" ? "Decrypting scores..." :
                    "Storing results..."
                  ) : (
                    allSubmitted ? "Reveal results" : "Reveal with partial results"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Reviewer progress */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <h2 className="text-lg font-bold text-[#1A0E07] mb-6">Reviewer submissions</h2>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] text-black/60">
                  {review.submittedCount} of {review.reviewerCount} submitted
                </span>
                <span className="text-[14px] font-bold text-[#1A0E07]">
                  {Math.round((review.submittedCount / review.reviewerCount) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A0E07] rounded-full transition-all duration-500"
                  style={{ width: `${(review.submittedCount / review.reviewerCount) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Reviewer list */}
            <div className="space-y-3">
              {MOCK_REVIEWERS.map((reviewer) => (
                <div
                  key={reviewer.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-black/[0.05]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-[14px]">{reviewer.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#1A0E07]">{reviewer.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reviewer.hasSubmitted ? (
                      <>
                        <span className="flex items-center gap-1.5 text-[13px] text-green-700 font-semibold">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          Submitted
                        </span>
                        <span className="text-[12px] text-black/40">{timeAgo(reviewer.submittedAt!)}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5 text-[13px] text-black/40 font-semibold">
                          Pending…
                        </span>
                        <button className="px-3 py-1.5 rounded-full border border-black/10 text-[12px] font-semibold text-black/60 hover:bg-black/[0.02] transition-colors">
                          Send reminder
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
              <div className="text-[12px] text-black/40 mb-2">Deadline</div>
              <CountdownTimer deadline={review.deadline} />
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
              <div className="text-[12px] text-black/40 mb-2">Reviewers</div>
              <div className="text-[18px] font-bold text-[#1A0E07]">{review.reviewerCount}</div>
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
              <div className="text-[12px] text-black/40 mb-2">Created</div>
              <div className="text-[14px] font-semibold text-[#1A0E07]">May 10, 2024</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
          <h2 className="text-lg font-bold text-[#1A0E07] mb-6">Activity</h2>
          <div className="space-y-0">
            {[
              { type: "review-submitted", user: "Jane Doe", time: "2h ago" },
              { type: "review-submitted", user: "Alice Johnson", time: "1d ago" },
              { type: "review-created", user: "You", time: "6d ago" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 py-4 border-t border-black/[0.05] first:border-t-0">
                <div className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center shrink-0">
                  {activity.type === "review-submitted" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A0E07" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[#1A0E07]">
                    {activity.type === "review-submitted" ? (
                      <><span className="font-semibold">{activity.user}</span> submitted their review</>
                    ) : (
                      <><span className="font-semibold">{activity.user}</span> created the review</>
                    )}
                  </div>
                  <div className="text-[12px] text-black/40">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
          <h2 className="text-lg font-bold text-[#1A0E07] mb-6">Review settings</h2>
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="shrink-0">
                  <path d="M12 9v4"></path>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                  <circle cx="12" cy="16" r="1"></circle>
                </svg>
                <div>
                  <h3 className="text-[14px] font-bold text-[#1A0E07] mb-1">Review is active</h3>
                  <p className="text-[13px] text-black/60">
                    Settings cannot be modified while a review is active.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
