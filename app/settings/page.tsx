"use client";

import { useEffect, useState } from "react";

interface Profile {
  id: string;
  full_name: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  wallet_status: string;
  privy_wallet_id: string | null;
  wallet_address: string | null;
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
        <div className="h-5 bg-black/10 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-black/5 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-black/5 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-black/5 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-black/5 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: "", company: "" });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data.profile);
        setFormData({
          fullName: data.profile.full_name || "",
          company: data.profile.company || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          company: formData.company || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setProfile(data.profile);
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Account Settings</h1>
        <p className="text-[14px] text-black/60">Manage your personal information and preferences</p>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl border border-red-100 bg-red-50 text-[13.5px] text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl border border-green-100 bg-green-50 text-[13.5px] text-green-700">
              {success}
            </div>
          )}

          {/* Profile Info */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <h2 className="text-lg font-bold text-[#1A0E07] mb-6">Profile Information</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-[13px] font-medium text-black/80 mb-2">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-black/10 bg-black/[0.02] text-black/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-[13px] font-medium text-black/80 mb-2">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
                  placeholder="Enter your company name"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-full bg-[#1A0E07] text-white text-[14px] font-semibold hover:bg-[#2b1a0e] transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Wallet Status */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <h2 className="text-lg font-bold text-[#1A0E07] mb-4">Wallet Status</h2>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${profile?.wallet_status === "created" ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <div className="text-[14px] text-black/70">
                <span className="font-semibold text-[#1A0E07] capitalize">{profile?.wallet_status?.replace("_", " ")}</span>
                {profile?.wallet_status === "created" ? (
                  <span className="block text-[12px] text-black/50 mt-0.5">Your wallet is ready to use</span>
                ) : (
                  <span className="block text-[12px] text-black/50 mt-0.5">Setting up your wallet...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
