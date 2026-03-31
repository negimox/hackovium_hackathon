"use client";

import Image from "next/image";
import { LayoutDashboard, MessageSquare } from "lucide-react";
import { useDashboardView } from "@/components/advisor/dashboard-context";
import { UserButton } from "@clerk/nextjs";

export function DashboardHeader() {
  const { activeView, setActiveView } = useDashboardView();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Everything Money"
            width={140}
            height={36}
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Center: Toggle Switch */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeView === "dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView("chat")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeView === "chat"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
