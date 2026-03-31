"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import type { MarketMood } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface MarketMoodIndexProps {
  mood: MarketMood;
}

export default function MarketMoodIndex({ mood }: MarketMoodIndexProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "very_positive":
        return "bg-success/10 text-success border-success/30";
      case "positive":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "neutral":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "negative":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
      case "very_negative":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case "very_positive":
        return "Extremely Bullish";
      case "positive":
        return "Bullish";
      case "neutral":
        return "Neutral";
      case "negative":
        return "Bearish";
      case "very_negative":
        return "Extremely Bearish";
      default:
        return "Unknown";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      case "stable":
        return "→";
      default:
        return "•";
    }
  };

  const getTrendClass = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      case "stable":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <Bullet />
          Market Mood Index
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Mood Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Overall Sentiment
            </span>
            <Badge
              variant="outline"
              className={cn(
                "border",
                getSentimentColor(mood.sentiment)
              )}
            >
              {getSentimentLabel(mood.sentiment)}
            </Badge>
          </div>

          {/* Mood Index Bar */}
          <div className="space-y-2">
            <div className="relative h-8 bg-gradient-to-r from-destructive/20 via-amber-500/20 to-success/20 rounded-lg overflow-hidden border border-border">
              <div
                className="absolute h-full bg-gradient-to-r from-destructive to-success transition-all duration-500 opacity-70"
                style={{ width: `${mood.index}%` }}
              />
              <div
                className={cn(
                  "absolute h-full w-1 bg-foreground/80 transition-all duration-500 flex items-center justify-center rounded-sm",
                  "shadow-lg",
                )}
                style={{ left: `${mood.index}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute w-6 h-6 bg-foreground/80 rounded-full border-2 border-background" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fear (0)</span>
              <span className="font-display font-semibold">{mood.index}</span>
              <span>Greed (100)</span>
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Trend:</span>
            <span
              className={cn(
                "text-xl font-display font-bold transition-all",
                getTrendClass(mood.trend)
              )}
            >
              {getTrendIcon(mood.trend)}
            </span>
            <span className="text-sm font-medium capitalize">{mood.trend}</span>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold">Sentiment Breakdown</h4>

          <div className="space-y-3">
            {/* Buyer vs Seller */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buyer Sentiment</span>
                <span className="font-display font-semibold text-success">
                  {mood.buyerSentiment}%
                </span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${mood.buyerSentiment}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seller Sentiment</span>
                <span className="font-display font-semibold text-destructive">
                  {mood.sellerSentiment}%
                </span>
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-destructive transition-all"
                  style={{ width: `${mood.sellerSentiment}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Market Metrics */}
        <div className="border-t border-border pt-6 space-y-4">
          <h4 className="text-sm font-semibold">Market Metrics</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Volatility Index
              </span>
              <span className="text-lg font-display font-bold">{mood.volatilityIndex}</span>
              <span className="text-xs text-muted-foreground">
                {mood.volatilityIndex > 20
                  ? "High volatility"
                  : "Low volatility"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                Breadth
              </span>
              <span className="text-lg font-display font-bold">
                {((mood.breadthAdvance / (mood.breadthAdvance + mood.breadthDecline)) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground font-display">
                {mood.breadthAdvance} Adv / {mood.breadthDecline} Dec
              </span>
            </div>
          </div>

          {/* Breadth Chart */}
          <div className="space-y-2 mt-4">
            <div className="flex h-6 gap-1 rounded-lg overflow-hidden bg-accent">
              <div
                className="bg-success transition-all"
                style={{
                  width: `${(mood.breadthAdvance / (mood.breadthAdvance + mood.breadthDecline)) * 100}%`,
                }}
              />
              <div
                className="bg-destructive transition-all"
                style={{
                  width: `${(mood.breadthDecline / (mood.breadthAdvance + mood.breadthDecline)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Advances</span>
              <span>Declines</span>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="border-t border-border pt-6 p-4 bg-accent/50 rounded-lg">
          <p className="text-sm text-foreground">
            {mood.index > 70 && "🟢 Market is extremely bullish. Strong buying interest with positive sentiment across sectors."}
            {mood.index > 50 && mood.index <= 70 && "🟢 Market sentiment is positive. Most stocks showing strength with good buying interest."}
            {mood.index > 30 && mood.index <= 50 && "🟡 Market is neutral. Mixed sentiment with equal buying and selling pressure."}
            {mood.index > 0 && mood.index <= 30 && "🔴 Market sentiment is negative. Selling pressure with weak investor confidence."}
            {mood.index === 0 && "🔴 Market is extremely bearish. Strong panic selling with very weak investor sentiment."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
