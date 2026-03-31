"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export function Task({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20">
      <div className="px-3 py-2 text-xs font-semibold">{title}</div>
      <div className="border-t border-border/40 p-3 space-y-2">{children}</div>
    </div>
  );
}

export function TaskItem({
  label,
  status,
}: {
  label: string;
  status: "pending" | "in_progress" | "completed";
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
      {status === "in_progress" && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />}
      {status === "pending" && <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
