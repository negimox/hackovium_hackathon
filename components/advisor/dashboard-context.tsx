"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DashboardContextType {
  activeView: "dashboard" | "chat";
  setActiveView: (view: "dashboard" | "chat") => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

import { usePathname, useRouter } from "next/navigation";

export function DashboardProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Initialize from URL first, then localStorage
  const getInitialView = (): "dashboard" | "chat" => {
    if (pathname === "/dashboard/chat") return "chat";
    if (pathname === "/dashboard") return "dashboard";
    return "dashboard";
  };

  const [activeView, setActiveState] = useState<"dashboard" | "chat">(getInitialView());

  // Load from localstorage and sync with URL
  useEffect(() => {
    const saved = localStorage.getItem("active_dashboard_view") as "dashboard" | "chat";
    
    // If we are on root /dashboard but saved is chat, redirect? 
    // Actually, let's just respect the current path, but save it when it changes.
    if (pathname === "/dashboard/chat") {
      setActiveState("chat");
      localStorage.setItem("active_dashboard_view", "chat");
    } else if (pathname === "/dashboard") {
      setActiveState("dashboard");
      localStorage.setItem("active_dashboard_view", "dashboard");
    }
  }, [pathname]);

  const setActiveView = (view: "dashboard" | "chat") => {
    if (view === activeView) return;

    setActiveState(view);
    localStorage.setItem("active_dashboard_view", view);
    
    if (view === "chat" && pathname !== "/dashboard/chat") {
      router.push("/dashboard/chat");
    } else if (view === "dashboard" && pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  };

  return (
    <DashboardContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardView() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardView must be used within DashboardProvider");
  }
  return context;
}
