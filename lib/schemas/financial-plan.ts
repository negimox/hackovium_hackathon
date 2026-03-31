/**
 * Zod schemas for financial plan structured output.
 * Ported from ET_Hackathon/models.py
 */

import { z } from "zod";

// ── Fund Recommendation (Simplified) ──────────────────────────
// Only includes essential fields to reduce response size and avoid truncation
export const FundRecommendationSchema = z.object({
  name: z.string().describe("Fund name (Direct Growth plan)"),
  isin: z.string().describe("ISIN code for identification"),
  amc: z.string().describe("Asset Management Company name"),
  risk_level: z
    .enum(["low", "moderate", "high", "very_high"])
    .describe("Risk level of the fund"),
  expense_ratio_pct: z
    .number()
    .describe("Expense ratio as percentage (e.g., 0.18)"),
  returns_3y_pct: z
    .number()
    .describe("3-year CAGR as percentage"),
  reason: z.string().describe("Why this fund is recommended"),
});

export type FundRecommendation = z.infer<typeof FundRecommendationSchema>;

// ── Monthly Plan Entry ────────────────────────────────────────
export const MonthlyPlanEntrySchema = z.object({
  month: z.string().describe("Month in YYYY-MM format, e.g. '2026-04'"),
  sip_large_cap: z
    .number()
    .default(0)
    .describe("SIP in large-cap equity category (₹)"),
  sip_mid_cap: z
    .number()
    .default(0)
    .describe("SIP in mid-cap equity category (₹)"),
  sip_small_cap: z
    .number()
    .default(0)
    .describe("SIP in small-cap equity category (₹)"),
  sip_debt: z.number().default(0).describe("SIP in debt fund category (₹)"),
  sip_gold: z
    .number()
    .default(0)
    .describe("SIP in gold/gold fund category (₹)"),
  ppf_contribution: z
    .number()
    .default(0)
    .describe("PPF monthly contribution (₹)"),
  nps_contribution: z
    .number()
    .default(0)
    .describe("NPS monthly contribution (₹)"),
  emergency_fund_contribution: z
    .number()
    .default(0)
    .describe("Towards emergency fund (₹)"),
  equity_pct: z
    .number()
    .describe("Target equity allocation % for this month (glidepath)"),
  debt_pct: z.number().describe("Target debt allocation % for this month"),
  notes: z.string().default("").describe("Any special notes for this month"),
});

export type MonthlyPlanEntry = z.infer<typeof MonthlyPlanEntrySchema>;

// ── Fund Options Container ────────────────────────────────────
export const FundOptionsSchema = z.object({
  large_cap_funds: z
    .array(FundRecommendationSchema)
    .default([])
    .describe("Top large-cap fund recommendations with ISIN"),
  mid_cap_funds: z
    .array(FundRecommendationSchema)
    .default([])
    .describe("Top mid-cap fund recommendations with ISIN"),
  small_cap_funds: z
    .array(FundRecommendationSchema)
    .default([])
    .describe("Top small-cap fund recommendations with ISIN"),
  debt_funds: z
    .array(FundRecommendationSchema)
    .default([])
    .describe("Top debt fund recommendations with ISIN"),
  gold_funds: z
    .array(FundRecommendationSchema)
    .default([])
    .describe("Top gold fund recommendations with ISIN"),
});

export type FundOptions = z.infer<typeof FundOptionsSchema>;

// ── Tax Comparison ────────────────────────────────────────────
export const TaxComparisonSchema = z.object({
  old_regime_tax: z.number().describe("Total tax payable under old regime (₹)"),
  new_regime_tax: z.number().describe("Total tax payable under new regime (₹)"),
  recommended_regime: z
    .enum(["old", "new"])
    .describe("Which regime saves more tax"),
  savings_amount: z.number().describe("₹ saved by choosing recommended regime"),
  deductions_utilized: z
    .record(z.string(), z.number())
    .default({})
    .describe(
      "Deductions used in old regime: {'80C': 150000, '80CCD': 50000, ...}",
    ),
  deductions_wasted_in_new: z
    .record(z.string(), z.number())
    .default({})
    .describe("Deductions you lose by choosing new regime"),
  explanation: z.string().describe("Why this regime is better for this user"),
});

export type TaxComparison = z.infer<typeof TaxComparisonSchema>;

// ── Insurance Gap ─────────────────────────────────────────────
export const InsuranceGapSchema = z.object({
  has_term: z.boolean().describe("Whether user has term life insurance"),
  recommended_term_cover: z.number().describe("Recommended term cover (₹)"),
  current_term_cover: z.number().default(0).describe("Current term cover (₹)"),
  term_gap: z.number().describe("Term insurance gap (₹)"),
  has_health: z.boolean().describe("Whether user has health insurance"),
  recommended_health_cover: z.number().describe("Recommended health cover (₹)"),
  current_health_cover: z
    .number()
    .default(0)
    .describe("Current health cover (₹)"),
  health_gap: z.number().describe("Health insurance gap (₹)"),
  recommendations: z
    .array(z.string())
    .default([])
    .describe("Specific insurance action items"),
});

export type InsuranceGap = z.infer<typeof InsuranceGapSchema>;

