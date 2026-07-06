"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import CountdownTimer from "@/app/components/ui/CountdownTimer";
import { createClient } from "@/lib/supabase/client";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type InviteType = "team" | "review";

interface TeamInvite {
  type: "team";
  id: string;
  email: string;
  status: string;
  inviterName: string;
}

interface ReviewInvite {
  type: "review";
  role: string;
  deadline: string;
  totalReviewers: number;
  reviewId: string;
  alreadySubmitted: boolean;
}

type InviteData = TeamInvite | ReviewInvite;

function InvitePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const supabase = createClient();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuthAndLoadInvite() {
      try {
        // Check if user is authenticated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Load invite
        const res = await fetch(`/api/invite/${token}`);
        if (!res.ok) throw new Error("Failed to load invite");
        const data = await res.json();
        setInvite(data);

        // If user is authenticated and there's an accepted query param, auto-accept
        if (authUser && searchParams.get("accept") === "true" && data.type === "team" && data.status === "pending") {
          await handleAccept();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndLoadInvite();
  }, [token, searchParams, supabase]);

  async function handleAccept() {
    setSubmitting(true);
    try {
      if (!user) {
        // Redirect to signup with invite token
        const nextUrl = `/invite/${token}?accept=true`;
        const redirectUrl = `/signup?next=${encodeURIComponent(nextUrl)}`;
        router.push(redirectUrl);
        return;
      }

      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept invite");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!confirm("Are you sure you want to decline this invite?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed to decline invite");
      if (invite?.type === "team") {
        router.push("/");
      } else {
        setInvite(prev => prev && "alreadySubmitted" in prev ? { ...prev, alreadySubmitted: true } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9] flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-black/10 border-t-[#1A0E07] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[14px] text-black/60">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
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
          <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Invite Not Found</h1>
          <p className="text-[14px] text-black/60 mb-6">
            {error || "This invite link is invalid or has expired."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Handle Team Invite
  if (invite.type === "team") {
    if (invite.status !== "pending") {
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
            <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Already Responded</h1>
            <p className="text-[14px] text-black/60 mb-6">
              You have already responded to this team invite.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6M23 11h-6"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A0E07]">Team Invite</h1>
                  <p className="text-[14px] text-black/60">
                    You've been invited to join {invite.inviterName}'s team
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
                  <span className="text-[14px] text-black/60">Invited by</span>
                  <span className="text-[14px] font-semibold text-[#1A0E07]">{invite.inviterName}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Accepting..." : "Accept Invite"}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-full border border-black/10 text-[14px] font-semibold text-black/60 hover:bg-black/[0.02] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Decline"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[12px] text-black/40">
              By joining, you'll be able to review candidates together as a team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle Review Invite
  if (invite.type === "review") {
    if (invite.alreadySubmitted) {
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
            <h1 className="text-xl font-bold text-[#1A0E07] mb-2">Already Responded</h1>
            <p className="text-[14px] text-black/60 mb-6">
              You have already responded to this review invite.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    <path d="M8 2v4M16 2v4M3 10h18"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A0E07]">Review Invite</h1>
                  <p className="text-[14px] text-black/60">You've been invited to review a candidate</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
                  <span className="text-[14px] text-black/60">Role</span>
                  <span className="text-[14px] font-semibold text-[#1A0E07]">{invite.role}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
                  <span className="text-[14px] text-black/60">Deadline</span>
                  <CountdownTimer deadline={invite.deadline} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02]">
                  <span className="text-[14px] text-black/60">Reviewers</span>
                  <span className="text-[14px] font-semibold text-[#1A0E07]">{invite.totalReviewers}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/scorecard/${token}`)}
                  className="flex-1 px-6 py-3 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors"
                >
                  Start Review
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-full border border-black/10 text-[14px] font-semibold text-black/60 hover:bg-black/[0.02] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Decline"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[12px] text-black/40">
              By participating, you agree to keep scores confidential until all reviews are in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">Loading...</div>}>
      <InvitePageContent />
    </Suspense>
  );
}
