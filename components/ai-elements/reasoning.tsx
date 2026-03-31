"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

export function Reasoning({
  open,
  onToggle,
  isStreaming,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  isStreaming?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-background/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground"
      >
        <span>{isStreaming ? "Thinking..." : "Reasoning"}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="border-t border-border/50 p-3 text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}
