"use client";

import * as React from "react";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";


import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bullet } from "@/components/ui/bullet";
import type { ChartData, TimePeriod } from "@/types/dashboard";

type ChartDataPoint = {
  date: string;
  value: number;
  indexValue?: number;
};

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "var(--chart-1)",
  },
  indexValue: {
    label: "Market Index",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface DashboardChartProps {
  data?: ChartData;
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("day");

  const handleTabChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod);
    }
  };

  const formatYAxisValue = (value: number) => {
    // Hide the "0" value by returning empty string
    if (value === 0) {
      return "";
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const renderChart = (data: ChartDataPoint[]) => {
    return (
      <div className="bg-card rounded-lg p-4 border border-border/50">
        <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: -12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillIndexValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-indexValue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-indexValue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={false}
              strokeDasharray="8 8"
              strokeWidth={1}
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={12}
              strokeWidth={1}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickCount={6}
              className="text-xs fill-muted-foreground"
              tickFormatter={formatYAxisValue}
              domain={[0, "dataMax"]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-[200px] px-4 py-3"
                />
              }
            />
            <Area
              dataKey="value"
              type="linear"
              fill="url(#fillValue)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="indexValue"
              type="linear"
              fill="url(#fillIndexValue)"
              fillOpacity={0.4}
              stroke="var(--color-indexValue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="max-md:gap-4 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Portfolio Performance</h3>
        <TabsList className="bg-secondary">
          <TabsTrigger value="day" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Day</TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Week</TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Month</TabsTrigger>
          <TabsTrigger value="year" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Year</TabsTrigger>
        </TabsList>
      </div>
      <div className="flex items-center gap-6 max-md:order-1">
        {Object.entries(chartConfig).map(([key, value]) => (
          <ChartLegend key={key} label={value.label} color={value.color} />
        ))}
      </div>
      <TabsContent value="day" className="space-y-4">
        {data?.day && data.day.length > 0 ? renderChart(data.day) : <div className="p-4 text-center text-muted-foreground">No intraday data available — market may be closed</div>}
      </TabsContent>
      <TabsContent value="week" className="space-y-4">
        {data?.week ? renderChart(data.week) : <div className="p-4 text-center text-muted-foreground">No data available</div>}
      </TabsContent>
      <TabsContent value="month" className="space-y-4">
        {data?.month ? renderChart(data.month) : <div className="p-4 text-center text-muted-foreground">No data available</div>}
      </TabsContent>
      <TabsContent value="year" className="space-y-4">
        {data?.year ? renderChart(data.year) : <div className="p-4 text-center text-muted-foreground">No data available</div>}
      </TabsContent>
    </Tabs>
  );
}

export const ChartLegend = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => {
  return (
    <div className="flex items-center gap-2 uppercase">
      <Bullet style={{ backgroundColor: color }} className="rotate-45" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};
