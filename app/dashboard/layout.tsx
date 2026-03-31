"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LeftSidebar } from "@/components/dashboard/sidebar/left-sidebar";
import { OnboardingGuard } from "@/components/advisor/onboarding-guard";
import {
  DashboardProvider,
  useDashboardView,
} from "@/components/advisor/dashboard-context";
import { DashboardHeader } from "@/components/advisor/dashboard-header";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { activeView } = useDashboardView();
  const isChat = activeView === "chat";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden in chat mode */}
        {!isChat && (
          <SidebarProvider
            defaultOpen={true}
            defaultWidth="14rem"
            cookieName="sidebar:state"
          >
            <LeftSidebar />
            <SidebarInset>
              <main className="flex-1 flex flex-col min-w-0 overflow-auto">
                <div className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        )}

        {/* Full width in chat mode */}
        {isChat && (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 p-0 max-w-full overflow-hidden">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <DashboardProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </DashboardProvider>
    </OnboardingGuard>
  );
}
