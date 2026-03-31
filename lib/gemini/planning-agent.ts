/**
 * Financial Planning Agent.
 * Consolidates 5 CrewAI agents into a single Gemini agent with structured output.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { getGeminiClient, PLANNING_MODEL, PLANNING_CONFIG } from "./client";
import {
  FinancialPlanSchema,
  type FinancialPlan,
  type UserProfile,
} from "../schemas/financial-plan";
import {
  calculateTaxComparison,
  type TaxCalcInput,
} from "../tools/tax-calculator";
import {
  precomputeMetrics,
  type PrecomputedMetrics,
} from "../tools/financial-calc";
import { getAllFundOptions } from "../tools/fund-data";
import { SEBI_DISCLAIMER } from "../tools/constants";

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════════════

const PLANNING_SYSTEM_PROMPT = `You are an expert Indian financial advisor with deep knowledge of:
- Indian tax laws (FY 2025-26)
- SEBI-compliant investment strategies
- Mutual fund analysis and portfolio construction
- Insurance planning and risk management
- Retirement planning (FIRE, traditional, goal-based)

Your role combines the expertise of:
1. **Financial Data Analyst**: Validate pre-computed financial metrics
2. **Tax & Insurance Specialist**: Review tax regime comparison and insurance gaps
3. **Investment Strategist**: Design asset allocation and monthly SIP schedules
4. **Compliance Officer**: Ensure all recommendations are educational, not advice
5. **Plan Compiler**: Create a comprehensive, actionable financial plan

IMPORTANT GUIDELINES:
- All calculations are PRE-COMPUTED and provided to you. Do not recalculate.
- Fund recommendations are EDUCATIONAL. Include disclaimers about past performance.
- Always recommend index funds alongside active funds for diversification.
- Use age-based glidepath for equity allocation (reduce equity as retirement approaches).
- Emphasize emergency fund before investments.
- Consider tax efficiency in all recommendations.
- Include the mandatory SEBI disclaimer in your response.

OUTPUT FORMAT:
Generate a structured FinancialPlan JSON that includes:
- Executive summary (2-3 sentences)
- 6-month SIP schedule with specific allocations
- Fund options by category (use the provided fund data)
- Tax comparison explanation
- Insurance gap recommendations
- Key action items with "why" explanations
- Educational notes for financial literacy

Remember: You are providing EDUCATIONAL guidance, not investment advice.`;

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate the next 6 months in YYYY-MM format.
 */
function getNext6Months(): string[] {
  const months: string[] = [];
  const today = new Date();

  for (let i = 1; i <= 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }

  return months;
}

/**
 * Calculate current asset allocation as percentages from holdings.
 */
function calculateCurrentAllocation(metrics: PrecomputedMetrics): Record<
  string,
  number
> {
  const nw = metrics.net_worth;
  const total =
    nw.mf + nw.ppf + nw.epf + nw.fd + nw.nps + nw.savings;

  if (total === 0) {
    return {
      equity: 0,
      debt: 0,
      gold: 0,
    };
  }

  // Classify by asset class
  const equityValue = nw.mf;
  const debtValue = nw.ppf + nw.nps + nw.fd;
  const cashValue = nw.savings;
  const goldValue = nw.epf;

  return {
    equity: Math.round((equityValue / total) * 100 * 100) / 100,
    debt: Math.round((debtValue / total) * 100 * 100) / 100,
    gold: Math.round((goldValue / total) * 100 * 100) / 100,
    cash: Math.round((cashValue / total) * 100 * 100) / 100,
  };
}

/**
 * Format pre-computed metrics as context for the LLM.
 */
