"use client";

interface MonthlyEntry {
  month: string;
  equity_pct: number;
  debt_pct: number;
  sip_large_cap: number;
  sip_mid_cap: number;
  sip_small_cap: number;
  sip_debt: number;
  sip_gold: number;
  ppf_contribution: number;
  nps_contribution: number;
  emergency_fund_contribution: number;
  notes: string;
}

interface PlanTimelineProps {
  monthlyPlan: MonthlyEntry[];
}

function formatINR(val: number): string {
  if (!val) return "—";
  return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function PlanTimeline({ monthlyPlan }: PlanTimelineProps) {
  if (!monthlyPlan || monthlyPlan.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5 text-center text-sm text-muted-foreground">
        No monthly plan data available yet.
      </div>
    );
  }

  // Show first 12 months and option to expand
  const displayPlan = monthlyPlan.slice(0, 24);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <h3 className="font-semibold text-sm">Monthly Investment Plan</h3>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Month</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Large Cap</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Mid Cap</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Small Cap</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Debt</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Gold</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">PPF</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">NPS</th>
              <th className="text-right py-2 pl-2 text-muted-foreground font-medium">Eq%</th>
            </tr>
          </thead>
          <tbody>
            {displayPlan.map((entry, i) => {
              const total =
                entry.sip_large_cap + entry.sip_mid_cap + entry.sip_small_cap +
                entry.sip_debt + entry.sip_gold + entry.ppf_contribution + entry.nps_contribution;

              return (
                <tr
                  key={entry.month || i}
                  className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-2 pr-3 font-medium">{entry.month}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.sip_large_cap)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.sip_mid_cap)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.sip_small_cap)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.sip_debt)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.sip_gold)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.ppf_contribution)}</td>
                  <td className="py-2 px-2 text-right font-display">{formatINR(entry.nps_contribution)}</td>
                  <td className="py-2 pl-2 text-right">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      entry.equity_pct > 60
                        ? "bg-emerald-500/10 text-emerald-400"
                        : entry.equity_pct > 40
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-sky-500/10 text-sky-400"
                    }`}>
                      {entry.equity_pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {monthlyPlan.length > 24 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first 24 of {monthlyPlan.length} months
        </p>
      )}
    </div>
  );
}
