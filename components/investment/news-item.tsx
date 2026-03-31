"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MarketNews } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface NewsItemProps {
  news: MarketNews;
  onMarkAsRead?: (id: string) => void;
}

export default function NewsItem({
  news,
  onMarkAsRead,
}: NewsItemProps) {
  const getImpactColor = (impact: string) => {
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

  const getImpactBadgeLabel = (impact: string) => {
    switch (impact) {
      case "positive":
        return "Bullish";
      case "negative":
        return "Bearish";
      case "neutral":
        return "Neutral";
      default:
        return "Unknown";
    }
  };

  const getSentimentBar = (score: number) => {
    if (score > 0.5) return "bg-success";
    if (score < -0.5) return "bg-destructive";
    return "bg-amber-500";
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        "p-4 hover:bg-accent/50 transition-colors cursor-pointer border flex flex-col sm:flex-row gap-4 relative overflow-hidden",
        !news.read && "border-primary/50 bg-primary/5"
      )}
      onClick={() => {
        if (news.url && news.url !== "#") {
          window.open(news.url, "_blank", "noopener,noreferrer");
        }
        onMarkAsRead?.(news.id);
      }}
    >
      <div className="flex-1 space-y-3 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {news.title}
            </h4>
            {news.symbol && (
              <p className="text-xs font-bold text-primary mt-1 uppercase tracking-wide">
                {news.symbol}
              </p>
            )}
          </div>
          {!news.read && (
            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
          )}
        </div>

        {/* Summary */}
        <div className="bg-muted/30 p-2.5 rounded-md border border-border/40">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {news.summary}
          </p>
        </div>

        {/* Badges and Impact */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex gap-2 items-center">
            {news.impact !== "neutral" && (
              <Badge
                variant="outline"
                className={cn("border font-medium", getImpactColor(news.impact))}
              >
                {getImpactBadgeLabel(news.impact)}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider bg-secondary/50">
              {news.source}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
            {formatTime(news.timestamp)}
          </span>
        </div>
      </div>
      
      {/* Image Thumbnail */}
      {news.imageUrl && (
        <div className="shrink-0 hidden sm:block">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-28 h-24 object-cover rounded-md border border-border/50 shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </Card>
  );
}
