"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardPageLayout from "@/components/dashboard/layout";
import ConsentForm from "@/components/financial/consent-form";
import ConsentStatusTracker from "@/components/financial/consent-status";
import FinancialSummary from "@/components/financial/financial-summary";
import { Landmark, Loader2, RotateCcw } from "lucide-react";
import type { FinancialFlowStep } from "@/lib/setu/types";

// Cookie helpers — cookies persist across tabs and are not size-limited like sessionStorage
function setCookie(name: string, value: string, days: number = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const COOKIE_KEYS = {
  CONSENT_ID: "setu_consent_id",
  CONSENT_URL: "setu_consent_url",
  SESSION_ID: "setu_session_id",
  FLOW_STEP: "setu_flow_step",
} as const;

function saveState(key: string, value: string | null) {
  if (value) {
    setCookie(key, value);
  } else {
    deleteCookie(key);
  }
}

function clearAllState() {
  Object.values(COOKIE_KEYS).forEach((key) => deleteCookie(key));
}function FinancialDataContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<FinancialFlowStep>("form");
  const [consentId, setConsentId] = useState<string | null>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [fiData, setFiData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  // Restore state from cookies on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // SETU redirects with either:
    //   ?consent_status=success  (our configured redirect URL)
    //   ?success=true&id=<consentId>  (SETU's actual redirect format)
    const consentStatus = searchParams.get("consent_status");
    const setuSuccess = searchParams.get("success");
    const setuConsentIdParam = searchParams.get("id");
    const isConsentRedirect = consentStatus === "success" || setuSuccess === "true";

    const storedConsentId = getCookie(COOKIE_KEYS.CONSENT_ID);
    const storedConsentUrl = getCookie(COOKIE_KEYS.CONSENT_URL);
    const storedStep = getCookie(COOKIE_KEYS.FLOW_STEP) as FinancialFlowStep | null;
    const storedSessionId = getCookie(COOKIE_KEYS.SESSION_ID);

    // The consent ID to use: from URL param (SETU redirect) or from cookies
    const effectiveConsentId = setuConsentIdParam || storedConsentId;

    // Strip redirect params from URL to prevent re-triggering on refresh
    if (isConsentRedirect || setuConsentIdParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("consent_status");
      url.searchParams.delete("success");
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    }

    // PRIORITY 1: Restore completed/in-progress session (re-fetch data by session ID)
    // This MUST come before the consent redirect check, otherwise a refresh
    // or redirect tab would re-create a session and hit "Consent use exceeded".
    if ((storedStep === "data_loaded" || storedStep === "fetching_data") && storedSessionId) {
      setConsentId(storedConsentId);
      setStep("fetching_data");

      (async () => {
        try {
          const dataRes = await fetch(`/api/setu/data?sessionId=${storedSessionId}`);
          const data = await dataRes.json();

          if (
            (data.status === "COMPLETED" || data.status === "PARTIAL" || data.status === "PENDING") &&
            data.payload &&
            Array.isArray(data.payload) &&
            data.payload.length > 0
          ) {
            setFiData(data.payload);
            setStep("data_loaded");
            // Re-confirm all cookies on successful restore
            saveState(COOKIE_KEYS.FLOW_STEP, "data_loaded");
            saveState(COOKIE_KEYS.SESSION_ID, storedSessionId);
            if (storedConsentId) saveState(COOKIE_KEYS.CONSENT_ID, storedConsentId);
          } else {
            // Session data expired or unavailable — back to form
            setStep("form");
            clearAllState();
          }
        } catch {
          setStep("form");
          clearAllState();
        }
      })();
      return;
    }

    // PRIORITY 2: Handle redirect back from SETU consent approval screen
    // Handles both ?consent_status=success and ?success=true&id=<consentId>
    if (isConsentRedirect && effectiveConsentId) {
      setConsentId(effectiveConsentId);
      setConsentUrl(storedConsentUrl);

      // Save the consent ID from the URL param if we didn't have it in cookies
      if (!storedConsentId && setuConsentIdParam) {
        saveState(COOKIE_KEYS.CONSENT_ID, setuConsentIdParam);
      }
      saveState(COOKIE_KEYS.FLOW_STEP, "consent_pending");

      setStep("consent_pending");
      return;
    }

    // PRIORITY 3: Restore consent-pending state (consent created but not yet approved)
    if (storedStep === "consent_pending" && storedConsentId && storedConsentUrl) {
      setConsentId(storedConsentId);
      setConsentUrl(storedConsentUrl);
      setStep("consent_pending");
      return;
    }

    // PRIORITY 4: If flow_step says data_loaded but we lost session_id, reset
    // (handles orphaned state where only FLOW_STEP cookie survived)
    if (storedStep && storedStep !== "form") {
      clearAllState();
    }

    // Default: show form
    setStep("form");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConsentCreated = useCallback(
    (id: string, url: string) => {
      setConsentId(id);
      setConsentUrl(url);
      setStep("consent_pending");

      saveState(COOKIE_KEYS.CONSENT_ID, id);
      saveState(COOKIE_KEYS.CONSENT_URL, url);
      saveState(COOKIE_KEYS.FLOW_STEP, "consent_pending");
    },
    []
  );

  /** Check if payload has at least one account with actual data */
  function hasReadyAccounts(payload: any[] | null | undefined): boolean {
    if (!Array.isArray(payload)) return false;
    return payload.some((fip: any) => {
      const accounts = fip?.accounts || fip?.data || [];
      if (!Array.isArray(accounts)) return false;
      return accounts.some((acc: any) => acc?.FIstatus === "READY" && acc?.data);
    });
  }

  /** Poll a session until data is ready, returns true if data was loaded */
  async function pollSessionForData(
    sessionId: string,
    consentId: string,
    maxPolls: number = 12,
    interval: number = 5000
  ): Promise<boolean> {
    for (let poll = 0; poll < maxPolls; poll++) {
      if (poll > 0) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      const dataRes = await fetch(`/api/setu/data?sessionId=${sessionId}`);
      const data = await dataRes.json();

      console.log("[Financial Data] Session poll response:", data);

      // Accept COMPLETED, PARTIAL, or PENDING-with-data
      // SETU returns PENDING when some FIPs responded but others haven't yet.
      // The payload may already contain usable READY accounts.
      const isComplete = data.status === "COMPLETED" || data.status === "PARTIAL";
      const isPendingWithData = data.status === "PENDING" && hasReadyAccounts(data.payload);

      if (isComplete || isPendingWithData) {
        const payload = data.payload;
        setFiData(payload || []);
        setStep("data_loaded");

        // Persist ALL IDs together
        saveState(COOKIE_KEYS.CONSENT_ID, consentId);
        saveState(COOKIE_KEYS.SESSION_ID, sessionId);
        saveState(COOKIE_KEYS.FLOW_STEP, "data_loaded");

        return true;
      }

      if (data.status === "FAILED" || data.status === "EXPIRED") {
        console.warn(`Data session ${sessionId} ${data.status}`);
        return false;
      }
    }
    return false; // timed out
  }

  const handleConsentApproved = useCallback(async (approvedConsentId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setStep("fetching_data");
    saveState(COOKIE_KEYS.CONSENT_ID, approvedConsentId);
    saveState(COOKIE_KEYS.FLOW_STEP, "fetching_data");

    try {
      // Check if another tab already created a session (via shared cookies)
      const existingSessionId = getCookie(COOKIE_KEYS.SESSION_ID);
      if (existingSessionId) {
        console.log("[Financial Data] Found existing session in cookies:", existingSessionId);
        const loaded = await pollSessionForData(existingSessionId, approvedConsentId);
        if (loaded) {
          fetchingRef.current = false;
          return;
        }
        // Existing session failed/timed out — fall through to create new
      }

      // Create new session (only if no existing session was found or it failed)
      const sessionRes = await fetch("/api/setu/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId: approvedConsentId }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        const errMsg = sessionData.error || "";
        if (errMsg.includes("Consent use exceeded")) {
          // Another tab may have completed — re-check cookies one more time
          const laterSessionId = getCookie(COOKIE_KEYS.SESSION_ID);
          if (laterSessionId) {
            const loaded = await pollSessionForData(laterSessionId, approvedConsentId);
            if (loaded) {
              fetchingRef.current = false;
              return;
            }
          }
          throw new Error(
            "Daily data fetch limit reached for this consent. " +
            "Please try again tomorrow, or create a new consent request."
          );
        }
        throw new Error(errMsg || "Failed to create data session");
      }

      const sessionId = sessionData.sessionId;
      saveState(COOKIE_KEYS.CONSENT_ID, approvedConsentId);
      saveState(COOKIE_KEYS.SESSION_ID, sessionId);
      saveState(COOKIE_KEYS.FLOW_STEP, "fetching_data");

      const loaded = await pollSessionForData(sessionId, approvedConsentId);
      if (loaded) {
        fetchingRef.current = false;
        return;
      }

      throw new Error(
        "The linked financial institution (FIP) is temporarily unavailable. " +
        "This is common in sandbox environments. Please ensure you link " +
        "accounts from an available FIP (e.g., Setu FIP) during consent approval, " +
        "and try again later."
      );
    } catch (err: any) {
      setError(err.message || "Failed to fetch financial data");
      setStep("error");
      saveState(COOKIE_KEYS.FLOW_STEP, "error");
      fetchingRef.current = false;
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep("form");
    setConsentId(null);
    setConsentUrl(null);
    setFiData(null);
    setError(null);
    fetchingRef.current = false;
    clearAllState();
  }, []);

  return (
    <DashboardPageLayout
      header={{
        title: "Financial Data",
        description: "Fetch your financial data via Account Aggregator",
        icon: Landmark,
      }}
    >
      <div className="max-w-4xl mx-auto py-2">
        {/* Step: Form */}
        {step === "form" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8">
            <ConsentForm onConsentCreated={handleConsentCreated} />
          </div>
        )}

        {/* Step: Consent Pending */}
        {step === "consent_pending" && consentId && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8">
            <ConsentStatusTracker
              consentId={consentId}
              consentUrl={consentUrl || ""}
              onConsentApproved={handleConsentApproved}
              onError={(err) => {
                setError(err);
                setStep("error");
              }}
            />
          </div>
        )}

        {/* Step: Fetching Data */}
        {step === "fetching_data" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              Fetching Your Financial Data
            </h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we securely retrieve your financial information
              from your linked accounts...
            </p>
          </div>
        )}

        {/* Step: Data Loaded */}
        {step === "data_loaded" && fiData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your Financial Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Data fetched via Account Aggregator
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>
            <FinancialSummary data={fiData} />
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="bg-card/50 rounded-2xl border border-border/40 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {error || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}

export default function FinancialDataPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageLayout
          header={{
            title: "Financial Data",
            description: "Fetch your financial data via Account Aggregator",
            icon: Landmark,
          }}
        >
          <div className="max-w-4xl mx-auto py-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground tracking-wide">
              Initializing Financial Dashboard...
            </p>
          </div>
        </DashboardPageLayout>
      }
    >
      <FinancialDataContent />
    </Suspense>
  );
}
