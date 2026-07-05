// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge, { ReviewStatus } from "../components/ui/StatusBadge"
import CountdownTimer from "../components/ui/CountdownTimer";
import ProgressDots from "../components/ui/ProgressDots";
import MetricCard from "../components/ui/MetricCard";
import { useProfile } from "../dashboard/DashboardShell";
import { TEMPLATES, ReviewTemplate } from "@/lib/templates";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-black/[0.05] rounded-lg animate-pulse ${className}`}
    />
  );
}

interface ReviewRow {
  id: string;
  candidate_ref: string;
  role: string;
  reviewer_count: number;
  submitted_count: number;
  deadline: string;
  status: ReviewStatus;
  created_at: string;
}



function isReadyToReveal(r: ReviewRow) {
  return r.status === "active" && r.submitted_count >= r.reviewer_count;
}

function hoursUntil(deadline: string) {
  return (new Date(deadline).getTime() - Date.now()) / 3600000;
}

export default function DashboardPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const profile = useProfile();
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("Failed to load reviews");
        const json = await res.json();
        if (!cancelled) setReviews(json.reviews ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      }
    }
    load();
    const id = setInterval(load, 15_000); // light polling for status/decrypting updates
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const metrics = useMemo(() => {
    const list = reviews ?? [];
    const now = new Date();
    const active = list.filter((r) => r.status === "active").length;
    const readyToReveal = list.filter(isReadyToReveal).length;
    const revealedThisMonth = list.filter(
      (r) =>
        r.status === "revealed" &&
        new Date(r.created_at).getMonth() === now.getMonth() &&
        new Date(r.created_at).getFullYear() === now.getFullYear()
    ).length;
    return { active, readyToReveal, revealedThisMonth };
  }, [reviews]);

  const deadlineAlerts = useMemo(
    () =>
      (reviews ?? []).filter(
        (r) => r.status === "active" && r.submitted_count < r.reviewer_count && hoursUntil(r.deadline) < 48 && hoursUntil(r.deadline) > 0
      ),
    [reviews]
  );

  async function handleReveal(reviewId: string) {
    setRevealingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reveal`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start reveal");
      setReviews((prev) =>
        (prev ?? []).map((r) => (r.id === reviewId ? { ...r, status: "reveal_requested" } : r))
      );
    } catch {
      // surfaced inline via row state below; keep it simple for now
    } finally {
      setRevealingId(null);
    }
  }

  function actionFor(r: ReviewRow) {
    switch (r.status) {
      case "draft":
      case "pending_tx":
        return <button disabled className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">Processing…</button>;
      case "active":
        if (isReadyToReveal(r)) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReveal(r.id);
              }}
              disabled={revealingId === r.id}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] disabled:opacity-50"
            >
              {revealingId === r.id ? "Requesting…" : "Reveal results"}
            </button>
          );
        }
        return (
          <Link href={`/reviews/${r.id}`} onClick={(e) => e.stopPropagation()} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border border-black/15 text-[#1A0E07] hover:bg-black/[0.04]">
            View
          </Link>
        );
      case "reveal_requested":
        return <button disabled className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold bg-amber-50 text-amber-600 cursor-not-allowed">Decrypting…</button>;
      case "revealed":
        return (
          <Link href={`/reviews/${r.id}/results`} onClick={(e) => e.stopPropagation()} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold bg-green-50 text-green-700 hover:bg-green-100">
            See results
          </Link>
        );
      default:
        return (
          <Link href={`/reviews/${r.id}`} onClick={(e) => e.stopPropagation()} className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border border-black/15 text-[#1A0E07] hover:bg-black/[0.04]">
            View
          </Link>
        );
    }
  }

  const isEmpty = reviews !== null && reviews.length === 0;

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-6 sm:py-8 max-w-[1400px] mx-auto">

      {/* Greeting */}
      <h1 className="text-[20px] md:text-[35px] font-extrabold text-[#1A0E07] tracking-tight leading-[1.05] mb-6 sm:mb-8">
        Hi there, {firstName}
      </h1>

      {/* Create a new review — preset row (mirrors reference "Create a new job" card) */}
      {showBanner && (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 mb-[30px] md:mb-[40px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[#1A0E07]">Create a new review</h2>
            <button
              aria-label="Dismiss"
              onClick={() => setShowBanner(false)}
              className="text-black/30 hover:text-black/60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => router.push("/reviews/new")}
              className="shrink-0 snap-start w-[150px] sm:w-[168px]"
            >
              <div className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-black/15 flex items-center justify-center bg-[#FAFAF8] hover:bg-black/[0.03] transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A0E07" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div className="text-[11px] font-medium text-black/70 mt-2 text-left">Start from scratch</div>
            </button>

            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => router.push(`/reviews/new?template=${encodeURIComponent(JSON.stringify(template))}`)}
                className="shrink-0 snap-start w-[150px] sm:w-[168px] text-left"
              >
                <div
                  className="w-full aspect-[4/3] rounded-xl overflow-hidden"
                >
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[11px] font-medium text-black/70 mt-2">{template.name} preset</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[30px] md:mb-[40px]">
        {reviews === null ? (
          // Skeleton metric cards
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.07] p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Active reviews"
              value={metrics.active}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
              }
            />
            <MetricCard
              label="Ready to reveal"
              value={metrics.readyToReveal}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            />
            <MetricCard
              label="Revealed this month"
              value={metrics.revealedThisMonth}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              }
            />
            <MetricCard
              label="Avg score, month"
              value="—"
              hint=""
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.4L22 9.3l-5 4.9 1.2 7-6.2-3.5L5.8 21.2 7 14.2l-5-4.9 7.1-.9Z" /></svg>
              }
            />
          </>
        )}
      </div>

      {/* Alert banners */}
      {metrics.readyToReveal > 0 && (
        <div className="flex items-center gap-3 bg-[#1A0E07] text-white rounded-2xl px-5 py-3.5 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
          <span className="text-[13.5px] font-medium flex-1">
            {metrics.readyToReveal} review{metrics.readyToReveal > 1 ? "s are" : " is"} ready to reveal
          </span>
          <Link href="/reviews" className="text-[13px] font-semibold underline underline-offset-2 shrink-0">
            Go to reviews →
          </Link>
        </div>
      )}
      {deadlineAlerts.map((r) => (
        <div key={r.id} className="flex items-center gap-3 bg-amber-50 text-amber-800 rounded-2xl px-5 py-3.5 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          <span className="text-[13.5px] font-medium flex-1">
            Deadline approaching: {r.role} — only {r.submitted_count}/{r.reviewer_count} reviewers have submitted
          </span>
          <Link href={`/reviews/${r.id}`} className="text-[13px] font-semibold underline underline-offset-2 shrink-0">
            View →
          </Link>
        </div>
      ))}

      {/* Reviews table */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden mb-[60px] md:mb-[100px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h2 className="text-[15px] font-bold text-[#1A0E07]">Reviews</h2>
          <Link href="/reviews" className="text-[13px] font-semibold text-black/50 hover:text-black/80">
            See all
          </Link>
        </div>

        {error && <div className="px-5 py-6 text-[13.5px] text-red-600">{error}</div>}

        {reviews === null && !error && (
          <>
            {/* Desktop table skeleton */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11.5px] uppercase tracking-wide text-black/35">
                    <th className="px-5 py-3 font-semibold">Candidate</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Reviewers</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Deadline</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-black/[0.05]">
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3.5 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards skeleton */}
            <div className="md:hidden divide-y divide-black/[0.06]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24 mt-3" />
                </div>
              ))}
            </div>
          </>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center mb-3">
              <lord-icon
                src="https://cdn.lordicon.com/tobsqthh.json"
                trigger="hover"
                style={{ width: "150px", height: "150px" }}
              />
            </div>
            <p className="text-[14px] text-black/50 mb-4 max-w-[280px]">
              No reviews yet. Create your first review.
            </p>
            <Link href="/reviews/new" className="px-4 py-2 rounded-full
                rounded-full
                border border-neutral-700
                bg-neutral-900
                font-semibold
                text-white
                text-[13.5px]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_0_rgb(38,38,38)]

                transition-all
                duration-75

                hover:bg-neutral-800

                active:translate-y-1
                active:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]

                disabled:opacity-60
                disabled:cursor-not-allowed">
              Create review
            </Link>
          </div>
        )}

        {reviews !== null && reviews.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11.5px] uppercase tracking-wide text-black/35">
                    <th className="px-5 py-3 font-semibold">Candidate</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Reviewers</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Deadline</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/reviews/${r.id}`)}
                      className="border-t border-black/[0.05] hover:bg-black/[0.02] cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-[13.5px] font-semibold text-[#1A0E07]">{r.candidate_ref}</td>
                      <td className="px-5 py-3.5 text-[13.5px] text-black/65">{r.role}</td>
                      <td className="px-5 py-3.5"><ProgressDots submitted={r.submitted_count} total={r.reviewer_count} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5"><CountdownTimer deadline={r.deadline} /></td>
                      <td className="px-5 py-3.5 text-right">{actionFor(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-black/[0.06]">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/reviews/${r.id}`)}
                  className="px-5 py-4 active:bg-black/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#1A0E07] truncate">{r.candidate_ref}</div>
                      <div className="text-[12.5px] text-black/50 truncate">{r.role}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <ProgressDots submitted={r.submitted_count} total={r.reviewer_count} />
                    <CountdownTimer deadline={r.deadline} />
                  </div>
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    {actionFor(r)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Resources — swaps in for the reference "Guides" section */}
      <div className="mt-8 hidden md:block">
        <h2 className="text-[16px] font-bold text-[#1A0E07] mb-3">Resources</h2>
        <p className="text-[13.5px] text-black/50 mb-6">Learn how blind, encrypted review scoring works under the hood</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ResourceCard
            title="How FHE keeps scores private"
            desc="Even Honio can't see individual reviewer scores until reveal."
            gradient="linear-gradient(135deg,#FFD9EC 0%,#FF9BC7 100%)"
          />
          <ResourceCard
            title="Reading your results on-chain"
            desc="Every review is verifiable on Sepolia Etherscan."
            gradient="linear-gradient(135deg,#0B0B0F 0%,#2B2B36 100%)"
            dark
          />
          <div className="hidden md:block">
          <ResourceCard 
            title="Designing fair category weights"
            desc="Presets for engineering, product, design & ops roles."
            gradient="linear-gradient(135deg,#EDE7FF 0%,#C9B8FF 100%)"
          />
          </div>
\


        </div>
      </div>
    </div>
  );
}

function ResourceCard({ title, desc, gradient, dark }: { title: string; desc: string; gradient: string; dark?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.06] bg-white">
      <div className="h-32" style={{ background: gradient }} />
      <div className="p-4">
        <div className={`text-[13.5px] font-bold ${dark ? "text-[#1A0E07]" : "text-[#1A0E07]"}`}>{title}</div>
        <div className="text-[12.5px] text-black/50 mt-1">{desc}</div>
      </div>
    </div>
  );
}