"use client";

import { useState } from "react";
import { Loader2, Smartphone, ArrowRight, ShieldCheck } from "lucide-react";

interface ConsentFormProps {
  onConsentCreated: (consentId: string, consentUrl: string) => void;
  redirectUrl?: string;
}

export default function ConsentForm({ onConsentCreated, redirectUrl }: ConsentFormProps) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^\d{10}$/.test(mobileNumber);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const finalRedirectUrl =
        redirectUrl ||
        `${window.location.origin}${window.location.pathname}?consent_status=success`;

      const res = await fetch("/api/setu/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, redirectUrl: finalRedirectUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create consent");
      }

      onConsentCreated(data.id, data.url);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Link Your Financial Accounts
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Securely fetch your financial data from banks, mutual funds, and
          demat accounts using India&apos;s Account Aggregator framework.
          Your data is always shared with your explicit consent.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label
            htmlFor="mobile-number"
            className="block text-sm font-medium mb-2"
          >
            Registered Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
              <span className="text-sm text-muted-foreground font-medium">
                +91
              </span>
            </div>
            <input
              id="mobile-number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit number"
              value={mobileNumber}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                setMobileNumber(cleaned);
                setError(null);
              }}
              className="w-full pl-22 pr-4 py-3 rounded-xl bg-card border border-border/60 text-sm font-display tracking-wider placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
          </div>
          {mobileNumber.length > 0 && !isValid && (
            <p className="text-xs text-destructive mt-1.5">
              Please enter a valid 10-digit mobile number
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e as any);
          }}
          disabled={!isValid || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Consent Request...
            </>
          ) : (
            <>
              Fetch Financial Data
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Trust badges */}
      <div className="mt-8 pt-6 border-t border-border/30">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "RBI Regulated", icon: "🏛️" },
            { label: "End-to-End Encrypted", icon: "🔒" },
            { label: "Consent-Based", icon: "✅" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="text-lg">{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
