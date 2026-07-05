"use client";

import { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  wallet_status: string;
  wallet_address: string | null;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch("/api/profile/team");
        if (!res.ok) throw new Error("Failed to load team");
        const data = await res.json();
        setTeam(data.team);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/profile/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invite");
      }
      
      setSuccess("Invitation sent successfully!");
      setInviteEmail("");
      setTimeout(() => {
        setShowInviteModal(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${jakartaSans.className} max-w-4xl mx-auto px-4 py-8`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Team Members</h1>
          <p className="text-[14px] text-black/60">Manage your team and invite new reviewers</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Invite Member
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.07] p-5">
              <div className="h-5 bg-black/10 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-black/5 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : team.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
          <div className="mb-4">
            <lord-icon
              src="https://cdn.lordicon.com/zrkkrrqk.json"
              trigger="hover"
              style={{ width: "100px", height: "100px" }}
            />
          </div>
          <h2 className="text-lg font-bold text-[#1A0E07] mb-2">No team members yet</h2>
          <p className="text-[14px] text-black/60 mb-6">Invite your first team member to start collaborating</p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Invite First Member
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {team.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl border border-black/[0.07] p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-white">{member.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#1A0E07]">{member.full_name}</div>
                <div className="text-[13px] text-black/60">{member.email}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                member.wallet_status === "created" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {member.wallet_status === "created" ? "Wallet Ready" : "Wallet Pending"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1A0E07]">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-black/40 hover:text-black/60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px]">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-[13px]">
                  {success}
                </div>
              )}
              <div>
                <label htmlFor="inviteEmail" className="block text-[13px] font-medium text-black/80 mb-2">
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-full border border-black/10 text-[14px] font-semibold text-black/60 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
