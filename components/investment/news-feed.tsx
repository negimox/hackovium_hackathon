"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsItem from "./news-item";
import type { MarketNews } from "@/types/dashboard";

interface NewsFeedProps {
  news: MarketNews[];
}

export default function NewsFeed({ news }: NewsFeedProps) {
  const [newsItems, setNewsItems] = useState<MarketNews[]>(news);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const symbols = Array.from(new Set(newsItems.map((n) => n.symbol || "general")));
  const unreadCount = newsItems.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNewsItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const filteredNews = selectedSymbol
    ? newsItems.filter((n) => (n.symbol || "general") === selectedSymbol)
    : newsItems;

  const markAllAsRead = () => {
    setNewsItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <CardTitle className="flex items-center gap-2.5">
            <Bullet />
            Market News
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark All Read
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        {symbols.length > 1 ? (
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={(value) =>
              setSelectedSymbol(value === "all" ? null : value)
            }
          >
            <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent border-b border-border rounded-none p-0 mb-4">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                All News
              </TabsTrigger>
              {symbols.map((symbol) => (
                <TabsTrigger
                  key={symbol}
                  value={symbol}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  {symbol.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {filteredNews.length > 0 ? (
                filteredNews.map((item) => (
                  <NewsItem
                    key={item.id}
                    news={item}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No news available
                </div>
              )}
            </TabsContent>

            {symbols.map((symbol) => (
              <TabsContent key={symbol} value={symbol} className="mt-4 space-y-3">
                {filteredNews.length > 0 ? (
                  filteredNews.map((item) => (
                    <NewsItem
                      key={item.id}
                      news={item}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No news for {symbol.toUpperCase()}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <NewsItem
                  key={item.id}
                  news={item}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No news available
              </div>
            )}
          </div>
        )}

        {/* News Statistics */}
        {filteredNews.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-2xl font-display font-bold text-success">
                  {filteredNews.filter((n) => n.impact === "positive").length}
                </span>
                <span className="text-xs text-muted-foreground">Bullish</span>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-2xl font-display font-bold text-amber-600">
                  {filteredNews.filter((n) => n.impact === "neutral").length}
                </span>
                <span className="text-xs text-muted-foreground">Neutral</span>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-2xl font-display font-bold text-destructive">
                  {filteredNews.filter((n) => n.impact === "negative").length}
                </span>
                <span className="text-xs text-muted-foreground">Bearish</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
