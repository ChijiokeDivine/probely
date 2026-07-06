"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const PRESETS = [
  {
    role: "Engineering",
    categories: [
      { name: "Problem Solving", weight: 25 },
      { name: "Technical Depth", weight: 30 },
      { name: "Communication", weight: 20 },
      { name: "Collaboration", weight: 15 },
      { name: "Culture & Growth", weight: 10 },
    ],
    description: "Emphasizes technical depth and problem-solving for IC roles"
  },
  {
    role: "Product",
    categories: [
      { name: "Problem Solving", weight: 20 },
      { name: "Technical Depth", weight: 15 },
      { name: "Communication", weight: 30 },
      { name: "Collaboration", weight: 25 },
      { name: "Culture & Growth", weight: 10 },
    ],
    description: "Balances communication and collaboration with strategic thinking"
  },
  {
    role: "Design",
    categories: [
      { name: "Problem Solving", weight: 25 },
      { name: "Technical Depth", weight: 10 },
      { name: "Communication", weight: 25 },
      { name: "Collaboration", weight: 30 },
      { name: "Culture & Growth", weight: 10 },
    ],
    description: "Prioritizes collaboration and communication with creative problem-solving"
  },
  {
    role: "Operations",
    categories: [
      { name: "Problem Solving", weight: 20 },
      { name: "Technical Depth", weight: 10 },
      { name: "Communication", weight: 25 },
      { name: "Collaboration", weight: 30 },
      { name: "Culture & Growth", weight: 15 },
    ],
    description: "Emphasizes collaboration and interpersonal communication"
  },
];

