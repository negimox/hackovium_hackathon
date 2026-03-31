"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Stock } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface StockScreenerProps {
  stocks: Stock[];
}

interface FilterCriteria {
  minPrice: number;
  maxPrice: number;
  minPE: number;
  maxPE: number;
  minDividend: number;
  sector: string;
}

export default function StockScreener({ stocks }: StockScreenerProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: 0,
    maxPrice: 10000,
    minPE: 0,
    maxPE: 50,
    minDividend: 0,
    sector: "all",
  });

  const sectors = Array.from(new Set(stocks.map((s) => s.sector)));

  const filteredStocks = stocks.filter((stock) => {
    const stockPrice = stock.price || 0;
    const stockPE = stock.pe || 0;
    const stockDividend = stock.dividendYield || 0;
    
    if (stockPrice < filters.minPrice || stockPrice > filters.maxPrice)
      return false;
    if (stockPE < filters.minPE || stockPE > filters.maxPE) return false;
    if (stockDividend < filters.minDividend) return false;
    if (filters.sector !== "all" && stock.sector !== filters.sector)
      return false;
    return true;
  });

  const handleFilterChange = (
    key: keyof FilterCriteria,
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? value : Number(value),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          Stock Screener
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Price Range (₹)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) =>
                  handleFilterChange("minPrice", e.target.value)
                }
                className="h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) =>
                  handleFilterChange("maxPrice", e.target.value)
                }
                className="h-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">P/E Ratio</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPE}
                onChange={(e) => handleFilterChange("minPE", e.target.value)}
                className="h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPE}
                onChange={(e) => handleFilterChange("maxPE", e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Min Dividend %</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minDividend}
              onChange={(e) =>
                handleFilterChange("minDividend", e.target.value)
              }
              className="h-8"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => handleFilterChange("sector", e.target.value)}
              className="h-8 px-2 bg-background border border-input rounded text-sm"
            >
              <option value="all">All Sectors</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters({
                  minPrice: 0,
                  maxPrice: 10000,
                  minPE: 0,
                  maxPE: 50,
                  minDividend: 0,
                  sector: "all",
                })
              }
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Results ({filteredStocks.length} stocks)
            </h3>
            <Badge variant="secondary">{filteredStocks.length} matches</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold text-muted-foreground">
                    Symbol
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-muted-foreground">
                    Price
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">
                    P/E
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">
                    Dividend
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-2 px-2 font-semibold">{stock.symbol}</td>
                      <td className="py-2 px-2 font-display">₹{(stock.price || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-center font-display">
                        {(stock.pe || 0).toFixed(1)}
                      </td>
                      <td
                        className={cn(
                          "py-2 px-2 text-center font-display font-medium",
                          (stock.dividendYield || 0) > 0
                            ? "text-success"
                            : "text-muted-foreground"
                        )}
                      >
                        {(stock.dividendYield || 0).toFixed(2)}%
                      </td>
                      <td
                        className={cn(
                          "py-2 px-2 text-center font-display font-medium",
                          stock.change > 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {(stock.change || 0) > 0 ? "+" : ""}
                        {(stock.changePercent || stock.percent || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 px-2 text-center text-muted-foreground">
                      No stocks match your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
