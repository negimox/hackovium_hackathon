import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { MockData } from "@/types/dashboard";
import BellIcon from "@/components/icons/bell";
import Image from "next/image";

interface MobileHeaderProps {
  mockData: MockData;
}

export function MobileHeader({ mockData }: MobileHeaderProps) {
  const unreadCount = mockData.news?.filter((n) => !n.read).length || 0;

  return (
    <div className="lg:hidden h-header-mobile sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Sidebar Menu */}
        <SidebarTrigger />

        {/* Center: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Everything Money" 
              width={120} 
              height={32} 
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        <Sheet>
          {/* Right: News/Alerts Menu */}
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="relative">
              {unreadCount > 0 && (
                <Badge className="absolute border-2 border-background -top-1 -left-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              <BellIcon className="size-4" />
            </Button>
          </SheetTrigger>

          {/* News Sheet */}
          <SheetContent
            closeButton={false}
            side="right"
            className="w-[80%] max-w-md p-0"
          >
            <div className="h-full flex flex-col">
              <div className="border-b px-4 py-4">
                <h2 className="text-lg font-semibold">Market News</h2>
                <p className="text-sm text-muted-foreground">Latest updates and alerts</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {mockData.news && mockData.news.length > 0 ? (
                  <div className="divide-y">
                    {mockData.news.slice(0, 5).map((article) => (
                      <div key={article.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {article.source}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              article.impact === "positive"
                                ? "bg-green-100 text-green-700"
                                : article.impact === "negative"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {article.impact}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No news available
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
