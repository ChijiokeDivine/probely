"use client";

import { useEffect, useState } from "react";

interface Candidate {
  id: string;
  candidate_ref: string;
  full_name: string;
  email: string | null;
  notes: string | null;
  created_at: string;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-black/[0.07] p-5">
          <div className="h-5 bg-black/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-black/5 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [newCandidate, setNewCandidate] = useState({ fullName: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/candidates");
        if (!res.ok) throw new Error("Failed to load candidates");
        const data = await res.json();
        setCandidates(data.candidates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  async function handleSubmitCandidate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCandidate),
      });
      if (!res.ok) throw new Error("Failed to create candidate");
      const { candidate } = await res.json();
      setCandidates(prev => prev ? [candidate, ...prev] : [candidate]);
      setNewCandidate({ fullName: "", email: "", notes: "" });
      setShowNewCandidateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Candidates</h1>
          <p className="text-[14px] text-black/60">Manage and track all candidates in your pipeline</p>
        </div>
        <button
          onClick={() => setShowNewCandidateModal(true)}
          className="px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Add Candidate
        </button>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-100 bg-red-50 text-[13.5px] text-red-700">{error}</div>}

      {loading ? (
        <Skeleton />
      ) : !candidates || candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
          <div className="mb-4">
            <lord-icon
              src="https://cdn.lordicon.com/zrkkrrqk.json"
              trigger="hover"
              style={{ width: "120px", height: "120px" }}
            />
          </div>
          <h2 className="text-lg font-bold text-[#1A0E07] mb-2">No candidates yet</h2>
          <p className="text-[14px] text-black/60 mb-6">Add your first candidate to start the review process</p>
          <button
            onClick={() => setShowNewCandidateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold bg-[#1A0E07] text-white hover:bg-[#2b1a0e] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add First Candidate
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className="w-full text-left bg-white rounded-2xl border border-black/[0.07] p-6 hover:border-black/15 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#1A0E07] truncate">{candidate.full_name}</div>
                  <div className="text-[12px] text-black/40 font-mono">{candidate.candidate_ref}</div>
                </div>
              </div>
              {candidate.email && (
                <div className="text-[14px] text-black/70 truncate mb-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="inline mr-1.5"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {candidate.email}
                </div>
              )}
              {candidate.notes && (
                <div className="text-[12px] text-black/50 line-clamp-2">{candidate.notes}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New Candidate Modal */}
      {showNewCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1A0E07]">Add New Candidate</h2>
              <button
                onClick={() => setShowNewCandidateModal(false)}
                className="text-black/40 hover:text-black/60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitCandidate} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-[13px] font-medium text-black/80 mb-2">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={newCandidate.fullName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-black/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-[13px] font-medium text-black/80 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={newCandidate.notes}
                  onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCandidateModal(false)}
                  className="flex-1 px-4 py-2 rounded-full border border-black/10 text-[14px] font-semibold text-black/60 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 border-b border-black/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#1A0E07] flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-white">
                      {selectedCandidate.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A0E07]">{selectedCandidate.full_name}</h2>
                    <p className="text-[13px] text-black/50 font-mono">{selectedCandidate.candidate_ref}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-black/40 hover:text-black/60"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {selectedCandidate.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/[0.05] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-black/60">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[12px] text-black/40">Email</div>
                    <div className="text-[14px] font-medium text-[#1A0E07]">{selectedCandidate.email}</div>
                  </div>
                </div>
              )}
              
              {selectedCandidate.notes && (
                <div className="p-4 rounded-xl bg-black/[0.02]">
                  <div className="text-[12px] text-black/40 mb-2">Notes</div>
                  <div className="text-[14px] text-black/70">{selectedCandidate.notes}</div>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button className="flex-1 px-6 py-2.5 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors">
                  Start Review
                </button>
                <button className="px-6 py-2.5 rounded-full border border-black/10 text-[14px] font-semibold text-black/60 hover:bg-black/[0.02] transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