export default function CategoryWeightsPage() {
  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/dashboard" className="text-[14px] text-black/50 hover:text-black/70 mb-8 inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          Back to dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A0E07] mb-4">
            Designing Fair Category Weights
          </h1>
          <p className="text-lg text-black/60">
            How to balance feedback across different competencies for your role
          </p>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-2xl border border-black/[0.07] p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4">Why Weights Matter</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              A software engineer and a product manager shouldnt be evaluated on the same scale. Different roles require different competencies. By adjusting category weights, you ensure that final scores reflect what actually matters for each position.
            </p>

            <p className="text-black/70 leading-relaxed mb-6">
              Weights are the multipliers applied to each category score when calculating the final overall score. A weight of 30 means that category contributes 30% to the final result, while a weight of 10 means it contributes just 10%.
            </p>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">The Five Core Categories</h2>
            
            <div className="grid grid-cols-1 gap-4 my-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1A0E07] mb-2">Problem Solving</h3>
                <p className="text-sm text-black/70">Ability to break down complex challenges, think critically, and develop effective solutions. Core to decision-making.</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1A0E07] mb-2">Technical Depth</h3>
                <p className="text-sm text-black/70">Mastery of domain-specific skills, tools, and methodologies. Indicates expertise level and learning capacity.</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1A0E07] mb-2">Communication</h3>
                <p className="text-sm text-black/70">Ability to articulate ideas clearly, listen actively, and adapt messaging. Essential for team alignment.</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1A0E07] mb-2">Collaboration</h3>
                <p className="text-sm text-black/70">Working effectively with others, sharing knowledge, and supporting team success. Multiplier for team performance.</p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1A0E07] mb-2">Culture & Growth</h3>
                <p className="text-sm text-black/70">Alignment with company values, willingness to learn, and positive influence. Predicts long-term fit and impact.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">How the Overall Score is Calculated</h2>
            <p className="text-black/70 leading-relaxed mb-6">
              The overall score is a weighted average of all five categories:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 font-mono text-sm text-black/70 mb-6">
              <p>Overall Score = (Problem Solving × 0.25) + (Technical Depth × 0.30) + (Communication × 0.20) + (Collaboration × 0.15) + (Culture & Growth × 0.10)</p>
            </div>

            <p className="text-black/70 leading-relaxed mb-6">
              Each weight is applied proportionally. In the example above, Technical Depth has 1.5x more influence than Culture & Growth on the final score.
            </p>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Pre-Built Presets by Role</h2>
            <p className="text-black/70 leading-relaxed mb-8">
              Honio includes optimized weight presets for common roles. These are starting points—feel free to customize:
            </p>

            <div className="space-y-8">
              {PRESETS.map((preset, idx) => (
                <div key={idx} className="border border-black/[0.07] rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#1A0E07] mb-1">{preset.role}</h3>
                    <p className="text-sm text-black/60">{preset.description}</p>
                  </div>

                  <div className="space-y-3">
                    {preset.categories.map((cat, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#1A0E07]">{cat.name}</span>
                          <span className="text-sm font-bold text-blue-600">{cat.weight}%</span>
                        </div>
                        <div className="h-2 bg-black/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${cat.weight}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-black/40 mt-4 pt-4 border-t border-black/[0.05]">
                    Total: {preset.categories.reduce((sum, cat) => sum + cat.weight, 0)}%
                  </p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Customizing Weights</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <h3 className="font-semibold text-blue-900 mb-3">When creating or editing a review:</h3>
              <ol className="space-y-2 text-sm text-black/70">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Start with a preset or build custom weights</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Adjust each category to reflect role priorities</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Ensure total weights sum to 100%</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Share weight distribution with reviewers so they understand the emphasis</span>
                </li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Best Practices</h2>
            
            <div className="space-y-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-[#1A0E07] mb-1">✓ Be intentional</h3>
                <p className="text-sm text-black/70">Weights should reflect your actual hiring/evaluation criteria. If collaboration does not matter, do not weight it high.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-[#1A0E07] mb-1">✓ Communicate clearly</h3>
                <p className="text-sm text-black/70">Share your weights with reviewers upfront. Transparency helps calibrate their feedback to what matters most.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-[#1A0E07] mb-1">✓ Stay consistent</h3>
                <p className="text-sm text-black/70">Use the same weights across multiple candidates for the same role to enable fair comparisons.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-[#1A0E07] mb-1">✓ Iterate and learn</h3>
                <p className="text-sm text-black/70">After each hiring cycle, review whether weights predicted on-the-job performance. Adjust for next time.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#1A0E07] mb-4 mt-8">Example: Why Weights Matter</h2>
            
            <p className="text-black/70 leading-relaxed mb-4">
              Consider two candidates evaluated on the same 5 categories (each scoring 1-10):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-black/50 mb-2">Category</p>
                <p className="font-mono text-xs text-black/70 space-y-1">
                  <div>Problem Solving</div>
                  <div>Tech Depth</div>
                  <div>Communication</div>
                  <div>Collaboration</div>
                  <div>Culture & Growth</div>
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-black/50 mb-2">Candidate A</p>
                <p className="font-mono text-xs text-black/70 space-y-1">
                  <div>9</div>
                  <div>10</div>
                  <div>6</div>
                  <div>6</div>
                  <div>5</div>
                </p>
                <p className="text-xs font-bold text-blue-600 mt-2">Avg: 7.2</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-black/50 mb-2">Candidate B</p>
                <p className="font-mono text-xs text-black/70 space-y-1">
                  <div>8</div>
                  <div>8</div>
                  <div>9</div>
                  <div>9</div>
                  <div>8</div>
                </p>
                <p className="text-xs font-bold text-green-600 mt-2">Avg: 8.4</p>
              </div>
            </div>

            <p className="text-black/70 leading-relaxed mb-4">
              <strong>Equal Weights (20% each):</strong> Candidate B wins 8.4 vs 7.2
            </p>

            <p className="text-black/70 leading-relaxed mb-6">
              <strong>Engineering Weights (25% Problem Solving, 30% Tech Depth, etc.):</strong> Candidate A actually wins because their technical depth is weighted more heavily. Different weights can flip the decision.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-sm text-black/70">
                <strong>The takeaway:</strong> Choose weights that match your role requirements. Over-weighting dimensions that do not matter leads to hiring mistakes. Under-weighting critical skills wastes resources.
              </p>
            </div>
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
            <Link href="/resources/blockchain-verification" className="bg-white border border-black/[0.07] rounded-xl p-6 hover:border-black/15 hover:shadow-lg transition-all">
              <div className="font-bold text-[#1A0E07] mb-2">Reading your results on-chain</div>
              <p className="text-sm text-black/60">How scores are verified on Sepolia Etherscan</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
