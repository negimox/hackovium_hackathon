"use client";

import { ShieldAlert, ShieldCheck, HeartPulse, UserCheck } from "lucide-react";

interface InsuranceGapProps {
  insurance: {
    has_term: boolean;
    recommended_term_cover: number;
    current_term_cover: number;
    term_gap: number;
    has_health: boolean;
    recommended_health_cover: number;
    current_health_cover: number;
    health_gap: number;
    recommendations: string[];
  };
}

function formatINR(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(1)}Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function InsuranceGap({ insurance }: InsuranceGapProps) {
  const items = [
    {
      label: "Term Life Insurance",
      icon: UserCheck,
      has: insurance.has_term,
      current: insurance.current_term_cover,
      recommended: insurance.recommended_term_cover,
      gap: insurance.term_gap,
    },
    {
      label: "Health Insurance",
      icon: HeartPulse,
      has: insurance.has_health,
      current: insurance.current_health_cover,
      recommended: insurance.recommended_health_cover,
      gap: insurance.health_gap,
    },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        {insurance.term_gap > 0 || insurance.health_gap > 0 ? (
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        )}
        Insurance Assessment
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const hasGap = item.gap > 0;
          const fillPct = item.recommended > 0
            ? Math.min(100, (item.current / item.recommended) * 100)
            : 0;

          return (
            <div
              key={item.label}
              className={`rounded-lg border p-4 ${
                hasGap ? "border-amber-500/30" : "border-emerald-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${hasGap ? "text-amber-400" : "text-emerald-400"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              {/* Coverage bar */}
              <div className="mb-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      hasGap ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {item.has ? formatINR(item.current) : "None"}</span>
                <span>Needed: {formatINR(item.recommended)}</span>
              </div>

              {hasGap && (
                <p className="text-xs text-amber-400 mt-2">
                  Gap: {formatINR(item.gap)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {insurance.recommendations.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          {insurance.recommendations.map((rec, i) => (
            <li key={i}>• {rec}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
