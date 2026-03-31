"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentFile,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Reasoning } from "@/components/ai-elements/reasoning";
import { Task, TaskItem } from "@/components/ai-elements/task";
import { Tool } from "@/components/ai-elements/tool";
import {
  useCrewEvents,
  type CrewEvent,
} from "@/components/advisor/use-crew-events";
import {
  summarizeCrewEvents,
  formatReasoningText,
} from "@/components/advisor/crew-events-utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  triggered_replan?: boolean;
  attachments?: AttachmentFile[];
  crewEvents?: CrewEvent[];
  isPending?: boolean;
}

interface ChatPanelProps {
  userId: string;
  onReplanNeeded?: () => void;
  fullHeight?: boolean;
}

function normalizeChatMessage(
  message: Partial<ChatMessage>,
  index: number,
): ChatMessage {
  return {
    id: message.id || `hist_${Date.now()}_${index}`,
    role: (message.role === "assistant" ? "assistant" : "user") as
      | "user"
      | "assistant",
    content: message.content || "",
    timestamp: message.timestamp,
    triggered_replan: message.triggered_replan,
    attachments: message.attachments || [],
    crewEvents: message.crewEvents || [],
    isPending: Boolean(message.isPending),
  };
}

function PromptInputAttachmentsDisplay({
  compact = false,
}: {
  compact?: boolean;
}) {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline" className={compact ? "px-1" : undefined}>
      {attachments.files.map((file) => (
        <Attachment
          key={file.id}
          data={file}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview data={file} />
          <AttachmentInfo data={file} />
          <AttachmentRemove onRemove={() => attachments.remove(file.id)} />
        </Attachment>
      ))}
    </Attachments>
  );
}

function HeroComposer({ loading }: { loading: boolean }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 text-left">
        <p className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          Where should we start?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask about retirement, taxes, SIP allocation, or profile updates.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/70 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
        <PromptInputHeader className="border-b-0 pb-0">
          <PromptInputAttachmentsDisplay compact />
        </PromptInputHeader>
        <PromptInputBody className="pt-2">
          <PromptInputTextarea
            placeholder="Ask your financial co-pilot..."
            disabled={loading}
            className="min-h-[72px] text-base"
          />
        </PromptInputBody>
        <PromptInputFooter className="border-t-0 pt-0">
          <PromptInputTools>
            <PromptInputActionAddAttachments />
          </PromptInputTools>
          <PromptInputSubmit loading={loading} />
        </PromptInputFooter>
      </div>
    </div>
  );
}

