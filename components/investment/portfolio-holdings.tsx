"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import type { PortfolioHolding } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface PortfolioHoldingsProps {
  holdings: PortfolioHolding[];
}

export default function PortfolioHoldings({
  holdings,
}: PortfolioHoldingsProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "stock":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "mutual":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "etf":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          Holdings Details
        </CardTitle>
        <Badge variant="secondary">{holdings.length} Holdings</Badge>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Symbol
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Quantity
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Avg Buy
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Current
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Value
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Gain/Loss
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => (
                <tr
                  key={holding.id}
                  className="border-b border-border hover:bg-accent/50 transition-colors"
                >
                  <td className="py-3 px-2 font-semibold">
                    <div className="flex flex-col">
                      <span>{holding.symbol}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {holding.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-display">{holding.quantity}</td>
                  <td className="py-3 px-2 text-right font-display">
                    ₹{holding.buyPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-display font-medium">
                    ₹{holding.currentPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-display font-semibold">
                    ₹{holding.value.toLocaleString()}
                    <div className="text-xs text-muted-foreground font-normal">
                      {((holding.value / totalValue) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td
                    className={cn(
                      "py-3 px-2 text-right font-display font-semibold",
                      holding.gainLoss > 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    <div className="flex flex-col items-end">
                      <span>
                        {holding.gainLoss > 0 ? "+" : ""}
                        ₹{holding.gainLoss.toLocaleString()}
                      </span>
                      <span className="text-xs">
                        {holding.gainLossPercent > 0 ? "+" : ""}
                        {holding.gainLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge
                      variant="secondary"
                      className={getTypeColor(holding.type)}
                    >
                      {getTypeLabel(holding.type)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {holdings.length > 0 && (
        <div className="border-t border-border mt-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Total Value
              </span>
              <span className="font-display font-bold">₹{totalValue.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Avg Position
              </span>
              <span className="font-display font-bold">
                ₹{(totalValue / holdings.length).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Largest Position
              </span>
              <span className="font-display font-bold">
                {totalValue > 0 ? ((sortedHoldings[0].value / totalValue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Concentration
              </span>
              <span className="font-display font-bold">
                {totalValue > 0 ? (((sortedHoldings[0].value + (sortedHoldings[1]?.value || 0)) / totalValue * 100).toFixed(1)) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
