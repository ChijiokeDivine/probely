"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function FHEPrivacyPage() {
  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/dashboard" className="text-[14px] text-black/50 hover:text-black/70 mb-8 inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          Back to dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A0E07] mb-4">
            How FHE Keeps Scores Private
          </h1>
          <p className="text-lg text-black/60">
            Understanding Fully Homomorphic Encryption in blind reviews
          </p>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4">The Privacy Challenge</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              In traditional blind review platforms, there`s a critical vulnerability: once all reviewers submit their scores, the platform administrator must see the unencrypted scores to aggregate and reveal them. This creates a trusted intermediary problem—the admin could theoretically view individual scores before the official reveal.
            </p>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Introducing FHE</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              Fully Homomorphic Encryption (FHE) is a cryptographic technique that allows computation on encrypted data without decryption. In simpler terms: calculations can be performed on locked data, and the result remains locked until authorized decryption.
            </p>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">How Honio Uses FHE</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <h3 className="font-semibold text-blue-900 mb-3">The Flow</h3>
              <ol className="space-y-3 text-black/70">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">1.</span>
                  <span><strong>Submission:</strong> Each reviewer enters their scores (1-10) for each category on their scorecard</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">2.</span>
                  <span><strong>Encryption:</strong> Scores are encrypted using FHE before being sent to the backend</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">3.</span>
                  <span><strong>Storage:</strong> Only encrypted score handles are stored in the database. Nobody can see the actual values</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">4.</span>
                  <span><strong>Aggregation:</strong> When the admin clicks `Reveal Results,` encrypted scores are aggregated on-chain using homomorphic operations</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">5.</span>
                  <span><strong>Reveal:</strong> A relayer decrypts the final aggregated result, and only the averages (not individual scores) are revealed</span>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">What This Means for You</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-green-600 text-2xl font-bold mb-2">✓</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Reviewer Privacy</h3>
                <p className="text-sm text-black/70">Individual scores remain cryptographically hidden from everyone, including admins, until the reveal moment</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-green-600 text-2xl font-bold mb-2">✓</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Audit Trail</h3>
                <p className="text-sm text-black/70">All encryption, aggregation, and decryption operations are recorded on the blockchain for verification</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-green-600 text-2xl font-bold mb-2">✓</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">No Trust Required</h3>
                <p className="text-sm text-black/70">The cryptography guarantees privacy mathematically—no need to trust the platform</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-green-600 text-2xl font-bold mb-2">✓</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Verifiable Results</h3>
                <p className="text-sm text-black/70">Results can be cryptographically proven to be correct even after decryption</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Technical Details</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              Honio uses the <strong>FHEVM (Fully Homomorphic Encryption Virtual Machine)</strong> standard, which is compatible with EVM-based blockchains like Ethereum Sepolia. This means:
            </p>

            <ul className="space-y-3 text-black/70 mb-6">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Scores are encrypted client-side using the FHEVM public key before submission</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>The smart contract can perform calculations on encrypted data</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Results are stored as encrypted values with a decryption request</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>A specialized relayer node decrypts the final result off-chain</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Why This Matters</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              Traditional 360-degree reviews and feedback platforms rely on human trust to protect individual scores. One disgruntled admin or security breach could expose sensitive feedback. FHE removes this human element entirely—the mathematics of encryption makes it impossible for anyone to see individual scores before the authorized reveal, no matter how much system access they have.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
              <p className="text-sm text-black/70">
                <strong>Think of it like this:</strong> Instead of locking feedback in a filing cabinet that an admin has a key to, we`re using a safe that requires two keys to open—one held by the blockchain network and one held by decryption logic. The platform never has both keys simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Related resources */}
        <div>
          <h2 className="text-2xl font-bold text-[#1A0E07] mb-6">Learn more about</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/resources/blockchain-verification" className="bg-white border border-black/[0.07] rounded-xl p-6 hover:border-black/15 hover:shadow-lg transition-all">
              <div className="font-bold text-[#1A0E07] mb-2">Reading your results on-chain</div>
              <p className="text-sm text-black/60">How scores are verified on Sepolia Etherscan</p>
            </Link>
            <Link href="/resources/category-weights" className="bg-white border border-black/[0.07] rounded-xl p-6 hover:border-black/15 hover:shadow-lg transition-all">
              <div className="font-bold text-[#1A0E07] mb-2">Designing fair category weights</div>
              <p className="text-sm text-black/60">Balancing feedback across different competencies</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
