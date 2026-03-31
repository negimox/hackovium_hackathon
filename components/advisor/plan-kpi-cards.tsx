"use client";

import {
  Target,
  TrendingUp,
  Calendar,
  PiggyBank,
  Wallet,
  AlertTriangle,
} from "lucide-react";

interface PlanKPICardsProps {
  plan: {
    target_corpus: number;
    monthly_sip_total: number;
    estimated_retirement_date: string;
    tax_comparison: {
      recommended_regime: string;
      savings_amount: number;
    };
    insurance_gap: {
      term_gap: number;
      health_gap: number;
    };
    asset_allocation_target: Record<string, number>;
  };
}

function formatINR(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(1)}Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function PlanKPICards({ plan }: PlanKPICardsProps) {
  const hasInsuranceGap =
    plan.insurance_gap.term_gap > 0 || plan.insurance_gap.health_gap > 0;

  const cards = [
    {
      label: "Target Corpus",
      value: formatINR(plan.target_corpus),
      description: `Achieve by ${plan.estimated_retirement_date}`,
      icon: Target,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Recommended SIP",
      value: `${formatINR(plan.monthly_sip_total)}/mo`,
      description: "Total monthly investment",
      icon: PiggyBank,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Tax Savings",
      value: formatINR(plan.tax_comparison.savings_amount),
      description: `${plan.tax_comparison.recommended_regime.toUpperCase()} regime is better`,
      icon: Wallet,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Equity Allocation",
      value: `${plan.asset_allocation_target.equity || 0}%`,
      description: `Debt ${plan.asset_allocation_target.debt || 0}% · Gold ${plan.asset_allocation_target.gold || 0}%`,
      icon: TrendingUp,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Insurance Status",
      value: hasInsuranceGap ? "Gaps Found" : "Adequate",
      description: hasInsuranceGap
        ? `Term gap: ${formatINR(plan.insurance_gap.term_gap)}`
        : "All coverage adequate",
      icon: hasInsuranceGap ? AlertTriangle : Calendar,
      color: hasInsuranceGap ? "text-red-400" : "text-emerald-400",
      bg: hasInsuranceGap ? "bg-red-500/10" : "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group rounded-xl border border-border/50 bg-card p-4 
              hover:border-border transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className="text-lg font-semibold font-display">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
