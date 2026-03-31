/**
 * Financial calculators for investment planning.
 * Ported from ET_Hackathon/tools/financial_calculator.py
 */

import {
  FINANCIAL_CONSTANTS as FC,
  CATEGORY_EXPECTED_RETURNS,
} from "./constants";

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATION TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface MonthlySurplusResult {
  monthly_income: number;
  monthly_expenses: number;
  emi_total: number;
  monthly_surplus: number;
  savings_rate_pct: number;
  assessment: string;
}

export interface DebtToIncomeResult {
  total_emi: number;
  monthly_income: number;
  dti_pct: number;
  assessment: string;
}

export interface EmergencyFundResult {
  monthly_expenses: number;
  months: number;
  target: number;
  existing_savings: number;
  gap: number;
  adequate: boolean;
}

export interface NetWorthResult {
  mf: number;
  ppf: number;
  epf: number;
  fd: number;
  nps: number;
  savings: number;
  total: number;
}

export interface AssetAllocationResult {
  age: number;
  risk_appetite: string;
  equity_pct: number;
  debt_pct: number;
  gold_pct: number;
  rationale: string;
}

export interface RetirementCorpusResult {
  monthly_draw_today: number;
  years_to_retire: number;
  inflation_pct: number;
  swr_pct: number;
  monthly_draw_at_retirement: number;
  annual_draw_at_retirement: number;
  corpus_required: number;
}

export interface SIPRequiredResult {
  target_amount: number;
  rate_pct: number;
  years: number;
  monthly_sip: number;
  total_investment: number;
  total_returns: number;
}

