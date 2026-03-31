"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MarketSummary from "@/components/dashboard/market-summary";
import NewsSidebar from "@/components/dashboard/news-sidebar";
import MiniWatchlist from "@/components/dashboard/mini-watchlist";
import { GlobalSearch } from "@/components/ui/global-search";
import { cn } from "@/lib/utils";
import type { MockData, MarketNews } from "@/types/dashboard";
import mockDataJson from "@/mock.json";
import { PanelRightClose, PanelRightOpen, BarChart3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockData = mockDataJson as unknown as MockData;

const STORAGE_KEY = "sidebar:right_tab";

function getInitialTab(pathname: string): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "market" || stored === "watchlist") return stored;
  }
  return pathname === "/watchlist" ? "watchlist" : "market";
}

export function RightSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const [activeTab, setActiveTab] = React.useState(() => getInitialTab(pathname));
  const [news, setNews] = React.useState<MarketNews[]>([]);

  React.useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNews(data);
        }
      })
      .catch((err) => console.error("Failed to fetch news:", err));
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <Sidebar
      collapsible="icon"
      side="right"
      {...props}
      className={cn("py-4", className)}
      style={{
        "--sidebar-width": "22rem",
      } as React.CSSProperties}
    >
      <SidebarContent className="flex flex-col h-full overflow-hidden">
        {/* Expanded state */}
        <div className="group-data-[collapsible=icon]:hidden flex flex-col h-full overflow-hidden">
          {/* Global Search Header */}
          <div className="px-3 pt-3 pb-1 shrink-0">
             <GlobalSearch />
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full overflow-hidden gap-0">
            {/* Header row: Tabs + Collapse toggle */}
            <div className="flex items-center gap-1.5 px-2 py-2 shrink-0">
              <TabsList className="flex-1">
                <TabsTrigger
                  value="market"
                  className="flex-1 text-xs gap-1.5 data-[state=active]:text-primary-foreground"
                >
                  <BarChart3 className="size-3.5" />
                  Market
                </TabsTrigger>
                <TabsTrigger
                  value="watchlist"
                  className="flex-1 text-xs gap-1.5 data-[state=active]:text-primary-foreground"
                >
                  <Eye className="size-3.5" />
                  Watchlist
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="size-9 shrink-0"
              >
                <PanelRightClose className="size-4" />
              </Button>
            </div>

            {/* Market Intelligence panel */}
            <TabsContent
              value="market"
              className="flex-1 flex flex-col min-h-0 min-w-0 px-2 pb-2 mt-0 data-[state=inactive]:hidden gap-4"
            >
              <div className="shrink-0">
                <MarketSummary widgetData={mockData.widgetData} />
              </div>
              <NewsSidebar news={news.length > 0 ? news : (mockData.news || [])} />
            </TabsContent>

            {/* Watchlist panel */}
            <TabsContent
              value="watchlist"
              className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 mt-0 data-[state=inactive]:hidden"
            >
              <MiniWatchlist />
            </TabsContent>
          </Tabs>
        </div>

        {/* Collapsed state */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-3 pt-2">
          <GlobalSearch variant="icon" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="size-8"
          >
            <PanelRightOpen className="size-4" />
          </Button>
          
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <BarChart3 className="size-4" />
          </div>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <Eye className="size-4" />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

