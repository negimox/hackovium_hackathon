"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StockLogo } from "@/components/ui/stock-logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MoverStock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent: number;
  volume: number;
}

interface MarketMoversProps {
  gainers: MoverStock[];
  losers: MoverStock[];
  active: MoverStock[];
}

export function MarketMovers({ gainers, losers, active }: MarketMoversProps) {
  const [tab, setTab] = useState<"gainers" | "losers" | "active">("gainers");

  const getActiveList = () => {
    if (tab === "gainers") return gainers;
    if (tab === "losers") return losers;
    return active;
  };

  const getPriceChangeClass = (change: number) => {
    if (change > 0) return "text-success";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card className="flex flex-col h-full min-h-[400px] bg-card/60 backdrop-blur-xl border border-border/50 overflow-hidden shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 bg-muted/20 shrink-0">
        <CardTitle className="text-base font-semibold font-display truncate pr-2">Today's Movers</CardTitle>
        <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setTab("gainers")}
            className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap", tab === "gainers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <TrendingUp size={14} className="text-success" /> Gainers
          </button>
          <button 
            onClick={() => setTab("losers")}
            className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap", tab === "losers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <TrendingDown size={14} className="text-destructive" /> Losers
          </button>
          <button 
            onClick={() => setTab("active")}
            className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap", tab === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <Activity size={14} className="text-blue-500" /> Active
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {getActiveList().map((item) => (
            <Link href={`/dashboard/stock/${item.id}`} key={item.id}>
              <div className="flex items-center justify-between p-3 border-b border-border/30 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <StockLogo symbol={item.symbol} name={item.name} type="NSE" className="w-8 h-8 rounded-full border border-border/60 shrink-0 bg-white/5 object-contain overflow-hidden" />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold font-display text-sm group-hover:text-primary transition-colors truncate">{item.symbol}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-display font-medium text-[13px]">₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={cn("text-[11px] font-semibold flex items-center gap-0.5", getPriceChangeClass(item.change))}>
                    {item.change > 0 ? "+" : ""}{(item.change || 0).toFixed(2)} 
                    <span className="opacity-80 font-normal">({item.percent > 0 ? "+" : ""}{(item.percent || 0).toFixed(2)}%)</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {getActiveList().length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No data available for this category right now.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
