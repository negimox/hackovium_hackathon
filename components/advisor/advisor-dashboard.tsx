"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  FileText,
  LucideMessageCircleWarning,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PlanKPICards from "@/components/advisor/plan-kpi-cards";
import TaxComparison from "@/components/advisor/tax-comparison";
import InsuranceGap from "@/components/advisor/insurance-gap";
import Recommendations from "@/components/advisor/recommendations";
import ChatPanel from "@/components/advisor/chat-panel";
import AssetAllocationChart from "@/components/advisor/asset-allocation-chart";
import MonthlyPlanCarousel from "@/components/advisor/monthly-plan-carousel";
import { useDashboardView } from "@/components/advisor/dashboard-context";
import { useAdvisorUser } from "@/lib/contexts/user-context";

interface FinancialPlan {
  summary: string;
  target_corpus: number;
  estimated_retirement_date: string;
  monthly_sip_total: number;
  monthly_plan: any[];
  tax_comparison: any;
  insurance_gap: any;
  asset_allocation_current: Record<string, number>;
  asset_allocation_target: Record<string, number>;
  key_recommendations: string[];
  educational_notes: string[];
  assumptions: Record<string, any>;
  confidence_notes: string[];
  scenario_type: string;
  disclaimer: string;
  fund_options?: Record<string, any[]>;
}

import AdvisedInvestments from "@/components/advisor/advised-investments";

export default function AdvisorDashboard() {
  const router = useRouter();
  const { userId, loading: userLoading, error: userError } = useAdvisorUser();
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeView } = useDashboardView();

  // Fetch plan
  const fetchPlan = useCallback(async () => {
    if (!userId) return;

    let timeoutId: NodeJS.Timeout;

    try {
      const res = await fetch(`/api/advisor/plan?user_id=${userId}`);
      if (res.status === 404) {
        setError(
          "Generating your personalized financial plan... This usually takes 10-30 seconds.",
        );
        timeoutId = setTimeout(fetchPlan, 5000);
        return;
      }

      const data = await res.json();
      if (data.success && data.plan?.plan) {
        setPlan(data.plan.plan);
        setError(null);
        setLoading(false);
      } else {
        setError("Finalizing your plan structure...");
        timeoutId = setTimeout(fetchPlan, 5000);
      }
    } catch {
      setError("Waiting for backend processing to complete...");
      timeoutId = setTimeout(fetchPlan, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    let cancel = () => {};
    if (userId) {
      const p = fetchPlan();
      if (p instanceof Promise) {
        p.then((c) => {
          if (c) cancel = c;
        });
      }
    }
    return () => cancel();
  }, [userId, fetchPlan]);

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <h3 className="font-bold text-lg">Building Your Plan</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error || userError || "Loading your financial profile..."}
          </p>
        </div>
      </div>
    );
  }

  // Error / no plan state
  if (error || userError || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h2 className="text-lg font-semibold">No Financial Plan Yet</h2>
          <p className="text-sm text-muted-foreground">
            {error ||
              "Complete the onboarding to generate your personalized financial plan."}
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary 
              text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="space-y-6 pb-8 w-full overflow-x-hidden">
      {/* Important Disclaimer */}
      <Card className="bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-none">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <LucideMessageCircleWarning className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs leading-relaxed opacity-80">
              {plan.disclaimer ||
                "Investment recommendations provided are for educational purposes only. Past performance is not indicative of future results. Consult with a certified financial planner before making investment decisions."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Summary */}
      <div>
        <h1 className="text-xl font-bold mb-1">Your Financial Plan</h1>
        <p className="text-sm text-muted-foreground">{plan.summary}</p>
      </div>

      {/* KPI Cards Row */}
      <PlanKPICards plan={plan} />

      {/* Monthly Investment Plan - Horizontal Carousel */}
      <Card className="overflow-hidden w-full">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Monthly Investment Plan</CardTitle>
          <CardDescription>
            Scroll to view your personalized SIP schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 overflow-hidden">
          <MonthlyPlanCarousel monthlyPlan={plan.monthly_plan} />
        </CardContent>
      </Card>

      {/* Advised Investments */}
      {plan.fund_options && (
        <AdvisedInvestments fundOptions={plan.fund_options} />
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation Card */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Asset Allocation</CardTitle>
            <CardDescription>Current vs Target breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AssetAllocationChart
              current={plan.asset_allocation_current}
              target={plan.asset_allocation_target}
            />
          </CardContent>
        </Card>

        {/* Tax Comparison */}
        <TaxComparison tax={plan.tax_comparison} />
      </div>

      {/* Insurance and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsuranceGap insurance={plan.insurance_gap} />

        <Recommendations
          recommendations={plan.key_recommendations}
          educationalNotes={plan.educational_notes}
        />
      </div>
    </div>
  );
}
