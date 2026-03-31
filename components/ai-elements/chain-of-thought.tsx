"use client";

import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChainOfThought({
  open,
  onToggle,
  title = "Reasoning",
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="space-y-2 border-t border-border/50 p-3">{children}</div>}
    </div>
  );
}

export function ChainOfThoughtStep({
  label,
  status = "complete",
}: {
  label: string;
  status?: "complete" | "active" | "pending";
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "complete" && "bg-emerald-400",
          status === "active" && "bg-sky-400",
          status === "pending" && "bg-muted-foreground/40",
        )}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function ChainOfThoughtSearchResults({
  items,
}: {
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
        >
          <Search className="h-3 w-3" />
          {item}
        </span>
      ))}
    </div>
  );
}