// ── Portfolio Overlap ─────────────────────────────────────────
export const OverlapPairSchema = z.object({
  fund_1: z.string().describe("First fund name"),
  fund_2: z.string().describe("Second fund name"),
  overlap_pct: z
    .number()
    .describe("Overlap percentage between these two funds"),
  common_stocks: z
    .array(z.string())
    .default([])
    .describe("List of common stocks between the two funds"),
});

export const PortfolioOverlapSchema = z.object({
  overlap_score: z.number().describe("Overall overlap score 0-100%"),
  overlapping_stocks: z
    .array(z.string())
    .default([])
    .describe("Top stocks appearing across multiple schemes"),
  schemes_with_overlap: z
    .array(OverlapPairSchema)
    .default([])
    .describe("Pairs of schemes with significant overlap"),
  consolidation_advice: z
    .string()
    .describe("Advice on reducing overlap, e.g. 'Reduce from 8 to 4 schemes'"),
});

export type PortfolioOverlap = z.infer<typeof PortfolioOverlapSchema>;

// ── Full Financial Plan ──────────────────────────────────────
export const FinancialPlanSchema = z.object({
  summary: z.string().describe("Executive summary of the plan"),
  target_corpus: z.number().describe("Target corpus needed (₹)"),
  estimated_retirement_date: z
    .string()
    .describe("Estimated date/year of goal achievement"),
  monthly_sip_total: z.number().describe("Total monthly SIP recommended (₹)"),
  monthly_plan: z
    .array(MonthlyPlanEntrySchema)
    .default([])
    .describe("Month-by-month allocation plan for next 6 months"),
  fund_options: FundOptionsSchema.optional().describe(
    "Educational fund options by category (applies to all months)",
  ),
  plan_start_month: z
    .string()
    .default("")
    .describe("First month of the plan in YYYY-MM format"),
  plan_generated_at: z
    .string()
    .default("")
    .describe("ISO timestamp when plan was generated"),
  tax_comparison: TaxComparisonSchema.describe("Old vs New regime analysis"),
  insurance_gap: InsuranceGapSchema.describe("Insurance coverage gaps"),
  portfolio_overlap: PortfolioOverlapSchema.optional().describe(
    "Portfolio overlap analysis (only if CAS data available)",
  ),
  asset_allocation_current: z
    .record(z.string(), z.number())
    .default({})
    .describe(
      "Current asset allocation: {'equity': 60, 'debt': 30, 'gold': 10}",
    ),
  asset_allocation_target: z
    .record(z.string(), z.number())
    .default({})
    .describe("Target asset allocation based on age and risk"),
  key_recommendations: z
    .array(z.string())
    .default([])
    .describe("Prioritized action items with 'why' explanations"),
  educational_notes: z
    .array(z.string())
    .max(3)
    .default([])
    .describe("3-4 short financial literacy tips (max 2-3 sentences each)"),
  assumptions: z
    .record(z.string(), z.number())
    .default({})
    .describe("Assumptions used: inflation, returns, SWR, etc."),
  confidence_notes: z
    .array(z.string())
    .default([])
    .describe("Limitations and caveats of this plan"),
  scenario_type: z
    .string()
    .default("creative")
    .describe("'FIRE' | 'child_education' | 'home_purchase' | 'custom'"),
  disclaimer: z.string().describe("Mandatory SEBI disclaimer text"),
});

export type FinancialPlan = z.infer<typeof FinancialPlanSchema>;

// ── Chat Response ─────────────────────────────────────────────
export const ChatResponseSchema = z.object({
  reply: z.string().describe("The advisor's reply to the user"),
  needs_replan: z
    .boolean()
    .default(false)
    .describe(
      "True if the chat implies a profile change requiring plan regeneration",
    ),
  profile_updates: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({})
    .describe(
      "Profile fields that changed, e.g. {'target_retirement_age': 55}",
    ),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ── User Profile (for API requests) ───────────────────────────
export const UserProfileSchema = z.object({
  clerk_user_id: z.string(),
  name: z.string(),
  age: z.number(),
  city: z.string().default("India"),
  dependents: z.number().default(0),
  annual_income: z.number(),
  monthly_expenses: z.number(),
  home_loan_emi: z.number().default(0),
  car_loan_emi: z.number().default(0),
  other_emi: z.number().default(0),
  existing_mf: z.number().default(0),
  existing_ppf: z.number().default(0),
  existing_nps: z.number().default(0),
  existing_epf: z.number().default(0),
  existing_fd: z.number().default(0),
  existing_savings: z.number().default(0),
  current_sip: z.number().default(0),
  primary_goal: z.string().default("FIRE"),
  target_retirement_age: z.number().default(60),
  target_monthly_draw: z.number().default(0),
  risk_appetite: z
    .enum(["conservative", "moderate", "aggressive"])
    .default("moderate"),
  investment_horizon_years: z.number().default(10),
  has_term_insurance: z.boolean().default(false),
  term_cover_amount: z.number().default(0),
  has_health_insurance: z.boolean().default(false),
  health_cover_amount: z.number().default(0),
  annual_hra_received: z.number().default(0),
  annual_rent_paid: z.number().default(0),
  is_metro_city: z.boolean().default(true),
  home_loan_interest_annually: z.number().default(0),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
