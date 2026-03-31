"use client";

import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import ChatPanel from "@/components/advisor/chat-panel";
import { useDashboardView } from "@/components/advisor/dashboard-context";
import { useAdvisorUser } from "@/lib/contexts/user-context";

export default function AdvisorChatPage() {
  const { userId, loading } = useAdvisorUser();
  const { setActiveView } = useDashboardView();

  useEffect(() => {
    setActiveView("chat");
  }, [setActiveView]);

  if (loading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-w-0 flex flex-col">
      <ChatPanel userId={userId} onReplanNeeded={() => {}} fullHeight />
    </div>
  );
}
