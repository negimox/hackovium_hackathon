"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FundRecommendation {
  name: string;
  isin?: string;
  category?: string;
  amc?: string;
  risk_level?: string;
  expense_ratio_pct?: number;
  returns_1y_pct?: number;
  returns_3y_pct?: number;
  returns_5y_pct?: number;
  expected_return_pct?: number;
  min_sip_amount?: number;
}

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
  // Fund recommendations
  large_cap_funds?: FundRecommendation[];
  mid_cap_funds?: FundRecommendation[];
  small_cap_funds?: FundRecommendation[];
  debt_funds?: FundRecommendation[];
  gold_funds?: FundRecommendation[];
}

interface MonthlyPlanCardsProps {
  monthlyPlan: MonthlyEntry[];
}

function formatINR(val: number): string {
  if (!val) return "—";
  return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatMonth(month: string): string {
  try {
    const [year, mon] = month.split("-");
    const date = new Date(parseInt(year), parseInt(mon) - 1);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return month;
  }
}

function getRiskBadge(risk: string | undefined) {
  if (!risk) return null;
  const variants: Record<string, { color: string; bg: string }> = {
    low: { color: "text-emerald-400", bg: "bg-emerald-500/10" },
    moderate: { color: "text-amber-400", bg: "bg-amber-500/10" },
    high: { color: "text-red-400", bg: "bg-red-500/10" },
    moderately_high: { color: "text-orange-400", bg: "bg-orange-500/10" },
  };
  const v = variants[risk.toLowerCase()] || variants.moderate;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${v.bg} ${v.color} capitalize`}
    >
      {risk.replace(/_/g, " ")}
    </span>
  );
}

function FundCard({
  fund,
  amount,
}: {
  fund: FundRecommendation;
  amount: number;
}) {
  return (
    <div className="flex flex-col p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={fund.name}>
            {fund.name}
          </p>
          {fund.amc && (
            <p className="text-xs text-muted-foreground truncate">{fund.amc}</p>
          )}
        </div>
        {getRiskBadge(fund.risk_level)}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {fund.returns_3y_pct != null && (
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            {fund.returns_3y_pct}% (3Y)
          </span>
        )}
        {fund.expense_ratio_pct != null && (
          <span>ER: {fund.expense_ratio_pct}%</span>
        )}
      </div>

      {amount > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <span className="text-sm font-semibold text-primary">
            SIP: {formatINR(amount)}
          </span>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  title,
  icon: Icon,
  funds,
  amount,
  color,
}: {
  title: string;
  icon: any;
  funds?: FundRecommendation[];
  amount: number;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!amount && (!funds || funds.length === 0)) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">
              {funds?.length || 0} funds recommended
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold font-display">
            {formatINR(amount)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && funds && funds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11">
          {funds.slice(0, 3).map((fund, i) => (
            <FundCard
              key={fund.isin || i}
              fund={fund}
              amount={i === 0 ? amount : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonthlyPlanCards({
  monthlyPlan,
}: MonthlyPlanCardsProps) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(
    monthlyPlan?.[0]?.month || null,
  );

  if (!monthlyPlan || monthlyPlan.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No monthly plan data available yet.
      </div>
    );
  }

  // Show first 6 months
  const displayPlan = monthlyPlan.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Month Cards */}
      <div className="grid grid-cols-1 gap-4">
        {displayPlan.map((entry) => {
          const isExpanded = expandedMonth === entry.month;
          const totalSIP =
            entry.sip_large_cap +
            entry.sip_mid_cap +
            entry.sip_small_cap +
            entry.sip_debt +
            entry.sip_gold +
            entry.ppf_contribution +
            entry.nps_contribution;

          return (
            <Card
              key={entry.month}
              className={`transition-all ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
            >
              <CardHeader
                className="cursor-pointer pb-3"
                onClick={() =>
                  setExpandedMonth(isExpanded ? null : entry.month)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {formatMonth(entry.month)}
                    </CardTitle>
                    <CardDescription>
                      Equity: {entry.equity_pct}% • Debt: {entry.debt_pct}%
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold font-display">
                        {formatINR(totalSIP)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total SIP</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  {/* Equity Categories */}
                  <CategorySection
                    title="Large Cap Funds"
                    icon={Building2}
                    funds={entry.large_cap_funds}
                    amount={entry.sip_large_cap}
                    color="bg-emerald-500"
                  />
                  <CategorySection
                    title="Mid Cap Funds"
                    icon={TrendingUp}
                    funds={entry.mid_cap_funds}
                    amount={entry.sip_mid_cap}
                    color="bg-sky-500"
                  />
                  <CategorySection
                    title="Small Cap Funds"
                    icon={TrendingUp}
                    funds={entry.small_cap_funds}
                    amount={entry.sip_small_cap}
                    color="bg-violet-500"
                  />

                  {/* Debt & Gold */}
                  <CategorySection
                    title="Debt Funds"
                    icon={Wallet}
                    funds={entry.debt_funds}
                    amount={entry.sip_debt}
                    color="bg-amber-500"
                  />
                  <CategorySection
                    title="Gold Funds"
                    icon={Wallet}
                    funds={entry.gold_funds}
                    amount={entry.sip_gold}
                    color="bg-yellow-500"
                  />

                  {/* PPF & NPS */}
                  {(entry.ppf_contribution > 0 ||
                    entry.nps_contribution > 0) && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-border/30">
                      {entry.ppf_contribution > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-sm py-1 px-3"
                        >
                          PPF: {formatINR(entry.ppf_contribution)}
                        </Badge>
                      )}
                      {entry.nps_contribution > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-sm py-1 px-3"
                        >
                          NPS: {formatINR(entry.nps_contribution)}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg mt-2">
                      💡 {entry.notes}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {monthlyPlan.length > 6 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first 6 of {monthlyPlan.length} months
        </p>
      )}
    </div>
  );
}
