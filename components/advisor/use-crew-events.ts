"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface CrewEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface CrewEventsState {
  events: CrewEvent[];
  isConnected: boolean;
  error: string | null;
}

export interface UseCrewEventsReturn extends CrewEventsState {
  clearEvents: () => void;
  disconnect: () => void;
}

/**
 * React hook for consuming Server-Sent Events from CrewAI execution.
 *
 * Usage:
 *   const { events, isConnected, clearEvents } = useCrewEvents(sessionId);
 *
 *   // Events include:
 *   // - crew_started, crew_completed, crew_failed
 *   // - task_started, task_completed, task_failed
 *   // - agent_started, agent_finished
 *   // - tool_started, tool_finished
 *   // - thought_started, thought_finished
 */
export function useCrewEvents(sessionId: string | null): UseCrewEventsReturn {
  const [events, setEvents] = useState<CrewEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
  }, []);

  useEffect(() => {
    // SSE streaming is disabled - we use simple POST/response now
    // Just maintain the hook interface for compatibility
    if (!sessionId) {
      disconnect();
      return;
    }

    // Don't create EventSource connection anymore
    // The chat uses simple fetch() and shows a static loading animation

    // Cleanup on unmount or sessionId change
    return () => {
      disconnect();
    };
  }, [sessionId, disconnect]);

  return {
    events,
    isConnected,
    error,
    clearEvents,
    disconnect,
  };
}
