'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WidgetData } from '@/types/dashboard';

interface MarketSummaryProps {
  widgetData: WidgetData;
}

export default function MarketSummary({ widgetData }: MarketSummaryProps) {
  const getStatusColor = (isOpen: boolean) => {
    return isOpen ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground';
  };

  const getIndexColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-success';
    if (changePercent < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  return (
    <Card className="w-full h-full overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Market Overview</CardTitle>
          <Badge className={getStatusColor(widgetData.marketStatus === 'open')}>
            {widgetData.marketStatus === 'open' ? '🟢 Market Open' : '🔴 Market Closed'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{widgetData.date}</p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Time Display */}
        <div className="flex items-center justify-between pb-3 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Market Time</span>
          <span className="text-xl font-display font-semibold">{widgetData.time}</span>
        </div>

        {/* Primary Index - NIFTY 50 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">NIFTY 50</span>
            <span className={`text-lg font-display font-semibold ${getIndexColor(widgetData.indexChangePercent)}`}>
              {formatNumber(widgetData.nifty)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Change</span>
            <span className={`font-display font-medium ${getIndexColor(widgetData.indexChangePercent)}`}>
              {widgetData.indexChange > 0 ? '+' : ''}
              {formatNumber(widgetData.indexChange)} ({widgetData.indexChangePercent > 0 ? '+' : ''}
              {widgetData.indexChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Secondary Index - SENSEX */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">SENSEX</span>
            <span className={`text-lg font-display font-semibold ${getIndexColor(widgetData.indexChangePercent)}`}>
              {formatNumber(widgetData.sensex)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className="text-muted-foreground">BSE</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
