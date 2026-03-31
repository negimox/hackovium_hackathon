import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { SearchX } from "lucide-react";
import BracketsIcon from "@/components/icons/brackets";
import Link from "next/link";

export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Page Not Found",
        description: "404",
        icon: BracketsIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6 flex-1 py-20">
        <SearchX className="size-16 text-muted-foreground/40" strokeWidth={1.5} />

        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-display font-bold text-muted-foreground">
            Page Not Found
          </h1>
          <p className="text-sm max-w-sm text-center text-muted-foreground text-balance">
            The page you're looking for doesn't exist or is still under development.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </DashboardPageLayout>
  );
}
