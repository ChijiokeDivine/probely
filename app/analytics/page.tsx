"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import MetricCard from "@/app/components/ui/MetricCard";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface Review {
  id: string;
  candidate_ref: string;
  role: string;
  reviewer_count: number;
  submitted_count: number;
  deadline: string;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  candidate_ref: string;
  full_name: string;
  email: string | null;
  notes: string | null;
  created_at: string;
}

interface Reviewer {
  id: string;
  full_name: string;
  email: string;
  wallet_status: string;
  wallet_address: string | null;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-black/[0.05] rounded-xl animate-pulse ${className}`} />;
}

function SimpleBarChart({
  data,
  valueKey,
  labelKey,
  color = "#1A0E07",
}: {
  data: { [key: string]: number | string }[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const maxValue = Math.max(...data.map((d) => Number(d[valueKey])));
  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="text-[13px] text-black/60 w-32 truncate">{item[labelKey]}</span>
          <div className="flex-1 h-5 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${maxValue > 0 ? (Number(item[valueKey]) / maxValue) * 100 : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-[13px] font-semibold text-[#1A0E07] w-12 text-right">
            {item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("6m");

  useEffect(() => {
    async function loadData() {
      try {
        const [reviewsRes, candidatesRes, reviewersRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/candidates"),
          fetch("/api/profile/team"),
        ]);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.reviews ?? []);
        }
        if (candidatesRes.ok) {
          const data = await candidatesRes.json();
          setCandidates(data.candidates ?? []);
        }
        if (reviewersRes.ok) {
          const data = await reviewersRes.json();
          setReviewers(data.team ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const {
    totalReviews,
    completedReviews,
    activeReviews,
    revealedReviews,
    totalCandidates,
    totalReviewers,
  } = useMemo(() => {
    const list = reviews ?? [];
    const candidatesList = candidates ?? [];
    const reviewersList = reviewers ?? [];
    return {
      totalReviews: list.length,
      completedReviews: list.filter((r) => r.status === "revealed").length,
      activeReviews: list.filter((r) => r.status === "active").length,
      revealedReviews: list.filter((r) => r.status === "revealed").length,
      totalCandidates: candidatesList.length,
      totalReviewers: reviewersList.length,
    };
  }, [reviews, candidates, reviewers]);

  const statusBreakdown = useMemo(() => {
    const list = reviews ?? [];
    const counts = [
      { name: "Revealed", count: list.filter((r) => r.status === "revealed").length, color: "#16A34A" },
      { name: "Active", count: list.filter((r) => r.status === "active").length, color: "#3B82F6" },
      { name: "Pending", count: list.filter((r) => r.status === "pending_tx" || r.status === "draft").length, color: "#D97706" },
    ].filter((item) => item.count > 0);
    return counts;
  }, [reviews]);

  const categoryAverages = [
    { name: "Problem Solving", average: 0 },
    { name: "Technical Depth", average: 0 },
    { name: "Communication", average: 0 },
    { name: "Collaboration", average: 0 },
    { name: "Culture & Growth", average: 0 },
  ];

  return (
    <div className={`${jakartaSans.className} px-5 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-[1400px] mx-auto`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-[20px] md:text-[35px] font-extrabold text-[#1A0E07] tracking-tight leading-[1.05]">
            Analytics
          </h1>
          <p className="text-[14px] text-black/60 mt-1">Insights into your review process</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-black/[0.07]">
          {[
            { key: "1m", label: "Last month" },
            { key: "3m", label: "3 months" },
            { key: "6m", label: "6 months" },
            { key: "1y", label: "Last year" },
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-4 py-2 rounded-full md:text-[13px] text-[9px] font-semibold transition-all ${
                timeRange === range.key ? "bg-[#1A0E07] text-white" : "text-black/50 hover:text-black/70"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))
        ) : (
          <>
            <MetricCard
              label="Total reviews"
              value={totalReviews}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              }
            />
            <MetricCard
              label="Completed"
              value={completedReviews}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <MetricCard
              label="Candidates"
              value={totalCandidates}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              }
            />
            <MetricCard
              label="Reviewers"
              value={totalReviewers}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 14a6 6 0 0 0 12 0" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status distribution */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[#1A0E07] mb-4">Review status</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <SimpleBarChart
              data={statusBreakdown}
              valueKey="count"
              labelKey="name"
              color="#1A0E07"
            />
          )}
        </div>

        {/* Category averages placeholder */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[#1A0E07] mb-4">Category averages</h2>
          <p className="text-[13px] text-black/50 mb-6">Averages will be calculated once you have completed reviews</p>
          <div className="space-y-4 opacity-50">
            {categoryAverages.map((cat, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-[13px] text-black/60 w-32 truncate">{cat.name}</span>
                <div className="flex-1 h-5 bg-black/5 rounded-full" />
                <span className="text-[13px] font-semibold text-[#1A0E07] w-12 text-right">0</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent reviews section */}
      <div className="mt-4 bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h2 className="text-[15px] font-bold text-[#1A0E07]">Recent reviews</h2>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          (reviews ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-16">
              <p className="text-[12px] md:text-[14px] text-black/50 mb-4 max-w-[280px]">
                No reviews yet. Create your first review to see analytics.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {(reviews ?? []).slice(0, 5).map((review) => (
                <div key={review.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-[#1A0E07] truncate">
                      {review.candidate_ref}
                    </div>
                    <div className="text-[12.5px] text-black/50 truncate">{review.role}</div>
                  </div>
                  <span className="text-[12.5px] font-semibold text-black/60 capitalize">
                    {review.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
