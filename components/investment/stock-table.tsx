"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Stock } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface StockTableProps {
  stocks: Stock[];
  title?: string;
  showActions?: boolean;
}

export default function StockTable({
  stocks,
  title = "Top Stocks",
  showActions = true,
}: StockTableProps) {
  const getPriceChangeClass = (change: number) => {
    if (change > 0) return "text-success";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      IT: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      Banking: "bg-green-500/10 text-green-700 dark:text-green-400",
      Energy: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      Pharma: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      Auto: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    };
    return colors[sector] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Symbol
                </th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Price
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  Change
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  Volume
                </th>
                <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                  Sector
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  P/E
                </th>
                {showActions && (
                  <th className="text-center py-3 px-2 font-semibold text-muted-foreground">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr
                  key={stock.id}
                  className="border-b border-border hover:bg-accent/50 transition-colors"
                >
                  <td className="py-3 px-2 font-semibold">{stock.symbol}</td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="font-display font-medium">₹{stock.price}</span>
                      <span className="text-xs text-muted-foreground">
                        {stock.name}
                      </span>
                    </div>
                  </td>
                  <td className={cn("py-3 px-2 text-center font-display font-semibold", getPriceChangeClass(stock.change))}>
                    <div className="flex flex-col items-center">
                      <span>
                        {stock.change > 0 ? "+" : ""}
                        {stock.change}
                      </span>
                      <span className="text-xs">{stock.changePercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-display text-muted-foreground">
                    {(stock.volume / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge
                      variant="secondary"
                      className={getSectorColor(stock.sector)}
                    >
                      {stock.sector}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right font-display">{stock.pe.toFixed(1)}</td>
                  {showActions && (
                    <td className="py-3 px-2 text-center">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
