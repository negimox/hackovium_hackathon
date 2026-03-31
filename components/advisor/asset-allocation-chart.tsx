"use client";

import { useMemo } from "react";

interface AssetAllocationChartProps {
  current: Record<string, number>;
  target: Record<string, number>;
}

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  equity: {
    bg: "bg-emerald-500",
    text: "text-emerald-400",
    border: "border-emerald-500",
  },
  debt: { bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-500" },
  gold: {
    bg: "bg-amber-500",
    text: "text-amber-400",
    border: "border-amber-500",
  },
  cash: {
    bg: "bg-slate-500",
    text: "text-slate-400",
    border: "border-slate-500",
  },
  real_estate: {
    bg: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500",
  },
  ppf: {
    bg: "bg-indigo-500",
    text: "text-indigo-400",
    border: "border-indigo-500",
  },
  nps: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500" },
};

function getColor(key: string) {
  return (
    COLORS[key.toLowerCase()] || {
      bg: "bg-gray-500",
      text: "text-gray-400",
      border: "border-gray-500",
    }
  );
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AssetAllocationChart({
  current,
  target,
}: AssetAllocationChartProps) {
  const allocationData = useMemo(() => {
    const keys = new Set([
      ...Object.keys(current || {}),
      ...Object.keys(target || {}),
    ]);
    return Array.from(keys).map((key) => ({
      key,
      label: formatLabel(key),
      current: current?.[key] || 0,
      target: target?.[key] || 0,
      colors: getColor(key),
    }));
  }, [current, target]);

  const totalCurrent = Object.values(current || {}).reduce((a, b) => a + b, 0);
  const totalTarget = Object.values(target || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Visual allocation bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Allocation */}
        <div>
          <p className="text-sm font-medium mb-3">Current Allocation</p>
          <div className="h-6 rounded-lg overflow-hidden flex bg-muted">
            {allocationData
              .filter((d) => d.current > 0)
              .map((d, i) => (
                <div
                  key={d.key}
                  className={`${d.colors.bg} transition-all`}
                  style={{
                    width: `${(d.current / (totalCurrent || 1)) * 100}%`,
                  }}
                  title={`${d.label}: ${d.current}%`}
                />
              ))}
          </div>
        </div>

        {/* Target Allocation */}
        <div>
          <p className="text-sm font-medium mb-3">Target Allocation</p>
          <div className="h-6 rounded-lg overflow-hidden flex bg-muted">
            {allocationData
              .filter((d) => d.target > 0)
              .map((d, i) => (
                <div
                  key={d.key}
                  className={`${d.colors.bg} transition-all`}
                  style={{ width: `${(d.target / (totalTarget || 1)) * 100}%` }}
                  title={`${d.label}: ${d.target}%`}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Legend with details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allocationData.map((d) => (
          <div
            key={d.key}
            className={`flex items-center gap-3 p-3 rounded-lg border ${d.colors.border}/20 bg-muted/30`}
          >
            <div className={`w-3 h-3 rounded-full ${d.colors.bg}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{d.label}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{d.current}%</span>
                <span>→</span>
                <span className={d.colors.text}>{d.target}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rebalancing note */}
      {allocationData.some((d) => Math.abs(d.current - d.target) >= 5) && (
        <p className="text-xs text-muted-foreground bg-amber-500/10 text-amber-400 px-3 py-2 rounded-lg">
          💡 Your current allocation differs from target by 5%+ in some
          categories. Consider rebalancing gradually.
        </p>
      )}
    </div>
  );
}
