import React from "react";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
}

export default function DashboardPageLayout({
  children,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex flex-col relative w-full gap-1 min-h-full overflow-x-hidden">
      <div className="min-h-full flex-1 flex flex-col gap-6 md:gap-8 px-3 lg:px-6 py-4 md:py-6 bg-background">
        {children}
      </div>
    </div>
  );
}
