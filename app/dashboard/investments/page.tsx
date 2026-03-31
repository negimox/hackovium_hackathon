"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  Coins,
  Info,
  ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TradingViewWidget from "@/components/advisor/tradingview-widget";
import DashboardPageLayout from "@/components/dashboard/layout";
import { StockLogo } from "@/components/ui/stock-logo";

interface FundRecommendation {
  name: string;
  isin?: string;
  category?: string;
  amc?: string;
  risk_level?: string;
  expense_ratio_pct?: number;
  aum_cr?: number;
  returns_1y_pct?: number;
  returns_3y_pct?: number;
  returns_5y_pct?: number;
  expected_return_pct?: number;
  min_sip_amount?: number;
  rating?: number;
  schemeCode?: string; // Resolved via mfapi.in
}

interface MonthlyEntry {
  month: string;
  sip_large_cap: number;
  sip_mid_cap: number;
  sip_small_cap: number;
  sip_debt: number;
  sip_gold: number;
  large_cap_funds?: FundRecommendation[];
  mid_cap_funds?: FundRecommendation[];
  small_cap_funds?: FundRecommendation[];
  debt_funds?: FundRecommendation[];
  gold_funds?: FundRecommendation[];
}

interface FinancialPlan {
  monthly_plan: MonthlyEntry[];
  asset_allocation_target: Record<string, number>;
  fund_options?: Record<string, FundRecommendation[]>;
}

interface MarketData {
  price: number;
  change: number;
  percent: number;
  symbol: string;
  name: string;
  type: string;
  id: string;
}

