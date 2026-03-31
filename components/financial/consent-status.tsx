"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { ConsentStatus } from "@/lib/setu/types";

interface ConsentStatusTrackerProps {
  consentId: string;
  consentUrl: string;
  onConsentApproved: (consentId: string) => void;
  onError: (error: string) => void;
}

const POLL_INTERVAL = 3000; // 3 seconds

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; label: string; description: string }
> = {
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    label: "Awaiting Approval",
    description:
      "Please open the consent link below and approve the data request.",
  },
  ACTIVE: {
    icon: CheckCircle2,
    color: "text-success",
    label: "Consent Approved",
    description: "Your consent has been approved. Fetching financial data...",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-destructive",
    label: "Consent Rejected",
    description:
      "You rejected the consent request. You can try again with a new request.",
  },
  REVOKED: {
    icon: AlertTriangle,
    color: "text-amber-500",
    label: "Consent Revoked",
    description: "This consent has been revoked.",
  },
  EXPIRED: {
    icon: AlertTriangle,
    color: "text-muted-foreground",
    label: "Consent Expired",
    description: "This consent request has expired. Please create a new one.",
  },
};

export default function ConsentStatusTracker({
  consentId,
  consentUrl,
  onConsentApproved,
  onError,
}: ConsentStatusTrackerProps) {
  const [status, setStatus] = useState<ConsentStatus>("PENDING");
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function pollStatus() {
      try {
        const res = await fetch(`/api/setu/consent?id=${consentId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch status");
        }

        setStatus(data.status);

        if (data.status === "ACTIVE") {
          setPolling(false);
          onConsentApproved(consentId);
        } else if (
          data.status === "REJECTED" ||
          data.status === "REVOKED" ||
          data.status === "EXPIRED"
        ) {
          setPolling(false);
        }
      } catch (err: any) {
        console.error("Poll error:", err);
        // Don't stop polling on transient errors
      }
    }

    // Poll immediately
    pollStatus();
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentId]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;

  return (
    <div className="max-w-lg mx-auto text-center space-y-6">
      {/* Status indicator */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border/50 ${config.color}`}
        >
          {polling && status === "PENDING" ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <StatusIcon className="w-8 h-8" />
          )}
        </div>
        <h2 className="text-xl font-bold">{config.label}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {config.description}
        </p>
      </div>

      {/* Consent URL link */}
      {status === "PENDING" && consentUrl && (
        <a
          href={consentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
        >
          Open Consent Approval
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {/* Progress steps */}
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="space-y-4">
          {[
            {
              step: 1,
              label: "Consent Created",
              done: true,
            },
            {
              step: 2,
              label: "Review & Approve",
              done: status === "ACTIVE",
              active: status === "PENDING",
            },
            {
              step: 3,
              label: "Link Accounts",
              done: status === "ACTIVE",
              active: false,
            },
            {
              step: 4,
              label: "Fetch Data",
              done: false,
              active: status === "ACTIVE",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.done
                    ? "bg-success/20 text-success"
                    : item.active
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.done ? "✓" : item.step}
              </div>
              <span
                className={`text-sm ${
                  item.done
                    ? "text-success font-medium"
                    : item.active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {item.active && polling && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consent ID reference */}
      <p className="text-xs text-muted-foreground">
        Consent ID:{" "}
        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">
          {consentId}
        </code>
      </p>
    </div>
  );
}
