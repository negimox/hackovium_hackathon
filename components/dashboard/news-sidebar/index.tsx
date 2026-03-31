import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import type { MarketNews } from "@/types/dashboard";

interface NewsSidebarProps {
  news: MarketNews[];
}

export default function NewsSidebar({ news }: NewsSidebarProps) {
  const unreadCount = news.filter((n) => !n.read).length;

  return (
    <Card className="h-full flex flex-col overflow-hidden min-h-0 flex-1">
      <Link href="/news" className="shrink-0 group block border-b border-border/50 hover:bg-muted/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pl-3 pr-3 py-2.5 space-y-0">
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase group-hover:text-primary transition-colors">
            {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : <Bullet />}
            Market News
          </CardTitle>
          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider group-hover:text-primary transition-colors">
            View All →
          </span>
        </CardHeader>
      </Link>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col">
            {news.map((article, idx) => (
            <div
              key={idx}
              className={`p-4 flex flex-col hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0 cursor-pointer`}
              onClick={() => {
                if (article.url && article.url !== "#") {
                  window.open(article.url, "_blank", "noopener,noreferrer");
                }
              }}
            >
              {/* Source + badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {article.source}
                </span>
                <Badge
                  variant={
                    article.impact === "positive"
                      ? "default"
                      : article.impact === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[9px] h-4 px-1 shrink-0 uppercase"
                >
                  {article.impact}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="text-xs font-semibold leading-relaxed mb-1.5 group-hover:text-primary transition-colors">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="text-[11px] text-muted-foreground leading-normal mb-2 line-clamp-2">
                {article.summary}
              </p>

              {/* Symbol tag + Time */}
              <div className="flex items-center justify-between mt-auto">
                {article.symbol && (
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm uppercase">
                    {article.symbol}
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground font-medium">
                  {article.timestamp}
                </span>
              </div>
            </div>
          ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
