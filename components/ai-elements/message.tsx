"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Message({
  from,
  children,
}: {
  from: "user" | "assistant";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", from === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("w-full", from === "user" ? "max-w-[78%]" : "max-w-[92%]")}>{children}</div>
    </div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function MessageResponse({
  from,
  children,
}: {
  from: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isMarkdownText = typeof children === "string";
  return (
    <div
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
        from === "user"
          ? "bg-primary text-primary-foreground"
          : "border border-border/50 bg-muted/40 text-foreground",
      )}
    >
      {isMarkdownText ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "underline underline-offset-4",
                  from === "user" ? "text-primary-foreground/90" : "text-primary",
                )}
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs",
                  from === "user"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {children}
              </code>
            ),
          }}
        >
          {children}
        </ReactMarkdown>
      ) : (
        children
      )}
    </div>
  );
}
