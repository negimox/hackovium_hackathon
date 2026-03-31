"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // If we are strictly on the onboarding page, no guard needed
    if (pathname === "/onboarding") {
      setVerified(true);
      return;
    }

    if (!isLoaded) return;
    if (!user) {
      router.push("/");
      return;
    }

    const check = async () => {
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

        if (data.onboarding_completed) {
          setVerified(true);
          // dispatch a custom event to enable Edit Profile
          window.dispatchEvent(new CustomEvent("onboarding_status", { detail: { completed: true } }));
        } else {
          router.replace("/onboarding");
        }
      } catch {
        // Fallback if backend is down
        setVerified(true);
      }
    };

    check();
  }, [user, isLoaded, router, pathname]);

  if (!verified) {
    return (
      <div className="flex bg-background h-screen w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
