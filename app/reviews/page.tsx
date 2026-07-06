"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge, { type ReviewStatus } from "@/app/components/ui/StatusBadge";
import ProgressDots from "@/app/components/ui/ProgressDots";
import CountdownTimer from "@/app/components/ui/CountdownTimer";

interface Review {
  id: string;
  candidate_ref: string;
  role: string;
  reviewer_count: number;
  submitted_count: number;
  deadline: string;
  status: ReviewStatus;
  created_at: string;
}

interface Assignment {
  id: string;
  review_id: string;
  has_submitted: boolean;
  reviews: Review;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="h-5 bg-black/10 rounded w-1/4"></div>
            <div className="h-4 bg-black/5 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [reviewsRes, assignmentsRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/reviews/mine")
        ]);
        
        if (!reviewsRes.ok) throw new Error("Failed to load reviews");
        if (!assignmentsRes.ok) throw new Error("Failed to load assignments");
        
        const reviewsData = await reviewsRes.json();
        const assignmentsData = await assignmentsRes.json();
        
        setReviews(reviewsData.reviews);
        setAssignments(assignmentsData.assignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Reviews</h1>
          <p className="text-[12px] md:text-[14px] text-black/60">Manage and track all your candidate reviews</p>
        </div>
        <Link
          href="/reviews/new"
          className="px-4 py-2 rounded-full md:text-[14px] text-[12px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          New <span className="hidden md:block">review</span>
        </Link>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-100 bg-red-50 text-[13.5px] text-red-700">{error}</div>}

      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-8">
          {/* Reviews I'm Assigned To */}
          {assignments && assignments.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1A0E07] mb-4">Reviews I'm Assigned To</h2>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => router.push(`/scorecard/${assignment.id}`)}
                    className="bg-white rounded-2xl border border-black/[0.07] p-5 hover:bg-black/[0.02] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-[#1A0E07] truncate">
                          {assignment.reviews.candidate_ref}
                        </div>
                        <div className="text-[13px] text-black/60">{assignment.reviews.role}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {assignment.has_submitted ? (
                          <span className="flex items-center gap-1.5 text-[13px] text-green-700 font-semibold">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"></path>
                            </svg>
                            Submitted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[13px] text-black/40 font-semibold">
                            Pending
                          </span>
                        )}
                        <StatusBadge status={assignment.reviews.status} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <CountdownTimer deadline={assignment.reviews.deadline} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Reviews (Created by Me) */}
          {reviews && reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1A0E07] mb-4">My Reviews</h2>
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/[0.05]">
                        <th className="px-5 py-3 text-[11.5px] uppercase tracking-wide text-black/35 font-semibold">Candidate</th>
                        <th className="px-5 py-3 text-[11.5px] uppercase tracking-wide text-black/35 font-semibold">Role</th>
                        <th className="px-5 py-3 text-[11.5px] uppercase tracking-wide text-black/35 font-semibold">Progress</th>
                        <th className="px-5 py-3 text-[11.5px] uppercase tracking-wide text-black/35 font-semibold">Status</th>
                        <th className="px-5 py-3 text-[11.5px] uppercase tracking-wide text-black/35 font-semibold">Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((review) => (
                        <tr
                          key={review.id}
                          onClick={() => router.push(`/reviews/${review.id}`)}
                          className="border-t border-black/[0.05] hover:bg-black/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4 text-[14px] font-semibold text-[#1A0E07]">{review.candidate_ref}</td>
                          <td className="px-5 py-4 text-[14px] text-black/60">{review.role}</td>
                          <td className="px-5 py-4">
                            <ProgressDots submitted={review.submitted_count} total={review.reviewer_count} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={review.status} />
                          </td>
                          <td className="px-5 py-4">
                            <CountdownTimer deadline={review.deadline} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      onClick={() => router.push(`/reviews/${review.id}`)}
                      className="bg-white rounded-2xl border border-black/[0.07] p-5 active:bg-black/[0.02] cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#1A0E07] truncate">{review.candidate_ref}</div>
                          <div className="text-[13px] text-black/60">{review.role}</div>
                        </div>
                        <StatusBadge status={review.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <ProgressDots submitted={review.submitted_count} total={review.reviewer_count} />
                        <CountdownTimer deadline={review.deadline} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!reviews || reviews.length === 0) && (!assignments || assignments.length === 0) && (
            <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
              <div className="mb-4">
                <lord-icon
                  src="https://cdn.lordicon.com/tobsqthh.json"
                  trigger="hover"
                  style={{ width: "120px", height: "120px" }}
                />
              </div>
              <h2 className="text-lg font-bold text-[#1A0E07] mb-2">No reviews yet</h2>
              <p className="text-[12px] md:text-[14px] text-black/60 mb-6">Create your first review to start evaluating candidates</p>
              <Link
                href="/reviews/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full md:text-[14px] text-[12px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Create review
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
