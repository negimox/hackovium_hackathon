/**
 * Financial constants for Indian tax and investment calculations.
 * Ported from ET_Hackathon/config.py
 */

export const FINANCIAL_CONSTANTS = {
  // Tax slabs - Old Regime FY 2025-26
  tax_slabs_old_regime_fy2526: [
    { upto: 250000, rate_pct: 0 },
    { upto: 500000, rate_pct: 5 },
    { upto: 1000000, rate_pct: 20 },
    { upto: null, rate_pct: 30 },
  ],

  // Tax slabs - New Regime FY 2025-26
  tax_slabs_new_regime_fy2526: [
    { upto: 400000, rate_pct: 0 },
    { upto: 800000, rate_pct: 5 },
    { upto: 1200000, rate_pct: 10 },
    { upto: 1600000, rate_pct: 15 },
    { upto: 2000000, rate_pct: 20 },
    { upto: 2400000, rate_pct: 25 },
    { upto: null, rate_pct: 30 },
  ],

  // Standard deductions
  old_regime_standard_deduction: 50000,
  new_regime_standard_deduction: 75000,

  // Section limits
  section_80c_limit: 150000,
  section_80ccd_1b_limit: 50000, // NPS additional
  section_80ccd_2_limit_pct: 10, // Employer NPS (% of basic/CTC)
  section_80d_self_limit: 25000,
  section_80d_parents_limit: 25000,
  section_80d_parents_senior_limit: 50000,
  section_24_home_loan_limit: 200000,

  // HRA exemption
  hra_exemption_metro_pct: 50,
  hra_exemption_nonmetro_pct: 40,

  // Section 87A rebate
  old_regime_87a_income_limit: 500000,
  old_regime_87a_rebate_limit: 12500,
  new_regime_87a_income_limit: 1200000,
  new_regime_87a_rebate_limit: 60000,

  // Default financial assumptions
  default_inflation_pct: 6.5,
  default_swr_pct: 4.0, // Safe withdrawal rate
  default_equity_return_pct: 12.0,
  default_debt_return_pct: 7.0,
  default_gold_return_pct: 8.0,

  // Insurance multipliers
  term_insurance_multiplier: 10, // 10x annual income
  health_insurance_base: 500000, // Base health cover recommendation

  // Emergency fund
  emergency_fund_months: 6,

  // Asset allocation glidepath (age-based equity %)
  // Format: { maxAge: equityPercentage }
  glidepath_aggressive: {
    30: 90,
    40: 80,
    50: 65,
    60: 50,
    70: 35,
  },
  glidepath_moderate: {
    30: 80,
    40: 70,
    50: 55,
    60: 40,
    70: 25,
  },
  glidepath_conservative: {
    30: 60,
    40: 50,
    50: 40,
    60: 30,
    70: 20,
  },
} as const;

// Category expected returns for forecasting
export const CATEGORY_EXPECTED_RETURNS: Record<
  string,
  { expected: number; conservative: number; aggressive: number }
> = {
  large_cap: { expected: 12.0, conservative: 10.0, aggressive: 14.0 },
  mid_cap: { expected: 15.0, conservative: 12.0, aggressive: 18.0 },
  small_cap: { expected: 18.0, conservative: 14.0, aggressive: 22.0 },
  debt: { expected: 7.0, conservative: 6.0, aggressive: 8.0 },
  gold: { expected: 8.0, conservative: 6.0, aggressive: 10.0 },
};

// SEBI disclaimer
export const SEBI_DISCLAIMER = `
Disclaimer: This is educational guidance only, not investment advice. 
Past performance does not guarantee future returns. Mutual fund investments 
are subject to market risks. Please read all scheme related documents carefully 
before investing. Consult a SEBI-registered financial advisor for personalized advice.
`.trim();
