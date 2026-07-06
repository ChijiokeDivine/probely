"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/app/components/ui/StatusBadge";
import CountdownTimer from "@/app/components/ui/CountdownTimer";

interface Reviewer {
  id: string;
  reviewer_id: string;
  profiles: { id: string; full_name: string | null };
  has_submitted: boolean;
  submitted_at: string | null;
}

interface Review {
  id: string;
  role: string;
  candidate_ref: string;
  deadline: string;
  reviewer_count: number;
  submitted_count: number;
  status: "draft" | "pending_tx" | "active" | "reveal_requested" | "revealed" | "cancelled" | "failed";
  created_at: string;
  review_reviewers: Reviewer[];
  admin_id: string;
}

interface ReviewEvent {
  id: number;
  event_type: string;
  created_at: string;
  payload: unknown;
}

const TABS = ["Overview", "Activity", "Settings"] as const;
type TabType = typeof TABS[number];

export default function ReviewDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [loading, setLoading] = useState(true);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealStatus, setRevealStatus] = useState<"idle" | "requesting" | "decrypting" | "storing">("idle");
  const [review, setReview] = useState<Review | null>(null);
  const [events, setEvents] = useState<ReviewEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/reviews/${params.id}`);
        if (!res.ok) throw new Error("Failed to load review");
        const data = await res.json();
        setReview(data.review);
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleReveal = async () => {
    if (!confirm("Are you sure you want to reveal the results?")) return;
    setRevealStatus("requesting");
    setRevealLoading(true);

    setTimeout(() => setRevealStatus("decrypting"), 1000);
    setTimeout(() => setRevealStatus("storing"), 2000);
    setTimeout(() => {
      router.push(`/reviews/${review?.id}/results`);
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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return "Just now";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ReviewCreated":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A0E07" strokeWidth="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        );
      case "ReviewCancelled":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
      case "ReviewerReplaced":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <path d="M20 8v6M23 11h-6"></path>
          </svg>
        );
      case "DeadlineExtended":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
          </svg>
        );
    }
  };

  const getActivityText = (event: ReviewEvent) => {
    switch (event.event_type) {
      case "ReviewCreated":
        return "You created the review";
      case "ReviewCancelled":
        return "You cancelled the review";
      case "ReviewerReplaced":
        return "You replaced a reviewer";
      case "DeadlineExtended":
        return "You extended the deadline";
      default:
        return "Review activity";
    }
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

  if (error || !review) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Error loading review</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const allSubmitted = review.submitted_count === review.reviewer_count;
  const deadlinePassed = new Date(review.deadline) < new Date();
  const canReveal = allSubmitted || deadlinePassed;

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
          <div >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1A0E07]">{review.role}</h1>
              <StatusBadge status={review.status} />
            </div>
            <p className="text-[14px] text-black/60">Candidate: {review.candidate_ref}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 md:mb-0 mb-[30px]">
            <button className="px-4 py-2 rounded-full border border-black/10 md:text-[13px] text-[10px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors">
              Send reminder <span className="hidden md:inline-block">to all</span>
            </button>
            <button className="px-4 py-2 rounded-full border border-black/10 md:text-[13px] text-[10px] font-semibold text-black/70 hover:bg-black/[0.02] transition-colors">
              Extend deadline
            </button>
            <button className="px-4 py-2 rounded-full border border-red-200 md:text-[13px] text-[10px] font-semibold text-red-700 hover:bg-red-50 transition-colors">
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
                      ? `${review.submitted_count}/${review.reviewer_count} reviewers submitted.` 
                      : `${review.submitted_count}/${review.reviewer_count} reviewers submitted before the deadline.`
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
                  {review.submitted_count} of {review.reviewer_count} submitted
                </span>
                <span className="text-[14px] font-bold text-[#1A0E07]">
                  {Math.round((review.submitted_count / review.reviewer_count) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A0E07] rounded-full transition-all duration-500"
                  style={{ width: `${(review.submitted_count / review.reviewer_count) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Reviewer list */}
            <div className="space-y-3">
              {review.review_reviewers.filter((r) => r.reviewer_id).map((reviewer) => (
                <div
                  key={reviewer.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-black/[0.05]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-[14px]">
                      {(reviewer.profiles?.full_name || "User").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#1A0E07]">
                      {reviewer.profiles?.full_name || "Unknown User"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reviewer.has_submitted ? (
                      <>
                        <span className="flex items-center gap-1.5 text-[13px] text-green-700 font-semibold">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          Submitted
                        </span>
                        {reviewer.submitted_at && (
                          <span className="text-[12px] text-black/40">{timeAgo(reviewer.submitted_at)}</span>
                        )}
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
              <div className="text-[18px] font-bold text-[#1A0E07]">{review.reviewer_count}</div>
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
              <div className="text-[12px] text-black/40 mb-2">Created</div>
              <div className="text-[14px] font-semibold text-[#1A0E07]">{formatDate(review.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
          <h2 className="text-lg font-bold text-[#1A0E07] mb-6">Activity</h2>
          <div className="space-y-0">
            {events?.length ? events.map((event) => (
              <div key={event.id} className="flex gap-4 py-4 border-t border-black/[0.05] first:border-t-0">
                <div className="w-8 h-8 rounded-full bg-black/[0.05] flex items-center justify-center shrink-0">
                  {getActivityIcon(event.event_type)}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[#1A0E07]">
                    {getActivityText(event)}
                  </div>
                  <div className="text-[12px] text-black/40">{timeAgo(event.created_at)}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-black/40">
                No activity yet
              </div>
            )}
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
