"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ── Types ────────────────────────────────────────────────────

interface ProfileData {
  name: string;
  age: number;
  city: string;
  dependents: number;
  annual_income: number;
  monthly_expenses: number;
  home_loan_emi: number;
  car_loan_emi: number;
  other_emi: number;
  existing_mf: number;
  existing_ppf: number;
  existing_nps: number;
  existing_epf: number;
  existing_fd: number;
  existing_savings: number;
  current_sip: number;
  primary_goal: string;
  target_retirement_age: number;
  target_monthly_draw: number;
  risk_appetite: string;
  investment_horizon_years: number;
  has_term_insurance: boolean;
  term_cover_amount: number;
  has_health_insurance: boolean;
  health_cover_amount: number;
  annual_hra_received: number;
  annual_rent_paid: number;
  is_metro_city: boolean;
  home_loan_interest_annually: number;
}

const EMPTY_PROFILE: ProfileData = {
  name: "", age: 30, city: "", dependents: 0,
  annual_income: 0, monthly_expenses: 0, home_loan_emi: 0,
  car_loan_emi: 0, other_emi: 0,
  existing_mf: 0, existing_ppf: 0, existing_nps: 0,
  existing_epf: 0, existing_fd: 0, existing_savings: 0, current_sip: 0,
  primary_goal: "FIRE", target_retirement_age: 60, target_monthly_draw: 0,
  risk_appetite: "moderate", investment_horizon_years: 10,
  has_term_insurance: false, term_cover_amount: 0,
  has_health_insurance: false, health_cover_amount: 0,
  annual_hra_received: 0, annual_rent_paid: 0,
  is_metro_city: true, home_loan_interest_annually: 0,
};

const GOALS = [
  { value: "FIRE", label: "FIRE / Early Retirement" },
  { value: "child_education", label: "Child Education" },
  { value: "home_purchase", label: "Home Purchase" },
  { value: "wealth_building", label: "Wealth Building" },
  { value: "retirement", label: "Retirement" },
  { value: "custom", label: "Custom Goal" },
];

// ── Helpers ──────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

// ── Component ────────────────────────────────────────────────

