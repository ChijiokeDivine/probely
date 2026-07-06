"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function BlockchainVerificationPage() {
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
            Reading Your Results On-Chain
          </h1>
          <p className="text-lg text-black/60">
            How Honio stores and verifies review results on the blockchain
          </p>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4">Why Blockchain?</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              While FHE protects individual scores during collection, blockchain provides the final layer: an immutable, public record that proves:
            </p>

            <ul className="space-y-2 text-black/70 mb-6">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>When scores were revealed</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Who initiated the reveal</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>What the aggregated results were</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>That no tampering has occurred since</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">How Honio Uses Sepolia Testnet</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              Honio deploys a smart contract on Ethereums Sepolia testnet (a free testing network that mimics Ethereum`s security model). When review results are ready:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <h3 className="font-semibold text-blue-900 mb-3">The Blockchain Flow</h3>
              <ol className="space-y-3 text-black/70">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">1.</span>
                  <span><strong>Reveal Initiation:</strong> Admin clicks `Reveal Results` in the dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">2.</span>
                  <span><strong>Contract Execution:</strong> A transaction is submitted to the BlindReview smart contract on Sepolia</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">3.</span>
                  <span><strong>Homomorphic Decryption:</strong> The contract triggers decryption of the aggregated encrypted scores</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">4.</span>
                  <span><strong>Result Storage:</strong> Final results are recorded on-chain with a transaction hash (txHash)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 shrink-0">5.</span>
                  <span><strong>Public Verification:</strong> Anyone can view the transaction and results on Etherscan</span>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Viewing Results on Etherscan</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              Every Honio review reveal generates a transaction that`s visible to the world. After results are revealed, you`ll see a link to the Sepolia Etherscan block explorer showing:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6 font-mono text-sm text-black/70 space-y-2">
              <p><strong>Transaction Hash:</strong> A unique identifier for the reveal</p>
              <p><strong>From/To:</strong> Who initiated the reveal and which smart contract received it</p>
              <p><strong>Block Number:</strong> When (in blockchain history) the reveal occurred</p>
              <p><strong>Gas Used:</strong> The computational cost of the operation</p>
              <p><strong>Input Data:</strong> Cryptographically encoded parameters (encrypted scores)</p>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Understanding Transaction Status</h2>
            
            <div className="grid grid-cols-1 gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="font-bold text-[#1A0E07] mb-2 flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span> Success
                </div>
                <p className="text-sm text-black/70">The reveal was successful. Results are now decrypted and final</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="font-bold text-[#1A0E07] mb-2 flex items-center gap-2">
                  <span className="text-amber-600 text-xl">⏳</span> Pending
                </div>
                <p className="text-sm text-black/70">The transaction is waiting to be included in a block. This usually takes 10-30 seconds</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="font-bold text-[#1A0E07] mb-2 flex items-center gap-2">
                  <span className="text-red-600 text-xl">✗</span> Failed
                </div>
                <p className="text-sm text-black/70">Something went wrong. Check the error message. Usually due to gas limits or network issues</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Proof of Reveal</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              The blockchain serves as proof that:
            </p>

            <ul className="space-y-3 text-black/70 mb-6">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Timestamp:</strong> Results were revealed on a specific date/time (blockchain time is universal)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Authority:</strong> Only the admin wallet could have initiated the reveal</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Immutability:</strong> The results can never be changed or deleted from history</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Transparency:</strong> Anyone—even someone outside your organization—can verify the reveal</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Why Sepolia Testnet?</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              We use Sepolia (not mainnet) because:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-blue-600 text-lg font-bold mb-2">🔬</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Risk-Free</h3>
                <p className="text-sm text-black/70">Test operations have no financial risk. Perfect for new features</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-blue-600 text-lg font-bold mb-2">⚡</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Fast & Free</h3>
                <p className="text-sm text-black/70">Transactions are instant and free (or near-free testnet ETH)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-blue-600 text-lg font-bold mb-2">🔗</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Production-Like</h3>
                <p className="text-sm text-black/70">Uses the same smart contract infrastructure as mainnet Ethereum</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-blue-600 text-lg font-bold mb-2">📊</div>
                <h3 className="font-bold text-[#1A0E07] mb-2">Publicly Inspectable</h3>
                <p className="text-sm text-black/70">All transactions are visible on Sepolia Etherscan—full transparency</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">A Note on Gas Fees</h2>
            <p className="text-black/70 leading-relaxed">
              When reviewing results in Honio, you may notice `Gas Used` in the Etherscan transaction. This is the computational cost of running the smart contract. Honio covers these costs via a backend relayer account, so you never have to pay gas fees. The blockchain still records what was spent, providing a complete audit trail of the review process.
            </p>
          </div>
        </div>

        {/* Related resources */}
        <div>
          <h2 className="text-2xl font-bold text-[#1A0E07] mb-6">Learn more about</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/resources/fhe-privacy" className="bg-white border border-black/[0.07] rounded-xl p-6 hover:border-black/15 hover:shadow-lg transition-all">
              <div className="font-bold text-[#1A0E07] mb-2">How FHE keeps scores private</div>
              <p className="text-sm text-black/60">Cryptographic privacy during score collection</p>
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
