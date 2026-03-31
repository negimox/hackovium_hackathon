"use client";

import { Paperclip, FileImage, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachmentFile {
  id: string;
  name: string;
  type?: string;
  url?: string;
}

export function Attachments({
  children,
  variant = "inline",
  className,
}: {
  children: React.ReactNode;
  variant?: "inline" | "grid" | "list";
  className?: string;
}) {
  return (
    <div
      className={cn(
        variant === "grid" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
        variant === "list" && "flex flex-col gap-2",
        variant === "inline" && "flex flex-wrap gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Attachment({
  data,
  onRemove,
  children,
}: {
  data: AttachmentFile;
  onRemove?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="group inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs">
      {children || <AttachmentInfo data={data} />}
      {onRemove && <AttachmentRemove onRemove={onRemove} />}
    </div>
  );
}

export function AttachmentPreview({ data }: { data: AttachmentFile }) {
  if (data.type?.startsWith("image/")) {
    return <FileImage className="h-3.5 w-3.5 text-sky-400" />;
  }
  if (data.type?.includes("text")) {
    return <FileText className="h-3.5 w-3.5 text-emerald-400" />;
  }
  return <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function AttachmentInfo({ data }: { data: AttachmentFile }) {
  return (
    <span className="max-w-[180px] truncate" title={data.name}>
      {data.name}
    </span>
  );
}

export function AttachmentRemove({ onRemove }: { onRemove?: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="opacity-70 transition hover:opacity-100"
      aria-label="Remove attachment"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
