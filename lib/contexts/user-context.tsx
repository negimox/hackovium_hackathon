"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

interface UserContextValue {
  userId: string | null;
  loading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const initUser = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        clerk_user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        first_name: user.firstName || "",
        last_name: user.lastName || "",
      };

      const res = await fetch(`/api/advisor/user/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.found && data.user_id) {
        localStorage.setItem("advisor_user_id", data.user_id);
        setUserId(data.user_id);
        setOnboardingCompleted(data.onboarding_completed);

        // Redirect logic based on current path
        if (
          !data.onboarding_completed &&
          !pathname?.startsWith("/onboarding")
        ) {
          router.replace("/onboarding");
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to initialize user:", err);
      setError("Failed to connect to advisor service");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    // Don't redirect if not logged in and on public routes
    if (!user) {
      if (pathname === "/" || pathname?.startsWith("/sign-")) {
        setLoading(false);
        return;
      }
      router.push("/");
      return;
    }

    // Only init once per session
    if (!initialized) {
      setInitialized(true);
      initUser();
    }
  }, [user, isLoaded, initialized]);

  const refreshUser = async () => {
    setLoading(true);
    await initUser();
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        loading,
        error,
        onboardingCompleted,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useAdvisorUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useAdvisorUser must be used within a UserProvider");
  }
  return context;
}