export function EditProfileDialog() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"personal" | "financial" | "goals" | "insurance">("personal");

  // Load profile when dialog opens
  useEffect(() => {
    if (!open) return;
    const userId = localStorage.getItem("advisor_user_id");
    if (!userId) return;

    setLoading(true);
    fetch(`/api/advisor/plan?user_id=${userId}`)
      .then(() =>
        fetch(`/api/advisor/user?clerk_id=_load_profile_${userId}`)
          .catch(() => null)
      )
      .catch(() => null);

    // Fetch profile directly from backend
    const backendUrl = process.env.NEXT_PUBLIC_ADVISOR_BACKEND_URL || "";
    fetch(`/api/advisor/profile?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile({ ...EMPTY_PROFILE, ...data.profile });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const update = useCallback((name: string, value: string | number | boolean) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    const userId = localStorage.getItem("advisor_user_id");
    if (!userId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/advisor/profile?user_id=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: profile }),
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        // Trigger plan regeneration
        const planForm = new FormData();
        planForm.append("user_id", userId);
        fetch("/api/advisor/plan/regenerate", { method: "POST", body: planForm })
          .then(() => window.location.reload())
          .catch(() => {});
      }
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "personal" as const, label: "Personal" },
    { key: "financial" as const, label: "Financial" },
    { key: "goals" as const, label: "Goals" },
    { key: "insurance" as const, label: "Insurance" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Edit Profile">
            <Settings2 className="size-5" />
            <span>Edit Profile</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Financial Profile</DialogTitle>
          <DialogDescription>
            Update your information. Changes will trigger a plan regeneration.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Tab strip */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    tab === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3 mt-2">
              {tab === "personal" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name">
                      <input className={inputCls} value={profile.name} onChange={(e) => update("name", e.target.value)} />
                    </Field>
                    <Field label="Age">
                      <input className={inputCls} type="number" value={profile.age} onChange={(e) => update("age", Number(e.target.value))} />
                    </Field>
                    <Field label="City">
                      <input className={inputCls} value={profile.city} onChange={(e) => update("city", e.target.value)} />
                    </Field>
                    <Field label="Dependents">
                      <input className={inputCls} type="number" value={profile.dependents} onChange={(e) => update("dependents", Number(e.target.value))} />
                    </Field>
                  </div>
                  <Field label="">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={profile.is_metro_city} onChange={(e) => update("is_metro_city", e.target.checked)} className="rounded" />
                      Metro city (Delhi/Mumbai/Kolkata/Chennai)
                    </label>
                  </Field>
                </>
              )}

              {tab === "financial" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Annual Income (₹)">
                    <input className={inputCls} type="number" value={profile.annual_income} onChange={(e) => update("annual_income", Number(e.target.value))} />
                  </Field>
                  <Field label="Monthly Expenses (₹)">
                    <input className={inputCls} type="number" value={profile.monthly_expenses} onChange={(e) => update("monthly_expenses", Number(e.target.value))} />
                  </Field>
                  <Field label="Home Loan EMI (₹)">
                    <input className={inputCls} type="number" value={profile.home_loan_emi} onChange={(e) => update("home_loan_emi", Number(e.target.value))} />
                  </Field>
                  <Field label="Car Loan EMI (₹)">
                    <input className={inputCls} type="number" value={profile.car_loan_emi} onChange={(e) => update("car_loan_emi", Number(e.target.value))} />
                  </Field>
                  <Field label="Other EMIs (₹)">
                    <input className={inputCls} type="number" value={profile.other_emi} onChange={(e) => update("other_emi", Number(e.target.value))} />
                  </Field>
                  <Field label="Annual HRA (₹)">
                    <input className={inputCls} type="number" value={profile.annual_hra_received} onChange={(e) => update("annual_hra_received", Number(e.target.value))} />
                  </Field>
                  <Field label="Annual Rent Paid (₹)">
                    <input className={inputCls} type="number" value={profile.annual_rent_paid} onChange={(e) => update("annual_rent_paid", Number(e.target.value))} />
                  </Field>
                  <Field label="Home Loan Interest/yr (₹)">
                    <input className={inputCls} type="number" value={profile.home_loan_interest_annually} onChange={(e) => update("home_loan_interest_annually", Number(e.target.value))} />
                  </Field>
                  <div className="col-span-2 border-t border-border/30 my-1" />
                  <Field label="Mutual Funds (₹)">
                    <input className={inputCls} type="number" value={profile.existing_mf} onChange={(e) => update("existing_mf", Number(e.target.value))} />
                  </Field>
                  <Field label="PPF Balance (₹)">
                    <input className={inputCls} type="number" value={profile.existing_ppf} onChange={(e) => update("existing_ppf", Number(e.target.value))} />
                  </Field>
                  <Field label="NPS Balance (₹)">
                    <input className={inputCls} type="number" value={profile.existing_nps} onChange={(e) => update("existing_nps", Number(e.target.value))} />
                  </Field>
                  <Field label="EPF Balance (₹)">
                    <input className={inputCls} type="number" value={profile.existing_epf} onChange={(e) => update("existing_epf", Number(e.target.value))} />
                  </Field>
                  <Field label="Fixed Deposits (₹)">
                    <input className={inputCls} type="number" value={profile.existing_fd} onChange={(e) => update("existing_fd", Number(e.target.value))} />
                  </Field>
                  <Field label="Savings Account (₹)">
                    <input className={inputCls} type="number" value={profile.existing_savings} onChange={(e) => update("existing_savings", Number(e.target.value))} />
                  </Field>
                  <Field label="Current SIP (₹/month)">
                    <input className={inputCls} type="number" value={profile.current_sip} onChange={(e) => update("current_sip", Number(e.target.value))} />
                  </Field>
                </div>
              )}

              {tab === "goals" && (
                <div className="space-y-3">
                  <Field label="Primary Goal">
                    <select
                      className={inputCls}
                      value={profile.primary_goal}
                      onChange={(e) => update("primary_goal", e.target.value)}
                    >
                      {GOALS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Target Retirement Age">
                      <input className={inputCls} type="number" value={profile.target_retirement_age} onChange={(e) => update("target_retirement_age", Number(e.target.value))} />
                    </Field>
                    <Field label="Target Monthly Draw (₹)">
                      <input className={inputCls} type="number" value={profile.target_monthly_draw} onChange={(e) => update("target_monthly_draw", Number(e.target.value))} />
                    </Field>
                    <Field label="Investment Horizon (years)">
                      <input className={inputCls} type="number" value={profile.investment_horizon_years} onChange={(e) => update("investment_horizon_years", Number(e.target.value))} />
                    </Field>
                  </div>
                  <Field label="Risk Appetite">
                    <div className="grid grid-cols-3 gap-2">
                      {["conservative", "moderate", "aggressive"].map((r) => (
                        <button
                          key={r}
                          onClick={() => update("risk_appetite", r)}
                          className={`rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                            profile.risk_appetite === r
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {tab === "insurance" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={profile.has_term_insurance}
                        onChange={(e) => update("has_term_insurance", e.target.checked)}
                        className="rounded"
                      />
                      Term Life Insurance
                    </label>
                    {profile.has_term_insurance && (
                      <Field label="Cover Amount (₹)">
                        <input className={inputCls} type="number" value={profile.term_cover_amount} onChange={(e) => update("term_cover_amount", Number(e.target.value))} />
                      </Field>
                    )}
                  </div>
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={profile.has_health_insurance}
                        onChange={(e) => update("has_health_insurance", e.target.checked)}
                        className="rounded"
                      />
                      Health Insurance
                    </label>
                    {profile.has_health_insurance && (
                      <Field label="Cover Amount (₹)">
                        <input className={inputCls} type="number" value={profile.health_cover_amount} onChange={(e) => update("health_cover_amount", Number(e.target.value))} />
                      </Field>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground
              hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving & Regenerating..." : "Save & Update Plan"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
