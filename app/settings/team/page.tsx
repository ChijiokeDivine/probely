"use client";

export default function TeamPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A0E07] mb-2">Team Members</h1>
        <p className="text-[14px] text-black/60">Manage your team and invite new members</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
        <div className="mb-4">
          <lord-icon
            src="https://cdn.lordicon.com/zrkkrrqk.json"
            trigger="hover"
            style={{ width: "100px", height: "100px" }}
          />
        </div>
        <h2 className="text-lg font-bold text-[#1A0E07] mb-2">Coming Soon</h2>
        <p className="text-[14px] text-black/60">
          Team management features will be available in a future update.
        </p>
      </div>
    </div>
  );
}
