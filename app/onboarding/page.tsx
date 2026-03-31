"use client";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  User,
  Wallet,
  PiggyBank,
  Upload,
  Target,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileUp,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import ConsentForm from "@/components/financial/consent-form";
import ConsentStatusTracker from "@/components/financial/consent-status";
import FinancialSummary from "@/components/financial/financial-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z
  .object({
    // Step 1: Personal & Goals
    name: z.string().min(2, "Name must be at least 2 characters."),
    age: z.coerce.number().min(18, "Must be at least 18.").max(100),
    city: z.string().min(1, "City is required."),
    dependents: z.coerce.number().min(0, "Cannot be negative."),
    primary_goal: z.string().min(1, "Please select a goal."),
    target_retirement_age: z.coerce
      .number()
      .min(18, "Minimum 18.")
      .max(100, "Maximum 100."),
    target_monthly_draw: z.coerce.number().min(1, "Must be greater than 0."),
    risk_appetite: z.string().min(1, "Please select risk appetite."),
    investment_horizon_years: z.coerce
      .number()
      .min(1, "Min 1 year.")
      .max(50, "Max 50 years."),

    // Step 2: Income & Tax
    annual_income: z.coerce.number().min(0),
    annual_hra_received: z.coerce.number().min(0),
    annual_rent_paid: z.coerce.number().min(0),
    is_metro_city: z.boolean().default(true),
    existing_ppf: z.coerce.number().min(0),
    existing_epf: z.coerce.number().min(0),
    existing_nps: z.coerce.number().min(0),
    home_loan_interest_annually: z.coerce.number().min(0),

    // Step 3: Assets (Manual Fallback)
    existing_mf: z.coerce.number().min(0),
    existing_fd: z.coerce.number().min(0),
    existing_savings: z.coerce.number().min(0),
    current_sip: z.coerce.number().min(0),

    // Step 4: Liabilities & Expenses
    monthly_expenses: z.coerce.number().min(0),
    home_loan_emi: z.coerce.number().min(0),
    car_loan_emi: z.coerce.number().min(0),
    other_emi: z.coerce.number().min(0),
    has_term_insurance: z.boolean().default(false),
    term_cover_amount: z.coerce.number().min(0),
    has_health_insurance: z.boolean().default(false),
    health_cover_amount: z.coerce.number().min(0),
  })
  .refine((data) => data.target_retirement_age > data.age, {
    message: "Retirement age must be greater than current age",
    path: ["target_retirement_age"],
  });

type FormData = z.infer<typeof formSchema>;

const INITIAL_DATA: FormData = {
  name: "",
  age: 30,
  city: "India",
  dependents: 0,
  primary_goal: "FIRE",
  target_retirement_age: 60,
  target_monthly_draw: 0,
  risk_appetite: "moderate",
  investment_horizon_years: 10,

  annual_income: 0,
  annual_hra_received: 0,
  annual_rent_paid: 0,
  is_metro_city: true,
  existing_ppf: 0,
  existing_epf: 0,
  existing_nps: 0,
  home_loan_interest_annually: 0,

  existing_mf: 0,
  existing_fd: 0,
  existing_savings: 0,
  current_sip: 0,

  monthly_expenses: 0,
  home_loan_emi: 0,
  car_loan_emi: 0,
  other_emi: 0,
  has_term_insurance: false,
  term_cover_amount: 0,
  has_health_insurance: false,
  health_cover_amount: 0,
};

const STEP_FIELDS: (keyof FormData)[][] = [
  [
    "name",
    "age",
    "city",
    "dependents",
    "primary_goal",
    "target_retirement_age",
    "target_monthly_draw",
    "risk_appetite",
    "investment_horizon_years",
  ],
  [
    "annual_income",
    "annual_hra_received",
    "annual_rent_paid",
    "is_metro_city",
    "existing_ppf",
    "existing_epf",
    "existing_nps",
    "home_loan_interest_annually",
  ],
  ["existing_mf", "existing_fd", "existing_savings", "current_sip"],
  [
    "monthly_expenses",
    "home_loan_emi",
    "car_loan_emi",
    "other_emi",
    "has_term_insurance",
    "term_cover_amount",
    "has_health_insurance",
    "health_cover_amount",
  ],
];