export interface InsuranceGapResult {
  annual_income: number;
  multiplier: number;
  recommended_cover: number;
  existing_cover: number;
  gap: number;
  adequate: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULATOR FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate monthly investable surplus after expenses and EMIs.
 */
export function calculateMonthlySurplus(
  monthlyIncome: number,
  monthlyExpenses: number,
  emiTotal: number = 0,
): MonthlySurplusResult {
  const surplus = Math.max(0, monthlyIncome - monthlyExpenses - emiTotal);
  const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

  let assessment: string;
  if (savingsRate > 40) assessment = "Excellent (>40%)";
  else if (savingsRate > 25) assessment = "Good (25-40%)";
  else if (savingsRate > 10) assessment = "Fair (10-25%)";
  else assessment = "Low (<10%)";

  return {
    monthly_income: monthlyIncome,
    monthly_expenses: monthlyExpenses,
    emi_total: emiTotal,
    monthly_surplus: Math.round(surplus * 100) / 100,
    savings_rate_pct: Math.round(savingsRate * 10) / 10,
    assessment,
  };
}

/**
 * Calculate debt-to-income ratio.
 */
export function calculateDebtToIncome(
  totalEmi: number,
  monthlyIncome: number,
): DebtToIncomeResult {
  const dti = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;

  let assessment: string;
  if (dti < 30) assessment = "Healthy (<30%)";
  else if (dti < 40) assessment = "Moderate (30-40%)";
  else if (dti < 50) assessment = "High (40-50%)";
  else assessment = "Critical (>50%)";

  return {
    total_emi: totalEmi,
    monthly_income: monthlyIncome,
    dti_pct: Math.round(dti * 10) / 10,
    assessment,
  };
}

/**
 * Calculate emergency fund gap.
 */
export function calculateEmergencyFund(
  monthlyExpenses: number,
  existingSavings: number = 0,
  months: number = FC.emergency_fund_months,
): EmergencyFundResult {
  const target = monthlyExpenses * months;
  const gap = Math.max(0, target - existingSavings);

  return {
    monthly_expenses: monthlyExpenses,
    months,
    target: Math.round(target),
    existing_savings: existingSavings,
    gap: Math.round(gap),
    adequate: gap === 0,
  };
}

/**
 * Calculate total net worth from assets.
 */
export function calculateNetWorth(assets: {
  mf?: number;
  ppf?: number;
  epf?: number;
  fd?: number;
  nps?: number;
  savings?: number;
}): NetWorthResult {
  const { mf = 0, ppf = 0, epf = 0, fd = 0, nps = 0, savings = 0 } = assets;

  const total = mf + ppf + epf + fd + nps + savings;

  return { mf, ppf, epf, fd, nps, savings, total: Math.round(total) };
}

/**
 * Recommend asset allocation based on age and risk appetite.
 */
export function recommendAssetAllocation(
  age: number,
  riskAppetite: "conservative" | "moderate" | "aggressive" = "moderate",
): AssetAllocationResult {
  // Get glidepath based on risk appetite
  const glidepath =
    riskAppetite === "aggressive"
      ? FC.glidepath_aggressive
      : riskAppetite === "conservative"
        ? FC.glidepath_conservative
        : FC.glidepath_moderate;

  // Find equity percentage based on age
  let equityPct = 20; // Default for very old
  for (const [maxAge, equity] of Object.entries(glidepath)) {
    if (age <= parseInt(maxAge)) {
      equityPct = equity;
      break;
    }
  }

  // Gold allocation based on risk
  const goldPct =
    riskAppetite === "aggressive"
      ? 5
      : riskAppetite === "conservative"
        ? 15
        : 10;
  const debtPct = 100 - equityPct - goldPct;

  const rationale = `At age ${age} with ${riskAppetite} risk appetite, we recommend ${equityPct}% equity for growth, ${debtPct}% debt for stability, and ${goldPct}% gold for diversification. This allocation follows a glidepath that reduces equity exposure as you approach retirement.`;

  return {
    age,
    risk_appetite: riskAppetite,
    equity_pct: equityPct,
    debt_pct: debtPct,
    gold_pct: goldPct,
    rationale,
  };
}

/**
 * Calculate retirement corpus needed.
 * Uses inflation-adjusted monthly draw and safe withdrawal rate.
 */
export function calculateRetirementCorpus(
  monthlyDrawToday: number,
  yearsToRetire: number,
  inflationPct: number = FC.default_inflation_pct,
  swrPct: number = FC.default_swr_pct,
): RetirementCorpusResult {
  // Inflate monthly draw to retirement date
  const monthlyDrawAtRetirement =
    monthlyDrawToday * Math.pow(1 + inflationPct / 100, yearsToRetire);
  const annualDrawAtRetirement = monthlyDrawAtRetirement * 12;

  // Corpus = Annual draw / SWR
  const corpusRequired = annualDrawAtRetirement / (swrPct / 100);

  return {
    monthly_draw_today: monthlyDrawToday,
    years_to_retire: yearsToRetire,
    inflation_pct: inflationPct,
    swr_pct: swrPct,
    monthly_draw_at_retirement: Math.round(monthlyDrawAtRetirement),
    annual_draw_at_retirement: Math.round(annualDrawAtRetirement),
    corpus_required: Math.round(corpusRequired),
  };
}

/**
 * Calculate monthly SIP required to reach target corpus.
 * Uses future value of annuity formula.
 */
export function calculateSIPRequired(
  targetAmount: number,
  ratePct: number = FC.default_equity_return_pct,
  years: number,
): SIPRequiredResult {
  const monthlyRate = ratePct / 100 / 12;
  const months = years * 12;

  // FV = P * ((1 + r)^n - 1) / r * (1 + r)
  // P = FV * r / ((1 + r)^n - 1) / (1 + r)
  const factor = Math.pow(1 + monthlyRate, months);
  const monthlySip =
    (targetAmount * monthlyRate) / (factor - 1) / (1 + monthlyRate);

  const totalInvestment = monthlySip * months;
  const totalReturns = targetAmount - totalInvestment;

  return {
    target_amount: targetAmount,
    rate_pct: ratePct,
    years,
    monthly_sip: Math.round(monthlySip),
    total_investment: Math.round(totalInvestment),
    total_returns: Math.round(totalReturns),
  };
}

/**
 * Calculate insurance coverage gap.
 */
export function calculateInsuranceGap(
  annualIncome: number,
  existingCover: number = 0,
  multiplier: number = FC.term_insurance_multiplier,
): InsuranceGapResult {
  const recommendedCover = annualIncome * multiplier;
  const gap = Math.max(0, recommendedCover - existingCover);

  return {
    annual_income: annualIncome,
    multiplier,
    recommended_cover: Math.round(recommendedCover),
    existing_cover: existingCover,
    gap: Math.round(gap),
    adequate: gap === 0,
  };
}

/**
 * Get expected return for a fund category.
 */
export function getExpectedReturn(
  category: string,
  scenario: "expected" | "conservative" | "aggressive" = "expected",
): number {
  const returns = CATEGORY_EXPECTED_RETURNS[category];
  if (!returns) return 0;
  return returns[scenario];
}

/**
 * Calculate weighted portfolio return.
 */
export function calculateWeightedReturn(allocation: {
  equity_pct: number;
  debt_pct: number;
  gold_pct: number;
}): number {
  const equityReturn = FC.default_equity_return_pct;
  const debtReturn = FC.default_debt_return_pct;
  const goldReturn = FC.default_gold_return_pct;

  return (
    (allocation.equity_pct * equityReturn +
      allocation.debt_pct * debtReturn +
      allocation.gold_pct * goldReturn) /
    100
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE PRE-COMPUTATION
// ══════════════════════════════════════════════════════════════════════════════

export interface PrecomputedMetrics {
  monthly_surplus: MonthlySurplusResult;
  dti: DebtToIncomeResult;
  emergency_fund: EmergencyFundResult;
  net_worth: NetWorthResult;
  asset_allocation: AssetAllocationResult;
  retirement_corpus: RetirementCorpusResult;
  sip_required: SIPRequiredResult;
  term_insurance_gap: InsuranceGapResult;
  health_insurance_gap: InsuranceGapResult;
  weighted_return_pct: number;
}

/**
 * Pre-compute all deterministic financial metrics.
 * This runs before the LLM call to inject context.
 */
export function precomputeMetrics(profile: {
  age: number;
  annual_income: number;
  monthly_expenses: number;
  home_loan_emi?: number;
  car_loan_emi?: number;
  other_emi?: number;
  existing_mf?: number;
  existing_ppf?: number;
  existing_epf?: number;
  existing_fd?: number;
  existing_nps?: number;
  existing_savings?: number;
  risk_appetite?: "conservative" | "moderate" | "aggressive";
  target_retirement_age?: number;
  target_monthly_draw?: number;
  has_term_insurance?: boolean;
  term_cover_amount?: number;
  has_health_insurance?: boolean;
  health_cover_amount?: number;
}): PrecomputedMetrics {
  const monthlyIncome = profile.annual_income / 12;
  const totalEmi =
    (profile.home_loan_emi || 0) +
    (profile.car_loan_emi || 0) +
    (profile.other_emi || 0);

  const monthly_surplus = calculateMonthlySurplus(
    monthlyIncome,
    profile.monthly_expenses,
    totalEmi,
  );

  const dti = calculateDebtToIncome(totalEmi, monthlyIncome);

  const emergency_fund = calculateEmergencyFund(
    profile.monthly_expenses,
    profile.existing_savings || 0,
  );

  const net_worth = calculateNetWorth({
    mf: profile.existing_mf,
    ppf: profile.existing_ppf,
    epf: profile.existing_epf,
    fd: profile.existing_fd,
    nps: profile.existing_nps,
    savings: profile.existing_savings,
  });

  const riskAppetite = profile.risk_appetite || "moderate";
  const asset_allocation = recommendAssetAllocation(profile.age, riskAppetite);

  const yearsToRetire = (profile.target_retirement_age || 60) - profile.age;
  const monthlyDraw = profile.target_monthly_draw || profile.monthly_expenses;

  const retirement_corpus = calculateRetirementCorpus(
    monthlyDraw,
    yearsToRetire,
  );

  const weighted_return_pct = calculateWeightedReturn(asset_allocation);

  const sip_required = calculateSIPRequired(
    retirement_corpus.corpus_required - net_worth.total,
    weighted_return_pct,
    yearsToRetire,
  );

  const term_insurance_gap = calculateInsuranceGap(
    profile.annual_income,
    profile.term_cover_amount || 0,
  );

  const health_insurance_gap = calculateInsuranceGap(
    profile.annual_income,
    profile.health_cover_amount || 0,
    1, // Health insurance uses 1x income as base, but we adjust below
  );
  // Adjust health insurance to base amount
  health_insurance_gap.recommended_cover = Math.max(
    FC.health_insurance_base,
    profile.annual_income,
  );
  health_insurance_gap.gap = Math.max(
    0,
    health_insurance_gap.recommended_cover - (profile.health_cover_amount || 0),
  );

  return {
    monthly_surplus,
    dti,
    emergency_fund,
    net_worth,
    asset_allocation,
    retirement_corpus,
    sip_required,
    term_insurance_gap,
    health_insurance_gap,
    weighted_return_pct,
  };
}
