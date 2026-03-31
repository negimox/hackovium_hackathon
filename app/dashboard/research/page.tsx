import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardStat from "@/components/dashboard/stat";
import { MarketMovers } from "@/components/investment/market-movers";
import MarketMoodIndex from "@/components/investment/market-mood-index";
import ConnectOverlay from "@/components/investment/connect-overlay";
import BracketsIcon from "@/components/icons/brackets";
import GearIcon from "@/components/icons/gear";
import ProcessorIcon from "@/components/icons/proccesor";
import BoomIcon from "@/components/icons/boom";
import mockDataJson from "@/mock.json";
import type { MockData, PortfolioHolding as DashboardHolding } from "@/types/dashboard";
import { getPortfolioData } from "@/lib/services/portfolio-service";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Newspaper } from "lucide-react";

const mockData = mockDataJson as unknown as MockData;

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
};

// Placeholder stats for skeleton state (shown under blur)
const placeholderKpiStats = [
  {
    label: "Total Portfolio Value",
    value: "₹0",
    description: "— today",
    icon: "proccesor",
    intent: "neutral",
    direction: "up"
  },
  {
    label: "Total Invested",
    value: "₹0",
    description: "Across all connected brokers",
    icon: "gear",
    intent: "neutral",
    direction: "up"
  },
  {
    label: "Total Returns",
    value: "0%",
    description: "—",
    icon: "boom",
    intent: "neutral",
    direction: "up"
  }
];

const getImpactStyle = (impact: string) => {
  switch (impact) {
    case "positive":
      return "bg-success/10 text-success border-success/30";
    case "negative":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "neutral":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getImpactLabel = (impact: string) => {
  switch (impact) {
    case "positive": return "Bullish";
    case "negative": return "Bearish";
    case "neutral": return "Neutral";
    default: return "";
  }
};

export default async function DashboardOverview() {
  const { holdings: brokerHoldings, userProfile, connectedBrokerName, isConnected } =
    await getPortfolioData(); 

  // --- FETCH DYNAMIC NSE DATA ---
  let nseData = {};
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${apiUrl}/nse`, { next: { revalidate: 30 }, method: "GET" }).catch(() => null);
    if (res && res.ok) nseData = await res.json();
  } catch (error) {
    console.error("Failed to fetch NSE data on server", error);
  }

  const nseArray = Object.entries(nseData)
    .filter(([_, d]: any) => d && typeof d === 'object' && d.price)
    .map(([sym, d]: [string, any]) => ({
      id: `nse-${sym}`,
      symbol: sym,
      name: d.name || sym,
      price: d.price || 0,
      change: d.change || 0,
      percent: d.percent || 0,
      volume: d.volume || 0,
    }));

  const topGainers = [...nseArray].sort((a, b) => b.percent - a.percent).slice(0, 8);
  const topLosers = [...nseArray].sort((a, b) => a.percent - b.percent).slice(0, 8);
  const mostActive = [...nseArray].sort((a, b) => b.volume - a.volume).slice(0, 8);

  // --- TRANSFORM PORTFOLIO DATA ---
  const dashboardHoldings: DashboardHolding[] = brokerHoldings.map((h, index) => {
    const totalPnlPercent = h.investedValue ? (h.pnl / h.investedValue) * 100 : 0;
    return {
      id: `${h.broker}-${h.symbol}-${index}`,
      symbol: h.symbol,
      name: h.companyName || h.symbol,
      quantity: h.quantity,
      buyPrice: h.averagePrice,
      currentPrice: h.currentPrice,
      value: h.currentValue,
      gainLoss: h.pnl,
      gainLossPercent: totalPnlPercent,
      type: "stock"
    };
  });

  // Aggregates
  const totalValue = dashboardHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalInvested = dashboardHoldings.reduce((sum, h) => sum + (h.quantity * h.buyPrice), 0);
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercent = totalInvested ? (totalGainLoss / totalInvested) * 100 : 0;
  
  const dayPnl = brokerHoldings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0);
  const dayPnlPercentage = totalValue ? (dayPnl / totalValue) * 100 : 0;

  // KPI Stats for Top Cards
  const kpiStats = isConnected ? [
    {
      label: "Total Portfolio Value",
      value: `₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      description: `${dayPnl >= 0 ? '+' : ''}₹${dayPnl.toLocaleString()} (${dayPnlPercentage.toFixed(2)}%) today`,
      icon: "proccesor",
      intent: dayPnl >= 0 ? "positive" : "negative",
      direction: dayPnl >= 0 ? "up" : "down"
    },
    {
      label: "Total Invested",
      value: `₹${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      description: "Across all connected brokers",
      icon: "gear",
      intent: "neutral",
      direction: "up"
    },
    {
      label: "Total Returns",
      value: `${totalGainLossPercent.toFixed(2)}%`,
      description: `${totalGainLoss >= 0 ? '+' : ''}₹${totalGainLoss.toLocaleString()}`,
      icon: "boom",
      intent: totalGainLoss >= 0 ? "positive" : "negative",
      direction: totalGainLoss >= 0 ? "up" : "down"
    }
  ] : placeholderKpiStats;

  // Top holdings for the summary card (max 5)
  const topHoldings = [...dashboardHoldings]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <DashboardPageLayout
      header={{
        title: "Dashboard",
        icon: BracketsIcon,
      }}
    >
      <div className="space-y-6">
        {/* Portfolio-dependent content — wrapped in overlay when disconnected */}
        <div>
          <ConnectOverlay isConnected={isConnected}>
            {/* Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpiStats.map((stat: any, index: number) => (
                <DashboardStat
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  description={stat.description}
                  icon={iconMap[stat.icon as keyof typeof iconMap]}
                  intent={stat.intent}
                  direction={stat.direction}
                />
              ))}
            </div>

            {/* Portfolio Summary Card — compact with link to /portfolio */}
            <Link href="/portfolio" className="block mt-4 group">
              <div className="bg-card rounded-lg border border-border/50 p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">Portfolio Summary</h3>
                  <span className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                    View Full Portfolio <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Top Holdings Preview */}
                <div className="space-y-2.5">
                  {topHoldings.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{h.symbol}</span>
                        <span className="text-xs text-muted-foreground">{h.name !== h.symbol ? h.name : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-display">₹{h.value.toLocaleString()}</span>
                        <span className={`flex items-center gap-0.5 text-xs font-medium font-display ${h.gainLossPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {h.gainLossPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {h.gainLossPercent >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {topHoldings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No holdings yet</p>
                  )}
                </div>

                {/* Footer stats */}
                {dashboardHoldings.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dashboardHoldings.length} holdings</span>
                    <span>
                      Day P&L: <span className={`font-display ${dayPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {dayPnl >= 0 ? '+' : ''}₹{dayPnl.toLocaleString()}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </ConnectOverlay>
        </div>

        {/* Non-portfolio content — always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MarketMovers gainers={topGainers} losers={topLosers} active={mostActive} />
          </div>
          <div>
            {mockData.marketMood && (
              <MarketMoodIndex mood={mockData.marketMood} />
            )}
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
