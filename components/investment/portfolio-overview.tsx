"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import type { PortfolioStats } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface PortfolioOverviewProps {
  portfolio: PortfolioStats;
}

export default function PortfolioOverview({
  portfolio,
}: PortfolioOverviewProps) {
  const totalReturn = (
    ((portfolio.totalValue - portfolio.totalInvested) /
      portfolio.totalInvested) *
    100
  ).toFixed(2);

  const getSectorColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  const sortedSectors = Object.entries(portfolio.sectorAllocation).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          Portfolio Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Total Value
            </span>
            <span className="text-2xl font-display font-bold">
              ₹{portfolio.totalValue.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Total Invested
            </span>
            <span className="text-2xl font-display font-bold">
              ₹{portfolio.totalInvested.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Total Return
            </span>
            <span
              className={cn(
                "text-2xl font-display font-bold",
                portfolio.totalGainLoss > 0
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              {totalReturn}%
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Total Gain/Loss
            </span>
            <span
              className={cn(
                "text-2xl font-display font-bold",
                portfolio.totalGainLoss > 0
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              ₹{portfolio.totalGainLoss.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Day Change
            </span>
            <span
              className={cn(
                "text-2xl font-display font-bold",
                portfolio.dayChange > 0 ? "text-success" : "text-destructive"
              )}
            >
              {portfolio.dayChange > 0 ? "+" : ""}
              ₹{portfolio.dayChange.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
              Day Change %
            </span>
            <span
              className={cn(
                "text-2xl font-display font-bold",
                portfolio.dayChangePercent > 0
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              {portfolio.dayChangePercent > 0 ? "+" : ""}
              {portfolio.dayChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold">Exchange Allocation</h4>

          <div className="space-y-3">
            {sortedSectors.map(([ sector, percentage ], index) => (
              <div key={sector} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{sector}</span>
                  <Badge variant="secondary" className="ml-2 font-display">
                    {percentage}%
                  </Badge>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      getSectorColor(index)
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Allocation Chart */}
          <div className="mt-4 flex h-8 gap-1 rounded-lg overflow-hidden bg-accent">
            {sortedSectors.map(([sector, percentage], index) => (
              <div
                key={sector}
                className={cn("transition-all", getSectorColor(index))}
                style={{ width: `${percentage}%` }}
                title={`${sector}: ${percentage}%`}
              />
            ))}
          </div>
        </div>

        {/* Holdings Distribution */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold">
            Holdings Distribution ({portfolio.holdings.length} positions)
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stocks</span>
              <span className="font-display font-semibold">
                {portfolio.holdings.filter((h) => h.type === "stock").length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mutual Funds</span>
              <span className="font-display font-semibold">
                {portfolio.holdings.filter((h) => h.type === "mutual").length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ETFs</span>
              <span className="font-display font-semibold">
                {portfolio.holdings.filter((h) => h.type === "etf").length}
              </span>
            </div>
          </div>
        </div>

        {/* Top Gainers & Losers */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold">Performance</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-success">Top Gainer</h5>
              {(() => {
                const topGainer = [...portfolio.holdings].sort(
                  (a, b) => b.gainLossPercent - a.gainLossPercent
                )[0];
                return topGainer ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      {topGainer.symbol}
                    </span>
                    <span className="text-xs text-success font-display font-medium">
                      +{topGainer.gainLossPercent.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                );
              })()}
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-medium text-destructive">
                Top Loser
              </h5>
              {(() => {
                const topLoser = [...portfolio.holdings].sort(
                  (a, b) => a.gainLossPercent - b.gainLossPercent
                )[0];
                return topLoser ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      {topLoser.symbol}
                    </span>
                    <span className="text-xs text-destructive font-display font-medium">
                      {topLoser.gainLossPercent.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                );
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
