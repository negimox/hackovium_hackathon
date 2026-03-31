"use client";

import React, { forwardRef } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Conversation({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full min-h-0 flex-col">{children}</div>;
}

export const ConversationContent = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    className?: string;
  }
>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 min-h-0 overflow-y-auto px-4 py-3", className)}
    >
      <div className="mx-auto w-full max-w-5xl space-y-3">{children}</div>
    </div>
  );
});

ConversationContent.displayName = "ConversationContent";

export function ConversationEmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-muted-foreground">
      {icon}
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs">{description}</p>
    </div>
  );
}

export function ConversationScrollButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-4 right-6 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground hover:text-foreground"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  );
}