function formatINR(val: number): string {
  if (!val) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function getRiskColor(risk: string | undefined): string {
  switch (risk?.toLowerCase()) {
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "moderate":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "moderately_high":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "high":
    case "very_high":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function FundCard({
  fund,
  sipAmount,
  marketMatch,
}: {
  fund: FundRecommendation;
  sipAmount?: number;
  marketMatch?: MarketData;
}) {
  const isPositive = (marketMatch?.change || 0) >= 0;
  // Use resolved schemeCode if available, else try fallback
  const href = fund.schemeCode
    ? `/dashboard/stock/fund-${fund.schemeCode}`
    : marketMatch
      ? `/dashboard/stock/${marketMatch.id}`
      : "#";

  return (
    <Card className="group hover:border-primary/50 transition-all overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <StockLogo
              symbol={marketMatch?.symbol || fund.name.substring(0, 2)}
              name={fund.name}
              type={marketMatch?.type || "FUND"}
              className="w-10 h-10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <Link href={href}>
                <CardTitle
                  className={`text-sm font-semibold truncate transition-colors hover:text-primary cursor-pointer`}
                  title={fund.name}
                >
                  {fund.name}
                </CardTitle>
              </Link>
              {fund.amc && (
                <CardDescription className="text-[10px] mt-0.5 font-medium">
                  {fund.amc}
                </CardDescription>
              )}
            </div>
          </div>
          {href !== "#" && (
            <Link
              href={href}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Price or Returns Summary */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              {marketMatch ? "Current NAV" : "Expected Return"}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-display">
                {marketMatch
                  ? `₹${marketMatch.price.toLocaleString("en-IN")}`
                  : `${fund.expected_return_pct}% p.a.`}
              </span>
              {marketMatch && (
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {marketMatch.percent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-0.5 justify-end">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-[10px] ${i < (fund.rating || 0) ? "text-amber-400" : "text-muted-foreground/20"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">
              Rating
            </p>
          </div>
        </div>

        {/* Risk Badge & ISIN */}
        <div className="flex items-center gap-2 flex-wrap">
          {fund.risk_level && (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0 capitalize ${getRiskColor(fund.risk_level)}`}
            >
              {fund.risk_level.replace(/_/g, " ")}
            </Badge>
          )}
          {fund.isin && (
            <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tight">
              {fund.isin}
            </span>
          )}
        </div>

        {/* Returns Grid */}
        <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-muted/30 rounded-xl border border-border/20">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">
              1Y Return
            </p>
            <p
              className={`text-xs font-bold ${(fund.returns_1y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_1y_pct != null ? `${fund.returns_1y_pct}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">
              3Y Return
            </p>
            <p
              className={`text-xs font-bold ${(fund.returns_3y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_3y_pct != null ? `${fund.returns_3y_pct}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">
              5Y Return
            </p>
            <p
              className={`text-xs font-bold ${(fund.returns_5y_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {fund.returns_5y_pct != null ? `${fund.returns_5y_pct}%` : "—"}
            </p>
          </div>
        </div>

        {/* SIP Amount and Expense */}
        <div className="pt-3 border-t border-border/30 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
              Expense Ratio
            </p>
            <p className="text-xs font-semibold">
              {fund.expense_ratio_pct != null
                ? `${fund.expense_ratio_pct}%`
                : "—"}
            </p>
          </div>
          {sipAmount && sipAmount > 0 && (
            <div className="text-right">
              <p className="text-[9px] text-primary uppercase font-bold tracking-tighter">
                Monthly SIP
              </p>
              <p className="text-sm font-bold text-primary">
                {formatINR(sipAmount)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryTab({
  title,
  description,
  icon: Icon,
  funds,
  sipAmount,
  color,
  tradingViewSymbol,
  marketData,
}: {
  title: string;
  description: string;
  icon: any;
  funds: FundRecommendation[];
  sipAmount: number;
  color: string;
  tradingViewSymbol?: string;
  marketData: Record<string, MarketData>;
}) {
  // Collection of symbols for TradingView
  const symbols: any[] = [];

  // Add category benchmark if available
  if (tradingViewSymbol) {
    symbols.push(tradingViewSymbol);
  }

  // Add the top 2 funds to the view
  funds.slice(0, 2).forEach((f) => {
    if (f.schemeCode) {
      // Numerical AMFI codes are sometimes supported as AMFI:123456
      symbols.push({
        symbol: `AMFI:${f.schemeCode}`,
        name: f.name,
        isFund: true,
      });
    } else if (f.isin) {
      symbols.push({ symbol: `AMFI:${f.isin}`, name: f.name, isFund: true });
    }
  });

  // Ensure we have at least 3 symbols if possible (fill with related indices)
  if (symbols.length < 3 && title.toLowerCase().includes("cap")) {
    if (!symbols.some((s) => typeof s === "string" && s.includes("SENSEX"))) {
      symbols.push("BSE:SENSEX");
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center justify-between p-4 bg-card/30 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg shadow-${color}/20`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display text-primary">
            {formatINR(sipAmount)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Monthly Limit
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Left Column: Funds Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recommended Plans ({funds.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funds.map((fund, i) => {
              const match =
                marketData[fund.name.toUpperCase()] ||
                (fund.isin && marketData[fund.isin.toUpperCase()]);
              return (
                <FundCard
                  key={fund.isin || i}
                  fund={fund}
                  sipAmount={i === 0 ? sipAmount : undefined}
                  marketMatch={match}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Market Context */}
        {/* <div className="space-y-6">
         

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Intelligent Rebalancing</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  We've analyzed over 2,000 mutual funds to pick these leaders. 
                  They offer a balanced mix of alpha generation and downside protection.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">SEBI Verified</Badge>
                  <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">High Liquidity</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
}

export default function InvestmentsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);

  const resolveFundCodes = async (
    options: Record<string, FundRecommendation[]>,
  ) => {
    const updatedOptions = { ...options };
    const allFunds = Object.values(updatedOptions).flat();

    // Resolve in parallel
    await Promise.all(
      allFunds.map(async (fund) => {
        try {
          const searchQuery = fund.name
            .replace("Direct Plan", "")
            .replace("Direct Growth", "")
            .replace("Growth", "")
            .trim();

          const res = await fetch(
            `https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery)}`,
          );
          const json = await res.json();

          if (Array.isArray(json) && json.length > 0) {
            let bestMatch = json[0];
            const isDirect = fund.name.toLowerCase().includes("direct");
            const isGrowth = fund.name.toLowerCase().includes("growth");

            const filtered = json.filter((item: any) => {
              const name = item.schemeName.toLowerCase();
              const matchesDirect = name.includes("direct");
              const matchesGrowth = name.includes("growth");
              return (
                (isDirect ? matchesDirect : !matchesDirect) &&
                (isGrowth ? matchesGrowth : true)
              );
            });

            if (filtered.length > 0) {
              const amcMatch = filtered.find((item: any) =>
                item.schemeName
                  .toLowerCase()
                  .includes(fund.amc?.toLowerCase() || ""),
              );
              bestMatch = amcMatch || filtered[0];
            }

            fund.schemeCode = bestMatch.schemeCode;
          }
        } catch (err) {
          console.error(`Failed to resolve fund code for ${fund.name}:`, err);
        }
      }),
    );
    return updatedOptions;
  };

  const fetchMarketData = useCallback(async () => {
    try {
      const [stocksRes, fundsRes] = await Promise.all([
        fetch("/api/market/stocks"),
        fetch("/api/market/funds"),
      ]);

      const stocks = await stocksRes.json();
      const funds = await fundsRes.json();

      const dataMap: Record<string, MarketData> = {};

      Object.entries(stocks).forEach(([symbol, d]: [string, any]) => {
        dataMap[symbol.toUpperCase()] = {
          price: d.price,
          change: d.change,
          percent: d.percent,
          symbol: symbol,
          name: d.name || symbol,
          type: "NSE",
          id: `nse-${symbol}`,
        };
      });

      if (typeof funds === "object" && !Array.isArray(funds)) {
        Object.entries(funds).forEach(([key, d]: [string, any]) => {
          const id = d.isin ? `nse-${d.symbol || key}` : `nse-${key}`;
          dataMap[key.toUpperCase()] = {
            price: d.price || d.nav || 0,
            change: d.change || 0,
            percent: d.percent || d.percent_change || 0,
            symbol: d.symbol || key,
            name: d.name || key,
            type: "FUND",
            id: id,
          };
          if (d.isin)
            dataMap[d.isin.toUpperCase()] = dataMap[key.toUpperCase()];
        });
      }
      setMarketData(dataMap);
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    const fetchPlanAndResolve = async () => {
      try {
        const userId = localStorage.getItem("advisor_user_id");
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/advisor/plan?user_id=${userId}`);
        const data = await res.json();

        if (data.success && data.plan?.plan) {
          const rawPlan = data.plan.plan;
          if (rawPlan.fund_options) {
            rawPlan.fund_options = await resolveFundCodes(rawPlan.fund_options);
          }
          setPlan(rawPlan);
          await fetchMarketData();
        }
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndResolve();
  }, [user, isLoaded, router, fetchMarketData, resolveFundCodes]);

  if (loading || !isLoaded) {
    return (
      <DashboardPageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Resolving fund identities & market data...
          </p>
        </div>
      </DashboardPageLayout>
    );
  }

  if (!plan) {
    return (
      <DashboardPageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold">No Investment Strategy Found</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-8 leading-relaxed">
            Generate your AI financial plan to see personalized asset picks and
            live market signals.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
          >
            Create Strategy
          </button>
        </div>
      </DashboardPageLayout>
    );
  }

  const currentMonth = plan.monthly_plan?.[0] || {};
  const fundOptions = plan.fund_options || {};

  const categories = [
    {
      id: "large_cap",
      title: "Large Cap",
      description: "Foundation for core portfolio stability",
      icon: Building2,
      color: "bg-emerald-500",
      funds: fundOptions.large_cap_funds || currentMonth.large_cap_funds || [],
      sipAmount: currentMonth.sip_large_cap || 0,
      tradingViewSymbol: "NSE:NIFTY",
    },
    {
      id: "mid_cap",
      title: "Mid Cap",
      description: "Balanced growth and higher risk adjusted returns",
      icon: TrendingUp,
      color: "bg-sky-500",
      funds: fundOptions.mid_cap_funds || currentMonth.mid_cap_funds || [],
      sipAmount: currentMonth.sip_mid_cap || 0,
      tradingViewSymbol: "NSE:NIFTYMIDCAP100",
    },
    {
      id: "small_cap",
      title: "Small Cap",
      description: "Aggressive growth potential from emerging leaders",
      icon: TrendingUp,
      color: "bg-violet-500",
      funds: fundOptions.small_cap_funds || currentMonth.small_cap_funds || [],
      sipAmount: currentMonth.sip_small_cap || 0,
      tradingViewSymbol: "NSE:NIFTYSMALLCAP100",
    },
    {
      id: "debt",
      title: "Debt/Fixed",
      description: "Capital protection and regular income",
      icon: Wallet,
      color: "bg-amber-500",
      funds: fundOptions.debt_funds || currentMonth.debt_funds || [],
      sipAmount: currentMonth.sip_debt || 0,
      tradingViewSymbol: "TVC:IN10Y",
    },
    {
      id: "gold",
      title: "Gold/Commodities",
      description: "Wealth preservation and inflation hedge",
      icon: Coins,
      color: "bg-yellow-500",
      funds: fundOptions.gold_funds || currentMonth.gold_funds || [],
      sipAmount: currentMonth.sip_gold || 0,
      tradingViewSymbol: "OANDA:XAUUSD",
    },
  ];

  const activeCategories = categories.filter(
    (c) => c.sipAmount > 0 || c.funds.length > 0,
  );

  return (
    <DashboardPageLayout>
      <div className="space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">
              Investment Recommendations
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Curated assets based on your risk appetite and target retirement
              date. Our AI engine re-evaluates these picks every market session.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs
          defaultValue={activeCategories[0]?.id || "large_cap"}
          className="space-y-8"
        >
          <div className="bg-muted/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md sticky top-[68px] z-10 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap gap-1">
              {activeCategories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-xl px-4 py-2.5 data-[state=active]:bg-accent data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all flex items-center gap-3 shrink-0"
                >
                  <div
                    className={`w-6 h-6 rounded-lg ${cat.color} flex items-center justify-center opacity-80 group-data-[state=active]:opacity-100`}
                  >
                    <cat.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">
                      {cat.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {formatINR(cat.sipAmount)}
                    </p>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {activeCategories.map((cat) => (
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <CategoryTab
                title={cat.title}
                description={cat.description}
                icon={cat.icon}
                funds={cat.funds}
                sipAmount={cat.sipAmount}
                color={cat.color}
                tradingViewSymbol={cat.tradingViewSymbol}
                marketData={marketData}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
}
