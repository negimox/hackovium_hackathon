"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/ui/stock-logo";

interface MarketData {
  price: number;
  change: number;
  percent: number;
  symbol: string;
  name: string;
  type: string;
  id: string;
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

interface FundRecommendation {
  name: string;
  isin?: string;
  amc?: string;
  risk_level?: string;
  expense_ratio_pct?: number;
  returns_3y_pct?: number;
  reason?: string;
  category?: string; // Added by component
  schemeCode?: string; // Added by component
}

interface MonthlyPlanItem {
  month: number;
  sip_large_cap?: number;
  sip_mid_cap?: number;
  sip_small_cap?: number;
  sip_debt?: number;
  sip_gold?: number;
  [key: string]: any;
}

interface AdvisedInvestmentsProps {
  fundOptions: Record<string, FundRecommendation[]>;
  monthlyPlan?: MonthlyPlanItem[];
}

export default function AdvisedInvestments({
  fundOptions,
  monthlyPlan,
}: AdvisedInvestmentsProps) {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [resolvedFunds, setResolvedFunds] = useState<FundRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveFundCodes = useCallback(async (funds: FundRecommendation[]) => {
    // Perform mfapi.in searches
    const updated = [...funds];
    await Promise.all(
      updated.map(async (fund) => {
        try {
          // Search by name (cleaned)
          const query = fund.name
            .replace("Direct Plan", "")
            .replace("Direct Growth", "")
            .replace("Growth", "")
            .trim();
          const res = await fetch(
            `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`,
          );
          const json = await res.json();

          if (Array.isArray(json) && json.length > 0) {
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

            const match =
              filtered.find((item: any) =>
                item.schemeName
                  .toLowerCase()
                  .includes(fund.amc?.toLowerCase() || ""),
              ) ||
              filtered[0] ||
              json[0];

            fund.schemeCode = match.schemeCode;
          }
        } catch (err) {
          console.error(`Failed to resolve fund code for ${fund.name}:`, err);
        }
      }),
    );
    return updated;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Flatten all funds from different categories
        const initialFunds = Object.entries(fundOptions).flatMap(
          ([category, funds]) =>
            funds.map((fund) => ({
              ...fund,
              category: category.replace(/_/g, " "),
            })),
        );

        // Resolve codes first
        const resolved = await resolveFundCodes(initialFunds);
        setResolvedFunds(resolved);

        // Try to fetch market data with timeout, but continue if unavailable
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const [stocksRes, fundsRes] = await Promise.all([
            fetch("/api/market/stocks", { signal: controller.signal }),
            fetch("/api/market/funds", { signal: controller.signal }),
          ]);

          clearTimeout(timeoutId);

          if (stocksRes.ok && fundsRes.ok) {
            const stocks = await stocksRes.json();
            const funds = await fundsRes.json();

            const dataMap: Record<string, MarketData> = {};

            // Process stocks
            if (typeof stocks === "object" && !Array.isArray(stocks)) {
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
            }

            // Process funds
            if (typeof funds === "object" && !Array.isArray(funds)) {
              Object.entries(funds).forEach(([key, d]: [string, any]) => {
                const id = d.isin ? `stock-${d.symbol || key}` : `stock-${key}`;
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

            // For funds that don't have market data yet, fetch from mfapi.in
            // Use faster concurrent fetching
            await Promise.allSettled(
              resolved.map(async (fund) => {
                if (
                  fund.schemeCode &&
                  !dataMap[fund.name.toUpperCase()] &&
                  !(fund.isin && dataMap[fund.isin.toUpperCase()])
                ) {
                  try {
                    // Try /latest endpoint first for immediate price
                    const latestRes = await fetch(
                      `https://api.mfapi.in/mf/${fund.schemeCode}/latest`,
                    );
                    const latestJson = await latestRes.json();

                    if (latestJson.data && latestJson.data.length > 0) {
                      const latestPrice = parseFloat(latestJson.data[0].nav);

                      // Update mapping immediately
                      dataMap[fund.name.toUpperCase()] = {
                        price: latestPrice,
                        change: 0,
                        percent: 0,
                        symbol: (fund as any).schemeCode,
                        name: fund.name,
                        type: "FUND",
                        id: `fund-${fund.schemeCode}`,
                      };

                      if (fund.isin)
                        dataMap[fund.isin.toUpperCase()] =
                          dataMap[fund.name.toUpperCase()];

                      // Try to get history for trend (optional, don't crash)
                      fetch(`https://api.mfapi.in/mf/${fund.schemeCode}`)
                        .then((r) => r.json())
                        .then((hist) => {
                          if (hist.data && hist.data.length >= 2) {
                            const current = parseFloat(hist.data[0].nav);
                            const prev = parseFloat(hist.data[1].nav);
                            const chg = current - prev;
                            const pct = (chg / prev) * 100;
                            // Update map (this will refresh on next state update or through direct setter)
                            setMarketData((prevMap) => ({
                              ...prevMap,
                              [fund.name.toUpperCase()]: {
                                ...prevMap[fund.name.toUpperCase()],
                                price: current,
                                change: chg,
                                percent: pct,
                              },
                            }));
                          }
                        })
                        .catch(() => {});
                    }
                  } catch (e) {
                    /* ignore */
                  }
                }
              }),
            );

            setMarketData((prev) => ({ ...prev, ...dataMap }));
          }
        } catch (marketErr) {
          console.warn("Market data unavailable, proceeding without it");
        }
      } catch (err) {
        console.error("Failed to fetch fund data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fundOptions, resolveFundCodes]);

  if (resolvedFunds.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Advised Investments</h2>
          <p className="text-sm text-muted-foreground">
            Top-rated assets selected for your growth
          </p>
        </div>
        <Link
          href="/dashboard/investments"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {monthlyPlan && monthlyPlan.length > 0 && (
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Target Monthly SIP</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { key: "sip_large_cap", label: "Large Cap" },
              { key: "sip_mid_cap", label: "Mid Cap" },
              { key: "sip_small_cap", label: "Small Cap" },
              { key: "sip_debt", label: "Debt" },
              { key: "sip_gold", label: "Gold" },
            ].map(({ key, label }) => {
              // Find months where SIP > 0 to get the actual target amount
              const activeMonths = monthlyPlan.filter((m) => (m[key] || 0) > 0);
              const targetAmount =
                activeMonths.length > 0
                  ? activeMonths[0][key]
                  : monthlyPlan.reduce((sum, m) => sum + (m[key] || 0), 0) /
                    monthlyPlan.length;

              return (
                <div key={key} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-semibold">
                    {targetAmount > 0
                      ? `₹${targetAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resolvedFunds.slice(0, 6).map((fund, i) => {
          const match =
            marketData[fund.name.toUpperCase()] ||
            (fund.isin && marketData[fund.isin.toUpperCase()]);

          // Construct a more reliable href
          let href = "#";
          if (fund.schemeCode) {
            href = `/dashboard/stock/fund-${fund.schemeCode}`;
          } else if (match) {
            href = `/dashboard/stock/${match.id}`;
          } else if (fund.isin) {
            const shortName = fund.name
              .split(" ")[0]
              .toUpperCase()
              .replace(/[^A-Z]/g, "");
            href = `/dashboard/stock/nse-${shortName}`;
          }

          const isPositive = (match?.change || 0) >= 0;

          return (
            <Card
              key={i}
              className="group hover:border-primary/50 transition-all overflow-hidden bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <StockLogo
                      symbol={match?.symbol || fund.name.substring(0, 2)}
                      name={fund.name}
                      type={match?.type || "FUND"}
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="min-w-0">
                      <Link href={href}>
                        <CardTitle
                          className={`text-sm font-semibold truncate transition-colors hover:text-primary cursor-pointer`}
                        >
                          {fund.name}
                        </CardTitle>
                      </Link>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground/60">
                        {fund.category} • {fund.risk_level?.replace(/_/g, " ")}
                      </CardDescription>
                    </div>
                  </div>
                  {href !== "#" && (
                    <Link
                      href={href}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-end justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      3Y Return
                    </p>
                    <p className="text-sm font-bold text-emerald-400">
                      {fund.returns_3y_pct}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 h-4 ${getRiskColor(fund.risk_level)}`}
                    >
                      {fund.risk_level?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground font-semibold">
                      Exp Ratio: {fund.expense_ratio_pct}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Mapping fund codes & market prices...
        </div>
      )}
    </div>
  );
}
