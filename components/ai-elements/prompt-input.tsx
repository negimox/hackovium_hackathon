"use client";

import * as React from "react";
import { Plus, Send, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { AttachmentFile } from "@/components/ai-elements/attachments";

export interface PromptInputMessage {
  text?: string;
  files?: AttachmentFile[];
}

type PromptInputContextType = {
  files: AttachmentFile[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  openFileDialog: () => void;
  text: string;
  setText: (v: string) => void;
  submit: () => void;
};

const PromptInputContext = React.createContext<PromptInputContextType | null>(null);

function usePromptInputCtx() {
  const ctx = React.useContext(PromptInputContext);
  if (!ctx) throw new Error("PromptInput context missing");
  return ctx;
}

export function usePromptInputAttachments() {
  const { files, addFiles, removeFile, clearFiles, openFileDialog } = usePromptInputCtx();
  return { files, add: addFiles, remove: removeFile, clear: clearFiles, openFileDialog };
}

export function usePromptInputController() {
  const { text, setText, submit } = usePromptInputCtx();
  return { text, setText, submit };
}

export function PromptInput({
  children,
  onSubmit,
  className,
}: {
  children: React.ReactNode;
  onSubmit: (message: PromptInputMessage) => void;
  className?: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<AttachmentFile[]>([]);
  const [text, setText] = React.useState("");

  const addFiles = React.useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const mapped = arr.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = React.useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      return [];
    });
  }, []);

  const openFileDialog = React.useCallback(() => fileInputRef.current?.click(), []);

  const submit = React.useCallback(() => {
    const payload: PromptInputMessage = { text: text.trim() || undefined, files };
    if (!payload.text && (!payload.files || payload.files.length === 0)) return;
    onSubmit(payload);
    setText("");
    clearFiles();
  }, [text, files, onSubmit, clearFiles]);

  return (
    <PromptInputContext.Provider
      value={{
        files,
        addFiles,
        removeFile,
        clearFiles,
        openFileDialog,
        text,
        setText,
        submit,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn("rounded-xl border border-border/40 bg-background", className)}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export function PromptInputHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("border-b border-border/30 p-2", className)}>{children}</div>;
}

export function PromptInputBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-2", className)}>{children}</div>;
}

export function PromptInputFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between border-t border-border/30 p-2", className)}>
      {children}
    </div>
  );
}

export function PromptInputTools({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function PromptInputTextarea(props: React.ComponentProps<typeof Textarea>) {
  const { text, setText, submit } = usePromptInputCtx();
  const { onChange, className, ...rest } = props;
  return (
    <Textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange?.(e);
      }}
      onKeyDown={(e) => {
        props.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      }}
      className={cn("min-h-[52px] resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0", className)}
      {...rest}
    />
  );
}

export function PromptInputButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="sm" className={cn("h-8 px-2 normal-case", className)} {...props}>
      {children}
    </Button>
  );
}

export function PromptInputActionMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}

export function PromptInputActionMenuTrigger({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <PromptInputButton onClick={onClick}>
      <Plus className="h-4 w-4" />
    </PromptInputButton>
  );
}

export function PromptInputActionMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function PromptInputActionAddAttachments() {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <PromptInputButton onClick={openFileDialog}>
      <Paperclip className="h-4 w-4" />
      Attach
    </PromptInputButton>
  );
}

export function PromptInputSubmit({
  disabled,
  loading,
  onSubmit,
}: {
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { submit } = usePromptInputCtx();
  return (
    <Button
      type="submit"
      size="icon"
      onClick={onSubmit ?? submit}
      disabled={disabled || loading}
      className="h-8 w-8"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}
