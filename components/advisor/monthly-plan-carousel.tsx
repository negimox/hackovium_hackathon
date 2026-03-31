"use client";

import { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Building2,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  large_cap_funds?: FundRecommendation[];
  mid_cap_funds?: FundRecommendation[];
  small_cap_funds?: FundRecommendation[];
  debt_funds?: FundRecommendation[];
  gold_funds?: FundRecommendation[];
}

interface MonthlyPlanCarouselProps {
  monthlyPlan: MonthlyEntry[];
}

function formatINR(val: number): string {
  if (!val) return "₹0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function parseMonth(monthStr: string): Date {
  try {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  } catch {
    return new Date();
  }
}

function formatMonthShort(monthStr: string): string {
  const date = parseMonth(monthStr);
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function formatMonthFull(monthStr: string): string {
  const date = parseMonth(monthStr);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function isCurrentMonth(monthStr: string): boolean {
  const now = new Date();
  const monthDate = parseMonth(monthStr);
  return (
    now.getFullYear() === monthDate.getFullYear() &&
    now.getMonth() === monthDate.getMonth()
  );
}

function isPastMonth(monthStr: string): boolean {
  const now = new Date();
  const monthDate = parseMonth(monthStr);
  return monthDate < new Date(now.getFullYear(), now.getMonth(), 1);
}

function getRiskBadgeColor(risk: string | undefined): string {
  switch (risk?.toLowerCase()) {
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "moderate":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "moderately_high":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function MonthCard({
  entry,
  isActive,
  onClick,
  index,
}: {
  entry: MonthlyEntry;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const isCurrent = isCurrentMonth(entry.month);
  const isPast = isPastMonth(entry.month);
  const totalSIP =
    entry.sip_large_cap +
    entry.sip_mid_cap +
    entry.sip_small_cap +
    entry.sip_debt +
    entry.sip_gold +
    entry.ppf_contribution +
    entry.nps_contribution;

  return (
    <button
      onClick={onClick}
      style={{ scrollSnapAlign: "center" }}
      className={cn(
        "relative shrink-0 p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer",
        // Active state - larger and prominent
        isActive
          ? "w-48 border-primary bg-primary/10 shadow-xl z-10 scale-105"
          : "w-32 border-border/50 bg-card hover:border-primary/50 opacity-50",
        // Current month highlight
        isCurrent &&
          !isActive &&
          "border-primary/50 ring-2 ring-primary/20 opacity-70",
        // Past months
        isPast && !isActive && "opacity-40",
      )}
    >
      {/* Current Month Indicator */}
      {isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded-full">
          <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
            Now
          </span>
        </div>
      )}

      {/* Past Month Check */}
      {isPast && (
        <div className="absolute top-2 right-2">
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Month Label */}
      <div className="text-center mb-3">
        <p className={cn("font-bold", isActive ? "text-3xl" : "text-xl")}>
          {formatMonthShort(entry.month)}
        </p>
        <p
          className={cn(
            "text-muted-foreground uppercase tracking-wide",
            isActive ? "text-xs" : "text-[10px]",
          )}
        >
          {parseMonth(entry.month).getFullYear()}
        </p>
      </div>

      {/* Total SIP */}
      <div className="text-center">
        <p
          className={cn(
            "font-bold font-display text-primary",
            isActive ? "text-xl" : "text-base",
          )}
        >
          {formatINR(totalSIP)}
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            isActive ? "text-xs" : "text-[10px]",
          )}
        >
          Total SIP
        </p>
      </div>

      {/* Allocation Indicator - only show on active */}
      {isActive && (
        <div className="mt-3 flex gap-1 justify-center">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{ width: `${entry.equity_pct}%`, maxWidth: "70px" }}
            title={`Equity ${entry.equity_pct}%`}
          />
          <div
            className="h-2 rounded-full bg-sky-500"
            style={{ width: `${entry.debt_pct}%`, maxWidth: "50px" }}
            title={`Debt ${entry.debt_pct}%`}
          />
        </div>
      )}
    </button>
  );
}

function FundPill({ fund }: { fund: FundRecommendation }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={fund.name}>
          {fund.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {fund.returns_3y_pct && (
            <span className="text-emerald-400">{fund.returns_3y_pct}% 3Y</span>
          )}
          {fund.expense_ratio_pct && <span>ER: {fund.expense_ratio_pct}%</span>}
        </div>
      </div>
      {fund.risk_level && (
        <Badge
          variant="outline"
          className={cn("text-xs shrink-0", getRiskBadgeColor(fund.risk_level))}
        >
          {fund.risk_level.replace(/_/g, " ")}
        </Badge>
      )}
    </div>
  );
}

function DetailPanel({ entry }: { entry: MonthlyEntry }) {
  const categories = [
    {
      title: "Large Cap",
      icon: Building2,
      color: "bg-emerald-500",
      amount: entry.sip_large_cap,
      funds: entry.large_cap_funds,
    },
    {
      title: "Mid Cap",
      icon: TrendingUp,
      color: "bg-sky-500",
      amount: entry.sip_mid_cap,
      funds: entry.mid_cap_funds,
    },
    {
      title: "Small Cap",
      icon: TrendingUp,
      color: "bg-violet-500",
      amount: entry.sip_small_cap,
      funds: entry.small_cap_funds,
    },
    {
      title: "Debt",
      icon: Wallet,
      color: "bg-amber-500",
      amount: entry.sip_debt,
      funds: entry.debt_funds,
    },
    {
      title: "Gold",
      icon: Wallet,
      color: "bg-yellow-500",
      amount: entry.sip_gold,
      funds: entry.gold_funds,
    },
  ];

  const activeCategories = categories.filter((c) => c.amount > 0);

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {formatMonthFull(entry.month)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Equity {entry.equity_pct}% • Debt {entry.debt_pct}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display">
            {formatINR(
              entry.sip_large_cap +
                entry.sip_mid_cap +
                entry.sip_small_cap +
                entry.sip_debt +
                entry.sip_gold +
                entry.ppf_contribution +
                entry.nps_contribution,
            )}
          </p>
          <p className="text-xs text-muted-foreground">Total Investment</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCategories.map((cat) => (
          <div
            key={cat.title}
            className="rounded-lg border border-border/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    cat.color,
                  )}
                >
                  <cat.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-sm">{cat.title}</span>
              </div>
              <span className="font-bold font-display">
                {formatINR(cat.amount)}
              </span>
            </div>

            {cat.funds && cat.funds.length > 0 && (
              <div className="space-y-2">
                {cat.funds.slice(0, 2).map((fund, i) => (
                  <FundPill key={fund.isin || i} fund={fund} />
                ))}
                {cat.funds.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{cat.funds.length - 2} more funds
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PPF & NPS */}
      {(entry.ppf_contribution > 0 || entry.nps_contribution > 0) && (
        <div className="flex gap-3 pt-2 border-t border-border/30">
          {entry.ppf_contribution > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <span className="text-sm text-indigo-400">PPF</span>
              <span className="font-bold">
                {formatINR(entry.ppf_contribution)}
              </span>
            </div>
          )}
          {entry.nps_contribution > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/30">
              <span className="text-sm text-pink-400">NPS</span>
              <span className="font-bold">
                {formatINR(entry.nps_contribution)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-sm text-muted-foreground">💡 {entry.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function MonthlyPlanCarousel({
  monthlyPlan,
}: MonthlyPlanCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Find current month index on mount
  useEffect(() => {
    if (!monthlyPlan || monthlyPlan.length === 0) return;

    const currentIndex = monthlyPlan.findIndex((entry) =>
      isCurrentMonth(entry.month),
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
      // Scroll to current month
      setTimeout(() => scrollToIndex(currentIndex), 100);
    }
  }, [monthlyPlan]);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons);
      updateScrollButtons();
      return () => el.removeEventListener("scroll", updateScrollButtons);
    }
  }, []);

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const containerWidth = scrollRef.current.clientWidth;
      const scrollPosition =
        card.offsetLeft - containerWidth / 2 + card.offsetWidth / 2;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!monthlyPlan || monthlyPlan.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No monthly plan data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Carousel Navigation */}
      <div className="relative overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={cn(
            "absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full",
            "bg-background/90 border border-border shadow-lg",
            "flex items-center justify-center transition-all",
            canScrollLeft ? "hover:bg-muted" : "opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={cn(
            "absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full",
            "bg-background/90 border border-border shadow-lg",
            "flex items-center justify-center transition-all",
            canScrollRight ? "hover:bg-muted" : "opacity-0 pointer-events-none",
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Container */}
        <div
          ref={scrollRef}
          className="flex justify-start lg:justify-center gap-6 overflow-x-auto scrollbar-hide px-4 py-8"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {monthlyPlan.map((entry, index) => (
            <MonthCard
              key={entry.month}
              entry={entry}
              index={index}
              isActive={index === activeIndex}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
            />
          ))}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {monthlyPlan.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === activeIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="px-4">
        <DetailPanel entry={monthlyPlan[activeIndex]} />
      </div>
    </div>
  );
}
