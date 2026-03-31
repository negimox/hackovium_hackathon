"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import type { Fund } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface FundComparisonProps {
  funds: Fund[];
}

type SortKey = "nav" | "returns1Y" | "returns3Y" | "expenseRatio";

export default function FundComparison({ funds }: FundComparisonProps) {
  const [sortBy, setSortBy] = useState<SortKey>("returns1Y");
  const [filterType, setFilterType] = useState<"all" | "mutual" | "etf">("all");

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "moderate":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getChangeClass = (change: number) => {
    if (change > 0) return "text-success";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const filteredFunds = funds.filter((f) =>
    filterType === "all" ? true : f.type === filterType
  );

  const sortedFunds = [...filteredFunds].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return (bVal as number) - (aVal as number);
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          Mutual Funds & ETFs
        </CardTitle>
        <Badge variant="secondary">{filteredFunds.length} Funds</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-colors",
              filterType === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("mutual")}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-colors",
              filterType === "mutual"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            )}
          >
            Mutual Funds
          </button>
          <button
            onClick={() => setFilterType("etf")}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-colors",
              filterType === "etf"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            )}
          >
            ETFs
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center">
            Sort by:
          </span>
          {(["returns1Y", "returns3Y", "expenseRatio", "nav"] as SortKey[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  sortBy === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {key === "returns1Y"
                  ? "1Y Returns"
                  : key === "returns3Y"
                    ? "3Y Returns"
                    : key === "expenseRatio"
                      ? "Expense Ratio"
                      : "NAV"}
              </button>
            )
          )}
        </div>

        {/* Fund Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Fund Name
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  NAV
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  1Y Return
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  3Y Return
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  Expense
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  AUM
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFunds.map((fund) => (
                <tr
                  key={fund.id}
                  className="border-b border-border hover:bg-accent/50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fund.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {fund.type === "mutual" ? "MF" : "ETF"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fund.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-display font-medium">
                    ₹{fund.nav.toFixed(2)}
                    <div
                      className={cn(
                        "text-xs font-display font-medium",
                        getChangeClass(fund.change)
                      )}
                    >
                      {fund.change > 0 ? "+" : ""}
                      {fund.change.toFixed(2)} (
                      {fund.changePercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td
                    className={cn(
                      "py-3 px-2 text-center font-display font-semibold",
                      fund.returns1Y > 15
                        ? "text-success"
                        : fund.returns1Y > 5
                          ? "text-amber-600"
                          : "text-destructive"
                    )}
                  >
                    {fund.returns1Y.toFixed(2)}%
                  </td>
                  <td
                    className={cn(
                      "py-3 px-2 text-center font-display font-semibold",
                      fund.returns3Y > 12
                        ? "text-success"
                        : fund.returns3Y > 5
                          ? "text-amber-600"
                          : "text-destructive"
                    )}
                  >
                    {fund.returns3Y.toFixed(2)}%
                  </td>
                  <td className="py-3 px-2 text-center font-display text-sm">
                    {fund.expenseRatio.toFixed(2)}%
                  </td>
                  <td className="py-3 px-2 text-right font-display text-sm text-muted-foreground">
                    {fund.aum}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge
                      variant="secondary"
                      className={getRiskColor(fund.riskProfile)}
                    >
                      {fund.riskProfile.charAt(0).toUpperCase() +
                        fund.riskProfile.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fund Manager Info */}
        {sortedFunds.length > 0 && (
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Fund Managers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sortedFunds
                .filter(
                  (f, i, arr) =>
                    arr.findIndex((x) => x.fundManager === f.fundManager) === i
                )
                .slice(0, 3)
                .map((fund) => (
                  <div
                    key={fund.fundManager}
                    className="text-sm p-2 bg-accent rounded"
                  >
                    <span className="text-muted-foreground">
                      {fund.fundManager}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