function formatMetricsContext(metrics: PrecomputedMetrics): string {
  return `
## PRE-COMPUTED FINANCIAL METRICS (Do not recalculate)

### Monthly Cash Flow
- Monthly Income: ₹${metrics.monthly_surplus.monthly_income.toLocaleString("en-IN")}
- Monthly Expenses: ₹${metrics.monthly_surplus.monthly_expenses.toLocaleString("en-IN")}
- Total EMIs: ₹${metrics.monthly_surplus.emi_total.toLocaleString("en-IN")}
- **Investable Surplus: ₹${metrics.monthly_surplus.monthly_surplus.toLocaleString("en-IN")}**
- Savings Rate: ${metrics.monthly_surplus.savings_rate_pct}% (${metrics.monthly_surplus.assessment})

### Debt-to-Income Ratio
- DTI: ${metrics.dti.dti_pct}% (${metrics.dti.assessment})

### Emergency Fund
- Target (6 months expenses): ₹${metrics.emergency_fund.target.toLocaleString("en-IN")}
- Current Savings: ₹${metrics.emergency_fund.existing_savings.toLocaleString("en-IN")}
- Gap: ₹${metrics.emergency_fund.gap.toLocaleString("en-IN")} ${metrics.emergency_fund.adequate ? "✓ Adequate" : "⚠️ Needs attention"}

### Net Worth
- Total: ₹${metrics.net_worth.total.toLocaleString("en-IN")}
  - MF: ₹${metrics.net_worth.mf.toLocaleString("en-IN")}
  - PPF: ₹${metrics.net_worth.ppf.toLocaleString("en-IN")}
  - EPF: ₹${metrics.net_worth.epf.toLocaleString("en-IN")}
  - FD: ₹${metrics.net_worth.fd.toLocaleString("en-IN")}
  - NPS: ₹${metrics.net_worth.nps.toLocaleString("en-IN")}
  - Savings: ₹${metrics.net_worth.savings.toLocaleString("en-IN")}

### Asset Allocation (Recommended)
- Equity: ${metrics.asset_allocation.equity_pct}%
- Debt: ${metrics.asset_allocation.debt_pct}%
- Gold: ${metrics.asset_allocation.gold_pct}%
- Rationale: ${metrics.asset_allocation.rationale}

### Retirement Planning
- Years to Retire: ${metrics.retirement_corpus.years_to_retire}
- Monthly Draw (at retirement): ₹${metrics.retirement_corpus.monthly_draw_at_retirement.toLocaleString("en-IN")}
- **Target Corpus: ₹${metrics.retirement_corpus.corpus_required.toLocaleString("en-IN")}**
- Weighted Portfolio Return: ${metrics.weighted_return_pct.toFixed(1)}%

### Required Investment
- Monthly SIP Needed: ₹${metrics.sip_required.monthly_sip.toLocaleString("en-IN")}
- Total Investment Over ${metrics.sip_required.years} years: ₹${metrics.sip_required.total_investment.toLocaleString("en-IN")}
- Expected Returns: ₹${metrics.sip_required.total_returns.toLocaleString("en-IN")}

### Insurance Analysis
**Term Insurance:**
- Recommended Cover: ₹${metrics.term_insurance_gap.recommended_cover.toLocaleString("en-IN")}
- Current Cover: ₹${metrics.term_insurance_gap.existing_cover.toLocaleString("en-IN")}
- Gap: ₹${metrics.term_insurance_gap.gap.toLocaleString("en-IN")} ${metrics.term_insurance_gap.adequate ? "✓ Adequate" : "⚠️ Needs attention"}

**Health Insurance:**
- Recommended Cover: ₹${metrics.health_insurance_gap.recommended_cover.toLocaleString("en-IN")}
- Current Cover: ₹${metrics.health_insurance_gap.existing_cover.toLocaleString("en-IN")}
- Gap: ₹${metrics.health_insurance_gap.gap.toLocaleString("en-IN")} ${metrics.health_insurance_gap.adequate ? "✓ Adequate" : "⚠️ Needs attention"}
`;
}

/**
 * Format tax comparison as context for the LLM.
 */
function formatTaxContext(
  tax: ReturnType<typeof calculateTaxComparison>,
): string {
  return `
## TAX COMPARISON (FY 2025-26)

### Old Regime
- Taxable Income: ₹${(tax.deductions_utilized.standard_deduction ? 0 : 0).toLocaleString("en-IN")} (after deductions)
- Tax Payable: ₹${tax.old_regime_tax.toLocaleString("en-IN")}
- Deductions Used: ${Object.entries(tax.deductions_utilized)
    .map(([k, v]) => `${k}: ₹${v.toLocaleString("en-IN")}`)
    .join(", ")}

### New Regime
- Tax Payable: ₹${tax.new_regime_tax.toLocaleString("en-IN")}

### Recommendation
- **${tax.recommended_regime.toUpperCase()} REGIME** saves ₹${tax.savings_amount.toLocaleString("en-IN")}
- ${tax.explanation}
`;
}

