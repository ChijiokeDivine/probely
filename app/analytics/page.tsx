"use client";

import { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Mock data for charts
const MOCK_REVIEWS_OVER_TIME = [
  { month: "Jan", total: 5, completed: 3 },
  { month: "Feb", total: 8, completed: 6 },
  { month: "Mar", total: 12, completed: 10 },
  { month: "Apr", total: 15, completed: 12 },
  { month: "May", total: 18, completed: 16 },
  { month: "Jun", total: 20, completed: 18 },
];

const MOCK_CATEGORY_AVERAGES = [
  { name: "Problem Solving", average: 82 },
  { name: "Technical Depth", average: 78 },
  { name: "Communication", average: 85 },
  { name: "Collaboration", average: 88 },
  { name: "Culture & Growth", average: 80 },
];

const MOCK_STATUS_DISTRIBUTION = [
  { name: "Completed", count: 24, color: "#16A34A" },
  { name: "In Progress", count: 8, color: "#3B82F6" },
  { name: "Pending", count: 5, color: "#D97706" },
  { name: "Cancelled", count: 3, color: "#9CA3AF" },
];

// Line chart component
function LineChart() {
  const maxValue = Math.max(...MOCK_REVIEWS_OVER_TIME.map(r => Math.max(r.total, r.completed)));
  const chartHeight = 250;
  const chartWidth = 600;

  const getY = (value: number) => chartHeight - (value / maxValue) * (chartHeight - 40);

  // Create path for total reviews
  const totalPoints = MOCK_REVIEWS_OVER_TIME.map((r, i) => {
    const x = 60 + (i * (chartWidth - 80)) / (MOCK_REVIEWS_OVER_TIME.length - 1);
    const y = getY(r.total);
    return { x, y };
  });

  const totalPath = `M ${totalPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`;

  // Create path for completed reviews
  const completedPoints = MOCK_REVIEWS_OVER_TIME.map((r, i) => {
    const x = 60 + (i * (chartWidth - 80)) / (MOCK_REVIEWS_OVER_TIME.length - 1);
    const y = getY(r.completed);
    return { x, y };
  });

  const completedPath = `M ${completedPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`;

  return (
    <div className="w-full overflow-hidden">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - ratio * (chartHeight - 40);
          return (
            <g key={ratio}>
              <line x1="50" y1={y} x2={chartWidth - 20} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x="45" y={y + 4} textAnchor="end" fontSize="12" fill="#9CA3AF">
                {Math.round(ratio * maxValue)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {MOCK_REVIEWS_OVER_TIME.map((r, i) => {
          const x = 60 + (i * (chartWidth - 80)) / (MOCK_REVIEWS_OVER_TIME.length - 1);
          return (
            <text key={r.month} x={x} y={chartHeight - 10} textAnchor="middle" fontSize="12" fill="#6B7280">
              {r.month}
            </text>
          );
        })}

        {/* Total reviews line */}
        <path d={totalPath} fill="none" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {totalPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#E5E7EB" />
        ))}

        {/* Completed reviews line */}
        <path d={completedPath} fill="none" stroke="#1A0E07" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {completedPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="#1A0E07" />
        ))}
      </svg>
    </div>
  );
}

// Bar chart component for category averages
function BarChart() {
  const chartHeight = 300;
  const chartWidth = 600;
  const maxValue = 100;

  return (
    <div className="w-full overflow-hidden">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {MOCK_CATEGORY_AVERAGES.map((cat, i) => {
          const barWidth = 80;
          const gap = 20;
          const x = 80 + i * (barWidth + gap);
          const barHeight = (cat.average / maxValue) * (chartHeight - 80);
          const y = chartHeight - barHeight - 60;

          return (
            <g key={cat.name}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#1A0E07"
                rx="8"
                className="transition-all duration-300 hover:fill-[#2b1a0e] cursor-pointer"
              />
              {/* Label */}
              <text x={x + barWidth / 2} y={chartHeight - 35} textAnchor="middle" fontSize="12" fill="#6B7280" className="rotate-[-15deg] origin-center">
                {cat.name}
              </text>
              {/* Value */}
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1A0E07">
                {cat.average}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Donut chart for status distribution
function DonutChart() {
  const total = MOCK_STATUS_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0);
  const radius = 100;
  const cx = 150;
  const cy = 150;

  let currentAngle = 0;
  const segments = MOCK_STATUS_DISTRIBUTION.map((item) => {
    const angle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex items-center gap-8">
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Donut segments */}
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.path}
            fill={segment.color}
            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
          />
        ))}
        {/* Center hole */}
        <circle cx={cx} cy={cy} r="50" fill="white" />
        {/* Total count in center */}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="32" fontWeight="800" fill="#1A0E07">
          {total}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="14" fill="#6B7280">
          Total
        </text>
      </svg>

      <div className="space-y-3">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: segment.color }}></div>
            <span className="text-[14px] text-[#1A0E07] font-medium">{segment.name}</span>
            <span className="text-[14px] text-black/50 ml-auto font-semibold">
              {segment.count} ({Math.round((segment.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6m");

  return (
    <div className={`${jakartaSans.className} min-h-screen bg-[#f9f9f9]`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1A0E07] mb-2">Analytics</h1>
            <p className="text-[14px] text-black/60">Insights into your review process</p>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-black/[0.07]">
            {["1m", "3m", "6m", "1y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  timeRange === range ? "bg-[#1A0E07] text-white" : "text-black/50 hover:text-black/70"
                }`}
              >
                {range === "1m" ? "Last month" : range === "3m" ? "3 months" : range === "6m" ? "6 months" : "Last year"}
              </button>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-10">
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1A0E07]/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A0E07" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1A0E07] mb-1">40</div>
            <div className="text-[13px] text-black/50">Total reviews</div>
            <div className="mt-3 flex items-center gap-1 text-[12px] text-green-600 font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              +15% from last month
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1A0E07] mb-1">24</div>
            <div className="text-[13px] text-black/50">Completed</div>
            <div className="mt-3 flex items-center gap-1 text-[12px] text-green-600 font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              +12% from last month
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1A0E07] mb-1">7.2d</div>
            <div className="text-[13px] text-black/50">Avg. turnaround</div>
            <div className="mt-3 flex items-center gap-1 text-[12px] text-green-600 font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V4m0 0l-6 6m6-6l6 6"></path>
              </svg>
              -1.5d from last month
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M6 14a6 6 0 0012 0"></path>
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-[#1A0E07] mb-1">12</div>
            <div className="text-[13px] text-black/50">Active reviewers</div>
            <div className="mt-3 flex items-center gap-1 text-[12px] text-green-600 font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              +3 this month
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Reviews over time */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1A0E07]">Reviews over time</h2>
                <p className="text-[13px] text-black/50">Total and completed reviews</p>
              </div>
              <div className="flex items-center gap-4 text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1A0E07]"></div>
                  <span className="text-black/60">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E5E7EB]"></div>
                  <span className="text-black/60">Total</span>
                </div>
              </div>
            </div>
            <LineChart />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category averages */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1A0E07]">Category averages</h2>
              <p className="text-[13px] text-black/50">Average scores across completed reviews</p>
            </div>
            <BarChart />
          </div>

          {/* Status distribution */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1A0E07]">Status distribution</h2>
              <p className="text-[13px] text-black/50">Breakdown of review statuses</p>
            </div>
            <DonutChart />
          </div>
        </div>
      </div>
    </div>
  );
}
