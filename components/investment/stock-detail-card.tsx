"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import type { Stock } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface StockDetailCardProps {
  stock: Stock;
}

export default function StockDetailCard({ stock }: StockDetailCardProps) {
  const getPriceChangeClass = (change: number) => {
    if (change > 0) return "text-success";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getMetricClass = (value: number, min: number, max: number) => {
    if (value > max) return "text-destructive";
    if (value < min) return "text-success";
    return "text-muted-foreground";
  };

  const metrics = [
    {
      label: "Market Cap",
      value: stock.marketCap,
      key: "marketCap",
    },
    {
      label: "52W High",
      value: `₹${stock["52WeekHigh"]}`,
      key: "52WeekHigh",
    },
    {
      label: "52W Low",
      value: `₹${stock["52WeekLow"]}`,
      key: "52WeekLow",
    },
    { label: "EPS", value: `₹${stock.eps.toFixed(2)}`, key: "eps" },
    {
      label: "Book Value",
      value: `₹${stock.bookValue.toFixed(2)}`,
      key: "bookValue",
    },
    {
      label: "Day High",
      value: `₹${stock.dayHigh}`,
      key: "dayHigh",
    },
    {
      label: "Day Low",
      value: `₹${stock.dayLow}`,
      key: "dayLow",
    },
    {
      label: "Div Yield",
      value: `${stock.dividendYield.toFixed(2)}%`,
      key: "dividendYield",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="flex items-center gap-2.5">
              <Bullet />
              {stock.symbol}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
          </div>
          <Badge variant="secondary">{stock.sector}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Section */}
        <div className="border-b border-border pb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-display font-bold">₹{stock.price}</span>
            <span
              className={cn(
                "text-xl font-display font-semibold",
                getPriceChangeClass(stock.change)
              )}
            >
              {stock.change > 0 ? "+" : ""}
              {stock.change} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Volume: <span className="font-display">{(stock.volume / 1000000).toFixed(2)}M</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                {metric.label}
              </span>
              <span className="font-display font-semibold">{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Valuation Indicators */}
        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-semibold mb-4">Valuation Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">P/E Ratio</span>
              <span
                className={cn(
                  "font-display font-medium",
                  getMetricClass(stock.pe, 10, 40)
                )}
              >
                {stock.pe.toFixed(1)}
                {stock.pe > 40 && " (High)"}
                {stock.pe < 10 && " (Low)"}
                {stock.pe >= 10 && stock.pe <= 40 && " (Moderate)"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Book Value</span>
              <span className="font-display font-medium">₹{stock.bookValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">EPS</span>
              <span className="font-display font-medium">₹{stock.eps.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Dividend Yield</span>
              <span
                className={cn(
                  "font-display font-medium",
                  stock.dividendYield > 2
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              >
                {stock.dividendYield.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-semibold mb-4">52-Week Range</h4>
          <div className="space-y-2">
            <div className="relative h-2 bg-accent rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-primary transition-all"
                style={{
                  left: `${((stock.dayLow - stock["52WeekLow"]) / (stock["52WeekHigh"] - stock["52WeekLow"])) * 100}%`,
                  right: `${100 - ((stock.dayHigh - stock["52WeekLow"]) / (stock["52WeekHigh"] - stock["52WeekLow"])) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-display">₹{stock["52WeekLow"]}</span>
              <span className="font-display">₹{stock.price}</span>
              <span className="font-display">₹{stock["52WeekHigh"]}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