export default function ChatPanel({
  userId,
  onReplanNeeded,
  fullHeight = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [openReasoning, setOpenReasoning] = useState<Record<number, boolean>>(
    {},
  );
  const [openTool, setOpenTool] = useState<Record<number, boolean>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const crewEventsRef = useRef<CrewEvent[]>([]);
  const showConversation = messages.length > 0;

  // Hook into SSE events
  const {
    events: crewEvents,
    clearEvents,
    isConnected,
  } = useCrewEvents(currentSessionId);

  useEffect(() => {
    crewEventsRef.current = crewEvents;
    if (!pendingAssistantId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === pendingAssistantId ? { ...msg, crewEvents } : msg,
      ),
    );
  }, [crewEvents, pendingAssistantId]);

  useEffect(() => {
    const cacheKey = `advisor-chat-cache:${userId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<ChatMessage>[];
        if (Array.isArray(parsed)) {
          setMessages(parsed.map((msg, idx) => normalizeChatMessage(msg, idx)));
        }
      }
    } catch (err) {
      console.error("Failed to load local chat cache:", err);
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/advisor/chat/history?user_id=${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          const normalized = data.messages.map(
            (msg: Partial<ChatMessage>, idx: number) =>
              normalizeChatMessage(msg, idx),
          );
          setMessages((prev) =>
            normalized.length === 0 && prev.length > 0 ? prev : normalized,
          );
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    if (userId) loadHistory();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(
        `advisor-chat-cache:${userId}`,
        JSON.stringify(messages),
      );
    } catch (err) {
      console.error("Failed to persist local chat cache:", err);
    }
  }, [messages, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, replanning]);

  const sendMessage = async (message: PromptInputMessage) => {
    const text = message.text?.trim() || "";
    const hasText = Boolean(text);
    const hasFiles = Boolean(message.files?.length);
    if ((!hasText && !hasFiles) || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text || "Sent with attachments",
      attachments: message.files || [],
    };
    const assistantId = `assistant_${Date.now()}`;
    const pendingAssistant: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "Thinking...",
      crewEvents: [],
      isPending: true,
    };
    setMessages((prev) => [...prev, userMessage, pendingAssistant]);
    setPendingAssistantId(assistantId);
    setLoading(true);

    // Generate unique session ID for this chat request
    const sessionId = `chat_${userId}_${Date.now()}`;
    setCurrentSessionId(sessionId);
    clearEvents();

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage.content,
          session_id: sessionId,
        }),
      });
      const data = await res.json();

      const messageEvents = [...crewEventsRef.current];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  data.message ||
                  data.reply ||
                  "Sorry, I couldn't process that.",
                triggered_replan: data.needs_replan,
                crewEvents: messageEvents,
                isPending: false,
              }
            : msg,
        ),
      );
      setCurrentSessionId(null); // Stop listening after chat response
      setPendingAssistantId(null);

      if (data.needs_replan) {
        setReplanning(true);
        try {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    isPending: true,
                  }
                : msg,
            ),
          );
          const planForm = new FormData();
          planForm.append("user_id", userId);
          await fetch("/api/advisor/plan/regenerate", {
            method: "POST",
            body: planForm,
          });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    isPending: false,
                  }
                : msg,
            ),
          );
          onReplanNeeded?.();
        } finally {
          setReplanning(false);
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Connection error. Please try again.",
                isPending: false,
              }
            : msg,
        ),
      );
      setCurrentSessionId(null);
      setPendingAssistantId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full min-w-0 flex flex-col ${fullHeight ? "h-full" : "h-150"}`}
    >
      {showConversation ? (
        <div className="relative flex-1 min-h-0 flex flex-col">
          {replanning && (
            <div className="absolute right-4 top-2 z-10 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Updating plan...
            </div>
          )}

          <div className="relative flex-1 min-h-0">
            <Conversation>
              <ConversationContent ref={scrollRef} className="pt-4">
                {messages.map((msg, i) => (
                  <Message from={msg.role} key={msg.id}>
                    <MessageContent>
                      <MessageResponse from={msg.role}>
                        {msg.content}
                      </MessageResponse>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <Attachments variant="inline">
                          {msg.attachments.map((file) => (
                            <Attachment key={file.id} data={file}>
                              <AttachmentPreview data={file} />
                              <AttachmentInfo data={file} />
                            </Attachment>
                          ))}
                        </Attachments>
                      )}

                      {msg.role === "assistant" &&
                        (() => {
                          // If message has crew events, use them; otherwise show loading state
                          const events =
                            msg.crewEvents ||
                            (loading && i === messages.length - 1
                              ? crewEvents
                              : []);
                          const summary = summarizeCrewEvents(events);
                          const isStreaming = msg.isPending === true;

                          return (
                            <>
                              <Reasoning
                                open={Boolean(openReasoning[i])}
                                onToggle={() =>
                                  setOpenReasoning((prev) => ({
                                    ...prev,
                                    [i]: !prev[i],
                                  }))
                                }
                                isStreaming={isStreaming}
                              >
                                {formatReasoningText(summary)}
                              </Reasoning>

                              <Task title="Agent Progress">
                                {isStreaming && (
                                  <>
                                    <TaskItem
                                      label={
                                        replanning
                                          ? "Regenerating financial plan..."
                                          : "Analyzing your query..."
                                      }
                                      status="in_progress"
                                    />
                                    <TaskItem
                                      label="Generating response..."
                                      status="in_progress"
                                    />
                                  </>
                                )}
                                {!isStreaming && summary.tasks.length === 0 && (
                                  <TaskItem
                                    label="Response complete"
                                    status="completed"
                                  />
                                )}
                                {summary.tasks.map((task, idx) => (
                                  <TaskItem
                                    key={`task-${idx}`}
                                    label={task.name}
                                    status={
                                      task.status === "started"
                                        ? "in_progress"
                                        : task.status === "completed"
                                          ? "completed"
                                          : "pending"
                                    }
                                  />
                                ))}
                              </Task>

                              <Tool
                                title="Tool invocations"
                                open={Boolean(openTool[i])}
                                onToggle={() =>
                                  setOpenTool((prev) => ({
                                    ...prev,
                                    [i]: !prev[i],
                                  }))
                                }
                              >
                                {summary.tools.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    {isStreaming
                                      ? "Waiting for tool calls..."
                                      : "No tools were used for this response."}
                                  </p>
                                ) : (
                                  <div className="space-y-2 text-xs">
                                    {summary.tools.map((tool, idx) => (
                                      <div
                                        key={`tool-${idx}`}
                                        className="border-l-2 border-primary/30 pl-2"
                                      >
                                        <div className="font-semibold text-primary">
                                          {tool.name}
                                        </div>
                                        {tool.input && (
                                          <div className="text-muted-foreground mt-0.5">
                                            <span className="font-medium">
                                              Input:
                                            </span>{" "}
                                            {tool.input}
                                          </div>
                                        )}
                                        {tool.output && (
                                          <div className="text-muted-foreground mt-0.5">
                                            <span className="font-medium">
                                              Output:
                                            </span>{" "}
                                            {tool.output}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </Tool>
                            </>
                          );
                        })()}
                    </MessageContent>
                  </Message>
                ))}
              </ConversationContent>
              <ConversationScrollButton
                onClick={() =>
                  scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
              />
            </Conversation>
          </div>

          <div className="p-3">
            <PromptInput
              onSubmit={sendMessage}
              className="w-full rounded-xl border border-border/40 bg-background/70"
            >
              <PromptInputHeader className="border-b-0 pb-0">
                <PromptInputAttachmentsDisplay compact />
              </PromptInputHeader>
              <PromptInputBody className="pt-2">
                <PromptInputTextarea
                  placeholder="Continue the conversation..."
                  disabled={loading}
                  className="min-h-[52px]"
                />
              </PromptInputBody>
              <PromptInputFooter className="border-t-0 pt-0">
                <PromptInputTools>
                  <PromptInputActionAddAttachments />
                </PromptInputTools>
                <PromptInputSubmit loading={loading} />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              AI can make mistakes. Always review recommendations before taking
              action.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-4">
          <PromptInput
            onSubmit={sendMessage}
            className="w-full border-none bg-transparent shadow-none"
          >
            <HeroComposer loading={loading} />
          </PromptInput>
        </div>
      )}
    </div>
  );
}
