"use client";

import { Wrench, ChevronDown, ChevronRight } from "lucide-react";

export function Tool({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-background/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-xs"
      >
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          {title}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="border-t border-border/50 p-3 text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}