const STEPS = [
  { title: "Personal & Goals", icon: Target },
  { title: "Income & Tax", icon: Wallet },
  { title: "Assets", icon: PiggyBank },
  { title: "Liabilities & Risk", icon: Shield },
  { title: "Review & Submit", icon: CheckCircle2 },
];

const GOALS = [
  { value: "FIRE", label: "Financial Independence / Early Retirement" },
  { value: "child_education", label: "Child Education Fund" },
  { value: "home_purchase", label: "Home Purchase" },
  { value: "wealth_building", label: "Wealth Building" },
  { value: "retirement", label: "Standard Retirement" },
  { value: "custom", label: "Custom Goal" },
];

const RISK_OPTIONS = [
  {
    value: "conservative",
    label: "Conservative",
    desc: "Prefer stability, accept lower returns",
  },
  { value: "moderate", label: "Moderate", desc: "Balanced risk and returns" },
  {
    value: "aggressive",
    label: "Aggressive",
    desc: "Higher risk for higher returns",
  },
];

// ── Helpers ──────────────────────────────────────────────────

function formatINR(val: number) {
  if (!val) return "₹0";
  return `₹${val.toLocaleString("en-IN")}`;
}

function InputWrapper({
  label,
  name,
  prefix,
  suffix,
  placeholder,
  type = "text",
  min,
  max,
  form,
}: {
  label: string;
  name: keyof FormData;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  form: any;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-medium text-muted-foreground/80">
            {label}
          </FormLabel>
          <div className="relative group">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                {prefix}
              </span>
            )}
            <FormControl>
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                min={min}
                max={max}
                className={cn(
                  "h-11 bg-muted/30 border-border/50 focus-visible:ring-primary/20",
                  prefix && "pl-8",
                  suffix && "pr-12",
                )}
                onChange={(e) => {
                  const val =
                    type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value;
                  field.onChange(val);
                }}
              />
            </FormControl>
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                {suffix}
              </span>
            )}
          </div>
          <FormMessage className="text-[10px] text-destructive" />
        </FormItem>
      )}
    />
  );
}

// ── Main Component ───────────────────────────────────────────