/**
 * Format user profile as context for the LLM.
 */
function formatProfileContext(profile: UserProfile): string {
  return `
## USER PROFILE

- Name: ${profile.name}
- Age: ${profile.age} years
- City: ${profile.city}
- Dependents: ${profile.dependents}

### Income & Expenses
- Annual Income: ₹${profile.annual_income.toLocaleString("en-IN")}
- Monthly Expenses: ₹${profile.monthly_expenses.toLocaleString("en-IN")}

### Goals
- Primary Goal: ${profile.primary_goal}
- Target Retirement Age: ${profile.target_retirement_age}
- Target Monthly Draw: ₹${profile.target_monthly_draw.toLocaleString("en-IN")}
- Risk Appetite: ${profile.risk_appetite}
- Investment Horizon: ${profile.investment_horizon_years} years
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export interface GeneratePlanInput {
  profile: UserProfile;
  casData?: {
    total_mf_value: number;
    funds: Array<{ name: string; value: number; units: number }>;
  };
}

export interface GeneratePlanResult {
  success: boolean;
  plan?: FinancialPlan;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a comprehensive financial plan using Gemini.
 */
export async function generateFinancialPlan(
  input: GeneratePlanInput,
): Promise<GeneratePlanResult> {
  const { profile, casData } = input;

  try {
    // ── Step 1: Pre-compute deterministic metrics ──
    const metrics = precomputeMetrics({
      age: profile.age,
      annual_income: profile.annual_income,
      monthly_expenses: profile.monthly_expenses,
      home_loan_emi: profile.home_loan_emi,
      car_loan_emi: profile.car_loan_emi,
      other_emi: profile.other_emi,
      existing_mf: profile.existing_mf,
      existing_ppf: profile.existing_ppf,
      existing_epf: profile.existing_epf,
      existing_fd: profile.existing_fd,
      existing_nps: profile.existing_nps,
      existing_savings: profile.existing_savings,
      risk_appetite: profile.risk_appetite,
      target_retirement_age: profile.target_retirement_age,
      target_monthly_draw: profile.target_monthly_draw,
      has_term_insurance: profile.has_term_insurance,
      term_cover_amount: profile.term_cover_amount,
      has_health_insurance: profile.has_health_insurance,
      health_cover_amount: profile.health_cover_amount,
    });

    // ── Step 2: Calculate tax comparison ──
    const taxInput: TaxCalcInput = {
      annual_income: profile.annual_income,
      epf_contribution: profile.existing_epf ? profile.existing_epf * 0.12 : 0, // Approximate
      ppf_contribution: profile.existing_ppf ? 150000 : 0, // Max if has PPF
      hra_received: profile.annual_hra_received,
      rent_paid: profile.annual_rent_paid,
      is_metro: profile.is_metro_city,
      home_loan_interest: profile.home_loan_interest_annually,
      health_insurance_self: profile.has_health_insurance ? 25000 : 0,
    };
    const taxComparison = calculateTaxComparison(taxInput);

    // ── Step 3: Get fund recommendations ──
    const fundOptions = getAllFundOptions(3);

    // ── Step 4: Get plan months ──
    const planMonths = getNext6Months();

    // ── Step 5: Build prompt with all context ──
    const currentAllocation = calculateCurrentAllocation(metrics);
    const contextPrompt = `
${formatProfileContext(profile)}

${formatMetricsContext(metrics)}

${formatTaxContext(taxComparison)}

## CURRENT ASSET ALLOCATION (from existing holdings)
Use these percentages for asset_allocation_current in the JSON output:
- Equity: ${currentAllocation.equity}%
- Debt: ${currentAllocation.debt}%
- Gold: ${currentAllocation.gold}%
- Cash: ${currentAllocation.cash}%

## PLAN PERIOD
Generate a 6-month plan for: ${planMonths.join(", ")}

## AVAILABLE FUND OPTIONS (Educational)
These are top-rated funds by category. Include them in your fund_options output:

### Large Cap (for stability)
${fundOptions.large_cap_funds.map((f) => `- ${f.name} (${f.isin}): ${f.returns_3y_pct}% 3Y CAGR, ${f.expense_ratio_pct}% expense`).join("\n")}

### Mid Cap (for growth)
${fundOptions.mid_cap_funds.map((f) => `- ${f.name} (${f.isin}): ${f.returns_3y_pct}% 3Y CAGR, ${f.expense_ratio_pct}% expense`).join("\n")}

### Small Cap (for high growth, high risk)
${fundOptions.small_cap_funds.map((f) => `- ${f.name} (${f.isin}): ${f.returns_3y_pct}% 3Y CAGR, ${f.expense_ratio_pct}% expense`).join("\n")}

### Debt (for stability)
${fundOptions.debt_funds.map((f) => `- ${f.name} (${f.isin}): ${f.returns_3y_pct}% 3Y CAGR, ${f.expense_ratio_pct}% expense`).join("\n")}

### Gold (for hedging)
${fundOptions.gold_funds.map((f) => `- ${f.name} (${f.isin}): ${f.returns_3y_pct}% 3Y CAGR, ${f.expense_ratio_pct}% expense`).join("\n")}

${
  casData
    ? `
## EXISTING PORTFOLIO (from CAS)
Total MF Value: ₹${casData.total_mf_value.toLocaleString("en-IN")}
Funds: ${casData.funds
        .slice(0, 5)
        .map((f) => f.name)
        .join(
          ", ",
        )}${casData.funds.length > 5 ? ` and ${casData.funds.length - 5} more` : ""}
`
    : ""
}

## TASK
Generate a comprehensive FinancialPlan JSON based on the above data. 
- Use the pre-computed metrics (do not recalculate)
- Include the tax comparison result
- Generate monthly_plan for exactly 6 months (${planMonths.join(", ")})
- Allocate monthly SIP based on the recommended asset allocation
- For fund_options: Include name, isin, amc, risk_level, expense_ratio_pct, returns_3y_pct, and a brief reason
- Add 2-3 brief educational notes (max 2-3 sentences each, no bold formatting)
- Include the SEBI disclaimer

IMPORTANT: The total monthly SIP should not exceed the investable surplus (₹${metrics.monthly_surplus.monthly_surplus.toLocaleString("en-IN")}).
`;

    // ── Step 6: Call Gemini with structured output ──
    const client = getGeminiClient();

    console.log("Calling Gemini with model:", PLANNING_MODEL);
    const response = await client.models.generateContent({
      model: PLANNING_MODEL,
      contents: contextPrompt,
      config: {
        ...PLANNING_CONFIG,
        systemInstruction: PLANNING_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(FinancialPlanSchema) as object,
      },
    });

    console.log("Gemini response object keys:", Object.keys(response));
    console.log("Gemini response candidates:", response.candidates?.length);
    
    // ── Step 7: Parse and validate response ──
    // Try different ways to access the response text
    let responseText = "";
    
    if (response.text) {
      responseText = response.text;
    } else if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        responseText = candidate.content.parts[0].text || "";
      }
    }
    
    if (!responseText) {
      console.error("Full response object:", JSON.stringify(response, null, 2));
      throw new Error("Empty response from Gemini. Response object logged above.");
    }

    // Log the first 500 chars for debugging
    console.log("Gemini response (first 500 chars):", responseText.substring(0, 500));
    console.log("Gemini response length:", responseText.length);

    let planData;
    try {
      planData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error. Full response:", responseText);
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Add metadata
    planData.plan_start_month = planMonths[0];
    planData.plan_generated_at = new Date().toISOString();
    planData.disclaimer = planData.disclaimer || SEBI_DISCLAIMER;

    // Inject pre-computed fund options if not present
    if (
      !planData.fund_options ||
      Object.keys(planData.fund_options).length === 0
    ) {
      planData.fund_options = fundOptions;
    }

    // Ensure tax comparison is from our calculation
    planData.tax_comparison = {
      old_regime_tax: taxComparison.old_regime_tax,
      new_regime_tax: taxComparison.new_regime_tax,
      recommended_regime: taxComparison.recommended_regime,
      savings_amount: taxComparison.savings_amount,
      deductions_utilized: taxComparison.deductions_utilized,
      deductions_wasted_in_new: taxComparison.deductions_wasted_in_new,
      explanation: taxComparison.explanation,
    };

    // Validate with Zod
    const plan = FinancialPlanSchema.parse(planData);

    return {
      success: true,
      plan,
      tokenUsage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error generating financial plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