function OnboardingPageContent() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL_DATA,
    mode: "onChange",
    shouldUnregister: false,
  });

  const data = form.watch();

  const [assetTab, setAssetTab] = useState<"setu" | "cas" | "manual">("setu");
  const [casUploading, setCasUploading] = useState(false);
  const [casResult, setCasResult] = useState<any>(null);

  // SETU-specific flow state
  const [setuFlowStep, setSetuFlowStep] = useState<
    "form" | "consent_pending" | "fetching_data" | "data_loaded" | "error"
  >("form");
  const [setuConsentId, setSetuConsentId] = useState<string | null>(null);
  const [setuConsentUrl, setSetuConsentUrl] = useState<string | null>(null);
  const [setuFiData, setSetuFiData] = useState<any[] | null>(null);
  const [setuError, setSetuError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // ── Initialization Logic (Storage + Clerk) ──
  useEffect(() => {
    if (!isLoaded || !user || isInitialized) return;

    const initialize = async () => {
      // 1. Try loading from localStorage first
      const savedData = localStorage.getItem("onboarding_form_data");
      const savedStep = localStorage.getItem("onboarding_step");
      const savedAssetTab = localStorage.getItem("onboarding_asset_tab");
      const savedCasResult = localStorage.getItem("onboarding_cas_result");
      const savedSetuResult = localStorage.getItem("onboarding_setu_result");

      // Load SETU flow state from storage if it exists
      const storedSetuFlow = localStorage.getItem("onboarding_setu_flow_step");
      const storedSetuConsentId = localStorage.getItem(
        "onboarding_setu_consent_id",
      );
      const storedSetuConsentUrl = localStorage.getItem(
        "onboarding_setu_consent_url",
      );

      // Check for SETU redirect back
      const consentStatus = searchParams.get("consent_status");
      const setuSuccess = searchParams.get("success");
      const setuConsentIdParam = searchParams.get("id");
      const isConsentRedirect =
        consentStatus === "success" || setuSuccess === "true";
      const effectiveConsentId = setuConsentIdParam || storedSetuConsentId;

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          form.reset({ ...INITIAL_DATA, ...parsed });
        } catch (e) {}
      }
      if (savedStep) setStep(parseInt(savedStep, 10));
      if (savedAssetTab)
        setAssetTab(savedAssetTab as "setu" | "cas" | "manual");

      if (savedCasResult) {
        try {
          setCasResult(JSON.parse(savedCasResult));
        } catch (e) {}
      }

      // Restore SETU flow state
      if (isConsentRedirect && effectiveConsentId) {
        setSetuConsentId(effectiveConsentId);
        setSetuConsentUrl(storedSetuConsentUrl);
        setSetuFlowStep("consent_pending");
        if (!storedSetuConsentId && setuConsentIdParam) {
          localStorage.setItem(
            "onboarding_setu_consent_id",
            setuConsentIdParam,
          );
        }
        // Clear query params
        const url = new URL(window.location.href);
        url.searchParams.delete("consent_status");
        url.searchParams.delete("success");
        url.searchParams.delete("id");
        window.history.replaceState({}, "", url.pathname + (url.search || ""));
      } else if (storedSetuFlow) {
        setSetuFlowStep(storedSetuFlow as any);
        setSetuConsentId(storedSetuConsentId);
        setSetuConsentUrl(storedSetuConsentUrl);
      }

      if (savedSetuResult) {
        try {
          const parsedFi = JSON.parse(savedSetuResult);
          if (Array.isArray(parsedFi)) {
            setSetuFiData(parsedFi);
            setSetuFlowStep("data_loaded");
          }
        } catch (e) {}
      }

      // 2. Clerk Gate & User Check
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
        const apiData = await res.json();

        if (apiData.found && apiData.user_id) {
          localStorage.setItem("advisor_user_id", apiData.user_id);
        }

        if (apiData.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        // Continue even if backend is down
      }

      // 3. Final Default (Clerk Pre-fill) only if still empty after storage
      if (!form.getValues("name")) {
        form.setValue(
          "name",
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        );
      }

      setIsInitialized(true);
      setChecking(false);
    };

    initialize();
  }, [isLoaded, user, form, isInitialized, router, searchParams]);

  // ── Sync Persistence (Watchers) ──
  useEffect(() => {
    if (!isInitialized) return;
    const subscription = form.watch((value) => {
      localStorage.setItem("onboarding_form_data", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("onboarding_step", step.toString());
  }, [step, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("onboarding_asset_tab", assetTab);
  }, [assetTab, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !casResult) return;
    localStorage.setItem("onboarding_cas_result", JSON.stringify(casResult));
  }, [casResult, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("onboarding_setu_flow_step", setuFlowStep);
    if (setuConsentId)
      localStorage.setItem("onboarding_setu_consent_id", setuConsentId);
    if (setuConsentUrl)
      localStorage.setItem("onboarding_setu_consent_url", setuConsentUrl);
  }, [setuFlowStep, setuConsentId, setuConsentUrl, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !setuFiData) return;
    localStorage.setItem("onboarding_setu_result", JSON.stringify(setuFiData));
  }, [setuFiData, isInitialized]);

  // ── Extract Setu data and populate form fields ──
  useEffect(() => {
    if (!setuFiData || !Array.isArray(setuFiData) || setuFiData.length === 0)
      return;

    // Normalize and aggregate values by type
    let totalMutualFunds = 0;
    let totalDeposits = 0; // FD + RD
    let totalSavings = 0; // Savings/current accounts
    let totalInsurance = 0;

    for (const fipData of setuFiData) {
      const accounts =
        fipData?.data || fipData?.accounts || fipData?.Accounts || [];
      if (!Array.isArray(accounts)) continue;

      for (const rawAccount of accounts) {
        const accountData =
          rawAccount?.data?.account || rawAccount?.account || rawAccount;
        const accountType = (
          accountData?.type ||
          rawAccount?.fiType ||
          ""
        ).toLowerCase();
        const summary = accountData?.summary || accountData?.Summary || {};

        // Skip failed accounts
        if (rawAccount?.maskedAccNumber?.includes("FAILURE")) continue;

        // Extract primary value based on account type
        let value = 0;
        if (accountType.includes("insurance")) {
          value =
            parseFloat(summary?.sumAssured || summary?.coverAmount || "0") || 0;
          totalInsurance += value;
        } else if (accountType === "mutual_funds") {
          value = parseFloat(summary?.currentValue || "0") || 0;
          totalMutualFunds += value;
        } else if (
          accountType === "term_deposit" ||
          accountType === "recurring_deposit"
        ) {
          value =
            parseFloat(
              summary?.currentValue ||
                summary?.maturityAmount ||
                summary?.principalAmount ||
                "0",
            ) || 0;
          totalDeposits += value;
        } else if (accountType === "deposit") {
          value =
            parseFloat(
              summary?.currentValue || summary?.currentBalance || "0",
            ) || 0;
          totalSavings += value;
        }
      }
    }

    // Populate form fields with extracted values
    if (totalMutualFunds > 0) {
      form.setValue("existing_mf", totalMutualFunds);
    }
    if (totalDeposits > 0) {
      form.setValue("existing_fd", totalDeposits);
    }
    if (totalSavings > 0) {
      form.setValue("existing_savings", totalSavings);
    }
  }, [setuFiData, form]);

  // ── SETU Flow Handlers ──
  const handleSetuConsentCreated = useCallback((id: string, url: string) => {
    setSetuConsentId(id);
    setSetuConsentUrl(url);
    setSetuFlowStep("consent_pending");
  }, []);

  const pollSessionForData = async (
    sessionId: string,
    consentId: string,
    maxPolls: number = 10,
    interval: number = 5000,
  ): Promise<boolean> => {
    for (let poll = 0; poll < maxPolls; poll++) {
      if (poll > 0)
        await new Promise((resolve) => setTimeout(resolve, interval));
      const res = await fetch(`/api/setu/data?sessionId=${sessionId}`);
      const data = await res.json();
      if (
        (data.status === "COMPLETED" || data.status === "PARTIAL") &&
        data.payload &&
        Array.isArray(data.payload)
      ) {
        setSetuFiData(data.payload);
        setSetuFlowStep("data_loaded");
        return true;
      }
      if (data.status === "FAILED") return false;
    }
    return false;
  };

  const handleSetuConsentApproved = useCallback(async (consId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setSetuFlowStep("fetching_data");
    try {
      const res = await fetch("/api/setu/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId: consId }),
      });
      const data = await res.json();
      if (res.ok && data.sessionId) {
        await pollSessionForData(data.sessionId, consId);
      } else {
        throw new Error(data.error || "Failed session");
      }
    } catch (err: any) {
      setSetuError(err.message);
      setSetuFlowStep("error");
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const handleSetuReset = useCallback(() => {
    setSetuFlowStep("form");
    setSetuConsentId(null);
    setSetuConsentUrl(null);
    setSetuFiData(null);
    setSetuError(null);
    localStorage.removeItem("onboarding_setu_flow_step");
    localStorage.removeItem("onboarding_setu_consent_id");
    localStorage.removeItem("onboarding_setu_consent_url");
    localStorage.removeItem("onboarding_setu_result");
  }, []);

  const update = useCallback(
    (name: any, value: any) => {
      form.setValue(name, value);
    },
    [form],
  );

  // ── CAS Upload Handler ──
  const handleCASUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ask for password
    const password = window.prompt(
      "Enter your CAS PDF password (usually your PAN in ALL CAPS):",
    );
    if (!password) {
      alert("Password is required to parse the CAS PDF.");
      return;
    }

    setCasUploading(true);
    setCasResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);
    formData.append(
      "user_id",
      localStorage.getItem("advisor_user_id") || "temp",
    );

    try {
      const res = await fetch("/api/advisor/parse-cas", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (resData.success) {
        setCasResult(resData.data);
      } else {
        alert(resData.detail || "Failed to parse CAS. Check password.");
      }
    } catch (err) {
      alert("Network error. Could not upload CAS.");
    } finally {
      setCasUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  // ── Submission Handler ──
  const handleSubmit = async (values: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        clerk_user_id: user.id,
        ...values,
        asset_tab: assetTab,
        cas_data: casResult,
        setu_data: setuFiData,
      };

      const res = await fetch("/api/advisor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok) {
        localStorage.setItem("advisor_user_id", responseData.user_id);

        // Clean up all onboarding persistence
        localStorage.removeItem("onboarding_form_data");
        localStorage.removeItem("onboarding_step");
        localStorage.removeItem("onboarding_asset_tab");
        localStorage.removeItem("onboarding_cas_result");
        localStorage.removeItem("onboarding_setu_result");
        localStorage.removeItem("onboarding_setu_flow_step");
        localStorage.removeItem("onboarding_setu_consent_id");
        localStorage.removeItem("onboarding_setu_consent_url");

        // Let the backend start building the first plan asynchronously
        fetch(`/api/advisor/plan/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: responseData.user_id }),
        }).catch(() => null);

        router.push("/dashboard");
      } else {
        alert("Verification failed. Please try again.");
      }
    } catch (error) {
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Personal & Goals
        return (
          <div
            key="step-0"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputWrapper
                key="name"
                label="Full Name"
                name="name"
                form={form}
                placeholder="John Doe"
              />
              <InputWrapper
                key="age"
                label="Current Age"
                name="age"
                form={form}
                type="number"
                min={18}
                max={100}
                suffix="yrs"
              />
              <InputWrapper
                key="city"
                label="City"
                name="city"
                form={form}
                placeholder="Mumbai"
              />
              <InputWrapper
                key="dependents"
                label="Dependents"
                name="dependents"
                form={form}
                type="number"
                min={0}
                placeholder="0"
              />
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Primary Financial Goal
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const isSelected = data.primary_goal === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() =>
                        form.setValue("primary_goal", g.value, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "rounded-xl border px-5 py-4 text-left text-sm transition-all duration-200 group relative overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                          : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 p-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium transition-colors",
                          isSelected ? "text-primary" : "text-foreground/70",
                        )}
                      >
                        {g.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputWrapper
                key="target_retirement_age"
                label="Target Retirement Age"
                name="target_retirement_age"
                form={form}
                type="number"
                min={data.age + 1}
                max={75}
                suffix="years"
              />
              <InputWrapper
                key="target_monthly_draw"
                label="Target Monthly Draw"
                name="target_monthly_draw"
                form={form}
                type="number"
                prefix="₹"
                suffix="/mo"
              />
              <InputWrapper
                key="investment_horizon_years"
                label="Investment Horizon"
                name="investment_horizon_years"
                form={form}
                type="number"
                min={1}
                max={40}
                suffix="yrs"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Risk Appetite
              </Label>
              <RadioGroup
                value={data.risk_appetite}
                onValueChange={(val) =>
                  form.setValue("risk_appetite", val, {
                    shouldValidate: true,
                  })
                }
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {RISK_OPTIONS.map((r) => (
                  <div key={r.value}>
                    <RadioGroupItem
                      value={r.value}
                      id={r.value}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={r.value}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl border p-4 cursor-pointer transition-all duration-200 h-full",
                        data.risk_appetite === r.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 hover:border-primary/30 hover:bg-muted/30",
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          data.risk_appetite === r.value
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {r.desc}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 1: // Income & Tax
        return (
          <div
            key="step-1"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <InputWrapper
                key="annual_income"
                label="Gross Annual Salary"
                name="annual_income"
                form={form}
                type="number"
                prefix="₹"
              />
              <InputWrapper
                key="annual_hra_received"
                label="Annual HRA Received"
                name="annual_hra_received"
                form={form}
                type="number"
                prefix="₹"
              />
              <InputWrapper
                key="annual_rent_paid"
                label="Annual Rent Paid"
                name="annual_rent_paid"
                form={form}
                type="number"
                prefix="₹"
              />
              <div className="flex flex-col justify-center">
                <Label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 cursor-pointer transition-colors hover:bg-muted/30">
                  <Input
                    type="checkbox"
                    checked={data.is_metro_city}
                    onChange={(e) =>
                      form.setValue("is_metro_city", e.target.checked, {
                        shouldValidate: true,
                      })
                    }
                    className="rounded border-border w-4 h-4 text-primary focus:ring-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      Metro City Resident
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Higher HRA tax exemption (50% vs 40%)
                    </span>
                  </div>
                </Label>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">
                  Tax Savings (Section 80C / 24)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputWrapper
                  key="existing_ppf"
                  label="Current PPF Balance"
                  name="existing_ppf"
                  form={form}
                  type="number"
                  prefix="₹"
                />
                <InputWrapper
                  key="existing_epf"
                  label="Current EPF Balance"
                  name="existing_epf"
                  form={form}
                  type="number"
                  prefix="₹"
                />
                <InputWrapper
                  key="existing_nps"
                  label="Current NPS Balance"
                  name="existing_nps"
                  form={form}
                  type="number"
                  prefix="₹"
                />
                <InputWrapper
                  key="home_loan_interest_annually"
                  label="Home Loan Interest (Annual)"
                  name="home_loan_interest_annually"
                  form={form}
                  type="number"
                  prefix="₹"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Assets (Three paths)
        return (
          <div
            key="step-2"
            className="space-y-6 animate-in fade-in duration-500"
          >
            <Tabs
              value={assetTab}
              onValueChange={(val: any) => setAssetTab(val)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger
                  value="setu"
                  className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-accent font-bold"
                >
                  SETU (Auto Fetching)
                </TabsTrigger>
                {/* <TabsTrigger
                  value="cas"
                  className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-accent"
                >
                  CAS PDF
                </TabsTrigger> */}
                <TabsTrigger
                  value="manual"
                  className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-accent"
                >
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setu" className="mt-8">
                {setuFlowStep === "form" && (
                  <div className="bg-card/30 rounded-2xl border-2 border-border/40 p-10">
                    <ConsentForm onConsentCreated={handleSetuConsentCreated} />
                  </div>
                )}

                {setuFlowStep === "consent_pending" && setuConsentId && (
                  <div className="bg-card/30 rounded-2xl border-2 border-border/40 p-10">
                    <ConsentStatusTracker
                      consentId={setuConsentId}
                      consentUrl={setuConsentUrl || ""}
                      onConsentApproved={handleSetuConsentApproved}
                      onError={setSetuError}
                    />
                  </div>
                )}

                {setuFlowStep === "fetching_data" && (
                  <div className="bg-card/30 rounded-2xl border-2 border-border/40 p-16 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-3 font-display">
                      Connecting Your Assets
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Securely retrieving your portfolio from linked accounts...
                    </p>
                  </div>
                )}

                {setuFlowStep === "data_loaded" && setuFiData && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">
                            Accounts Linked Successfully
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Your portfolio overview is ready
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSetuReset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/10 transition-all text-emerald-600 uppercase tracking-widest"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-Link Accounts
                      </button>
                    </div>
                    <FinancialSummary data={setuFiData} />
                  </div>
                )}

                {setuFlowStep === "error" && (
                  <div className="bg-card/30 rounded-2xl border-2 border-border/40 p-12 text-center">
                    <div className="p-4 bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                      <RotateCcw className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Connection Error</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                      {setuError || "Failed to link accounts."}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleSetuReset}
                      className="rounded-xl px-8"
                    >
                      Try Linking Again
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cas" className="mt-8">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm border-2">
                  <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                      <FileUp className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-xl">
                        Import CAMS/KFintech Statement
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Upload your Consolidated Account Statement (CAS) PDF to
                        automatically parse all your mutual fund holdings.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleCASUpload}
                        id="cas-upload"
                        className="hidden"
                        disabled={casUploading}
                      />
                      <Button
                        asChild
                        size="lg"
                        disabled={casUploading}
                        className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                      >
                        <label
                          htmlFor="cas-upload"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          {casUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {casUploading
                            ? "Parsing Statement..."
                            : "Select CAS PDF"}
                        </label>
                      </Button>
                    </div>

                    {casResult && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-500 animate-in zoom-in-95">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Parsed {casResult.fund_count} schemes (
                        {formatINR(casResult.total_mf_value)})
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manual" className="mt-8">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm border-2">
                  <CardContent className="py-8 space-y-8">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Automatic options are more accurate, but you can
                        manually enter balances below if preferred.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputWrapper
                        key="existing_mf"
                        label="Mutual Funds & Equity"
                        name="existing_mf"
                        form={form}
                        type="number"
                        prefix="₹"
                      />
                      <InputWrapper
                        key="existing_fd"
                        label="Fixed Deposits / Bonds"
                        name="existing_fd"
                        form={form}
                        type="number"
                        prefix="₹"
                      />
                      <InputWrapper
                        key="existing_savings"
                        label="Savings & Cash"
                        name="existing_savings"
                        form={form}
                        type="number"
                        prefix="₹"
                      />
                      <InputWrapper
                        key="current_sip"
                        label="Current Monthly SIP"
                        name="current_sip"
                        form={form}
                        type="number"
                        prefix="₹"
                        suffix="/mo"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3: // Liabilities & Risk
        return (
          <div
            key="step-3"
            className="space-y-8 animate-in fade-in duration-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputWrapper
                key="monthly_expenses"
                label="Total Monthly Expenses"
                name="monthly_expenses"
                form={form}
                type="number"
                prefix="₹"
              />
              <InputWrapper
                key="home_loan_emi"
                label="Home Loan EMI"
                name="home_loan_emi"
                form={form}
                type="number"
                prefix="₹"
              />
              <InputWrapper
                key="car_loan_emi"
                label="Car Loan EMI"
                name="car_loan_emi"
                form={form}
                type="number"
                prefix="₹"
              />
              <InputWrapper
                key="other_emi"
                label="Other EMIs / Debt"
                name="other_emi"
                form={form}
                type="number"
                prefix="₹"
              />
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">
                  Insurance Portfolio
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card
                  className={cn(
                    "border-border/40 transition-all cursor-pointer hover:border-primary/30",
                    data.has_term_insurance && "border-primary/50 bg-primary/5",
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <Label
                      htmlFor="has-term"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Input
                        type="checkbox"
                        id="has-term"
                        checked={data.has_term_insurance}
                        onChange={(e) =>
                          form.setValue(
                            "has_term_insurance",
                            e.target.checked,
                            { shouldValidate: true },
                          )
                        }
                        className="rounded border-border w-5 h-5 text-primary focus:ring-primary/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          Term Life Cover
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Protection for your family
                        </span>
                      </div>
                    </Label>
                    {data.has_term_insurance && (
                      <div className="animate-in slide-in-from-top-2">
                        <InputWrapper
                          key="term_cover_amount"
                          label="Total Sum Assured"
                          name="term_cover_amount"
                          form={form}
                          type="number"
                          prefix="₹"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "border-border/40 transition-all cursor-pointer hover:border-primary/30",
                    data.has_health_insurance &&
                      "border-primary/50 bg-primary/5",
                  )}
                >
                  <CardContent className="p-5 space-y-4">
                    <Label
                      htmlFor="has-health"
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Input
                        type="checkbox"
                        id="has-health"
                        checked={data.has_health_insurance}
                        onChange={(e) =>
                          form.setValue(
                            "has_health_insurance",
                            e.target.checked,
                            { shouldValidate: true },
                          )
                        }
                        className="rounded border-border w-5 h-5 text-primary focus:ring-primary/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          Health Insurance
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Medical emergency cover
                        </span>
                      </div>
                    </Label>
                    {data.has_health_insurance && (
                      <div className="animate-in slide-in-from-top-2">
                        <InputWrapper
                          key="health_cover_amount"
                          label="Total Cover Amount"
                          name="health_cover_amount"
                          form={form}
                          type="number"
                          prefix="₹"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Profile & Goals",
                  icon: Target,
                  items: [
                    ["Name", data.name || "—"],
                    ["Age", `${data.age} yrs`],
                    [
                      "Goal",
                      GOALS.find(
                        (g) => g.value === data.primary_goal,
                      )?.label?.split(" / ")[0] || data.primary_goal,
                    ],
                    ["Target Draw", formatINR(data.target_monthly_draw)],
                  ],
                },
                {
                  title: "Tax & Income",
                  icon: Wallet,
                  items: [
                    ["Gross Salary", formatINR(data.annual_income)],
                    [
                      "80C Sav.",
                      formatINR(data.existing_ppf + data.existing_epf),
                    ],
                    ["NPS", formatINR(data.existing_nps)],
                    [
                      "HL Interest",
                      formatINR(data.home_loan_interest_annually),
                    ],
                  ],
                },
                {
                  title: "Expenses",
                  icon: Shield,
                  items: [
                    ["Monthly Exp.", formatINR(data.monthly_expenses)],
                    ["Home EMI", formatINR(data.home_loan_emi)],
                    [
                      "Car/Other",
                      formatINR(data.car_loan_emi + data.other_emi),
                    ],
                    [
                      "Term/Health",
                      data.has_term_insurance || data.has_health_insurance
                        ? "Active"
                        : "None",
                    ],
                  ],
                },
                {
                  title: "Data Source",
                  icon: PiggyBank,
                  items: [
                    [
                      "Asset Link",
                      setuFiData && setuFiData.length > 0
                        ? "SETU (Auto)"
                        : casResult
                          ? "CAS (PDF)"
                          : data.existing_mf > 0
                            ? "Manual"
                            : "None",
                    ],
                    ["Savings", formatINR(data.existing_savings)],
                    [
                      "Portfolio",
                      formatINR(data.existing_mf + data.existing_fd),
                    ],
                    ["Monthly SIP", formatINR(data.current_sip)],
                  ],
                },
              ].map((section) => (
                <Card
                  key={section.title}
                  className="bg-muted/30 border-border/40 shadow-sm transition-all hover:bg-muted/40"
                >
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                      <section.icon className="w-3.5 h-3.5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4">
                    {section.items.map(([label, val]) => (
                      <div
                        key={label}
                        className="flex justify-between text-sm border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">
                          {val}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-primary/20 bg-primary/5 border-2 mt-4">
              <CardContent className="p-4 flex items-center gap-4 text-sm text-primary">
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="font-medium">
                  Ready to build your FIRE plan? We'll use these insights to
                  generate a SEBI-compliant roadmap.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const handleNext = async () => {
    // Validate current step fields
    const fieldsToValidate = STEP_FIELDS[step];
    if (fieldsToValidate) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) {
        return;
      }
    }

    if (step < STEPS.length - 1) setStep(step + 1);
  };

  if (checking) {
    return (
      <div className="flex bg-background h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="bg-background flex">
      {/* Visual Left Sidebar */}
      <div className="hidden lg:flex w-[380px] xl:w-[450px] flex-col justify-between bg-card border-r border-border p-8 xl:p-12 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -translate-y-12 translate-x-12">
          <CurrentIcon className="w-96 h-96 blur-sm" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center w-full px-2">
            <Image
              src="/logo.png"
              alt="Everything Money"
              width={160}
              height={40}
              className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
            />
            {/* Small logo for collapsed state */}
            <div className="hidden group-data-[collapsible=icon]:flex size-8 items-center justify-center translate-x-[4px]">
              <Image
                src="/logo-small.png"
                alt="E"
                width={32}
                height={32}
                className="size-8 object-contain"
              />
            </div>
          </div>
          <div className="space-y-7 mt-8">
            {STEPS.map((s, idx) => {
              const active = idx === step;
              const past = idx < step;
              const StepIcon = s.icon;
              return (
                <div
                  key={s.title}
                  className={cn(
                    "flex items-center gap-5 transition-all duration-500",
                    active
                      ? "opacity-100 translate-x-2"
                      : past
                        ? "opacity-80 scale-95"
                        : "opacity-30 scale-90",
                  )}
                >
                  <div
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                        : past
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {past ? (
                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                    ) : (
                      <StepIcon className="w-5 h-5 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-sm ${active ? "text-foreground font-semibold" : "text-foreground font-medium"}`}
                    >
                      {s.title}
                    </h3>
                    {active && (
                      <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wider">
                        Current step
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground/60 leading-relaxed max-w-[320px]">
          Everything Money is a SEBI Compliant Investment Advisor. By
          continuing, you authorize us to securely analyze your data.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-background/50 selection:bg-primary/20">
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col justify-center min-h-max">
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center justify-center w-full px-2">
              <Image
                src="/logo.png"
                alt="Everything Money"
                width={160}
                height={40}
                className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
              />
              {/* Small logo for collapsed state */}
              <div className="hidden group-data-[collapsible=icon]:flex size-8 items-center justify-center translate-x-[4px]">
                <Image
                  src="/logo-small.png"
                  alt="E"
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CurrentIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 opacity-80">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h1 className="text-2xl font-bold font-display text-foreground leading-none">
                    {STEPS[step].title}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-primary/40" />
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
              {STEPS[step].title}
            </h1>
          </div>

          <div className="w-full">
            <Form {...form}>
              <form
                id="onboarding-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {renderStep()}
              </form>
            </Form>
          </div>

          {/* Navigation */}
          <div className="mt-14 flex items-center justify-between pt-8 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || loading}
              className={cn(
                "h-12 px-6 rounded-xl transition-all duration-300",
                step === 0 ? "opacity-0 pointer-events-none" : "opacity-100",
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              size="lg"
              onClick={
                step === STEPS.length - 1
                  ? form.handleSubmit(handleSubmit)
                  : handleNext
              }
              disabled={
                loading ||
                casUploading ||
                (step === 2 &&
                  assetTab === "setu" &&
                  (setuFlowStep === "consent_pending" ||
                    setuFlowStep === "fetching_data"))
              }
              className="h-12 px-10 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : step === STEPS.length - 1 ? (
                "Complete Setup"
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
