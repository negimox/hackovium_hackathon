/**
 * Tax calculator for Indian income tax.
 * Compares Old vs New regime for FY 2025-26.
 * Ported from ET_Hackathon/tools/tax_calculator.py
 */

import { FINANCIAL_CONSTANTS as FC } from "./constants";
import type { TaxComparison } from "../schemas/financial-plan";

export interface TaxCalcInput {
  annual_income: number;
  epf_contribution?: number;
  ppf_contribution?: number;
  elss_investment?: number;
  nps_contribution?: number;
  employer_nps?: number;
  lic_premium?: number;
  health_insurance_self?: number;
  health_insurance_parents?: number;
  parents_are_senior?: boolean;
  home_loan_interest?: number;
  hra_received?: number;
  rent_paid?: number;
  is_metro?: boolean;
  other_80c?: number;
}

interface TaxSlab {
  upto: number | null;
  rate_pct: number;
}

function computeTaxOnSlabs(taxable: number, slabs: readonly TaxSlab[]): number {
  let tax = 0;
  let prevLimit = 0;

  for (const slab of slabs) {
    const upper = slab.upto ?? Infinity;
    const rate = slab.rate_pct / 100;

    if (taxable <= prevLimit) break;

    const bracket = Math.min(taxable, upper) - prevLimit;
    if (bracket > 0) {
      tax += bracket * rate;
    }
    prevLimit = upper;
  }

  return tax;
}

function applyCess(tax: number): number {
  // 4% Health and Education Cess
  return tax * 1.04;
}

function calculateHRAExemption(params: TaxCalcInput): number {
  const {
    hra_received = 0,
    rent_paid = 0,
    annual_income,
    is_metro = true,
  } = params;

  if (hra_received <= 0 || rent_paid <= 0) return 0;

  // Approximate basic as 40% of CTC
  const basic = annual_income * 0.4;
  const metroPct = is_metro
    ? FC.hra_exemption_metro_pct
    : FC.hra_exemption_nonmetro_pct;

  // HRA exemption = min of:
  // 1. Actual HRA received
  // 2. 50%/40% of basic (metro/non-metro)
  // 3. Rent paid - 10% of basic
  const option1 = hra_received;
  const option2 = (basic * metroPct) / 100;
  const option3 = Math.max(0, rent_paid - 0.1 * basic);

  return Math.min(option1, option2, option3);
}

export function calculateTaxComparison(params: TaxCalcInput): TaxComparison {
  const {
    annual_income,
    epf_contribution = 0,
    ppf_contribution = 0,
    elss_investment = 0,
    nps_contribution = 0,
    employer_nps = 0,
    lic_premium = 0,
    health_insurance_self = 0,
    health_insurance_parents = 0,
    parents_are_senior = false,
    home_loan_interest = 0,
    other_80c = 0,
  } = params;

  // ══════════════════════════════════════════════════════
  // OLD REGIME
  // ══════════════════════════════════════════════════════
  const oldDeductions: Record<string, number> = {};

  // Standard deduction
  oldDeductions["standard_deduction"] = FC.old_regime_standard_deduction;

  // Section 80C (capped at ₹1.5L)
  const total80C = Math.min(
    FC.section_80c_limit,
    epf_contribution +
      ppf_contribution +
      elss_investment +
      lic_premium +
      other_80c,
  );
  oldDeductions["80C"] = total80C;

  // Section 80CCD(1B) — NPS additional (capped ₹50K)
  const nps1B = Math.min(FC.section_80ccd_1b_limit, nps_contribution);
  oldDeductions["80CCD(1B)"] = nps1B;

  // Section 80CCD(2) — Employer NPS (10% of basic/CTC)
  const employerNpsLimit = (annual_income * FC.section_80ccd_2_limit_pct) / 100;
  const employerNpsDeduction = Math.min(employerNpsLimit, employer_nps);
  oldDeductions["80CCD(2)_employer"] = employerNpsDeduction;

  // Section 80D — Health insurance
  const healthSelf = Math.min(FC.section_80d_self_limit, health_insurance_self);
  const parentLimit = parents_are_senior
    ? FC.section_80d_parents_senior_limit
    : FC.section_80d_parents_limit;
  const healthParents = Math.min(parentLimit, health_insurance_parents);
  oldDeductions["80D_self"] = healthSelf;
  oldDeductions["80D_parents"] = healthParents;

  // Section 24 — Home loan interest (max ₹2L)
  const sec24 = Math.min(FC.section_24_home_loan_limit, home_loan_interest);
  oldDeductions["section_24_home_loan"] = sec24;

  // HRA exemption
  const hraExempt = calculateHRAExemption(params);
  oldDeductions["HRA_exemption"] = hraExempt;

  const totalOldDeductions = Object.values(oldDeductions).reduce(
    (a, b) => a + b,
    0,
  );
  const oldTaxable = Math.max(0, annual_income - totalOldDeductions);

  let oldTax = computeTaxOnSlabs(oldTaxable, FC.tax_slabs_old_regime_fy2526);

  // Section 87A rebate (old regime)
  if (oldTaxable <= FC.old_regime_87a_income_limit) {
    oldTax = Math.max(0, oldTax - FC.old_regime_87a_rebate_limit);
  }

  const oldTaxWithCess = applyCess(oldTax);

  // ══════════════════════════════════════════════════════
  // NEW REGIME
  // ══════════════════════════════════════════════════════
  const newDeductions: Record<string, number> = {};

  // Standard deduction (₹75K in new regime)
  newDeductions["standard_deduction"] = FC.new_regime_standard_deduction;

  // Only 80CCD(2) employer NPS is allowed in new regime
  newDeductions["80CCD(2)_employer"] = employerNpsDeduction;

  const totalNewDeductions = Object.values(newDeductions).reduce(
    (a, b) => a + b,
    0,
  );
  const newTaxable = Math.max(0, annual_income - totalNewDeductions);

  let newTax = computeTaxOnSlabs(newTaxable, FC.tax_slabs_new_regime_fy2526);

  // Section 87A rebate (new regime — up to ₹60K for income ≤ ₹12L)
  if (newTaxable <= FC.new_regime_87a_income_limit) {
    newTax = Math.max(0, newTax - FC.new_regime_87a_rebate_limit);
  }

  const newTaxWithCess = applyCess(newTax);

  // ══════════════════════════════════════════════════════
  // COMPARISON
  // ══════════════════════════════════════════════════════
  const savings = Math.abs(oldTaxWithCess - newTaxWithCess);
  const recommended: "old" | "new" =
    oldTaxWithCess < newTaxWithCess ? "old" : "new";

  // Deductions wasted if choosing new regime
  const wasted: Record<string, number> = {};
  for (const [key, value] of Object.entries(oldDeductions)) {
    if (!(key in newDeductions) && value > 0) {
      wasted[key] = value;
    }
  }

  // Build explanation
  let explanation: string;
  if (recommended === "old") {
    explanation = `The Old Regime saves ₹${savings.toLocaleString("en-IN")} because your total deductions (₹${totalOldDeductions.toLocaleString("en-IN")}) significantly reduce your taxable income. Key deductions: 80C=₹${total80C.toLocaleString("en-IN")}, HRA=₹${hraExempt.toLocaleString("en-IN")}, Home Loan=₹${sec24.toLocaleString("en-IN")}.`;
  } else {
    explanation = `The New Regime saves ₹${savings.toLocaleString("en-IN")} because its lower slab rates outweigh the deductions you can claim (₹${totalOldDeductions.toLocaleString("en-IN")}). The crossover typically happens when total deductions are below ~₹3.75L.`;
  }

  return {
    old_regime_tax: Math.round(oldTaxWithCess * 100) / 100,
    new_regime_tax: Math.round(newTaxWithCess * 100) / 100,
    recommended_regime: recommended,
    savings_amount: Math.round(savings * 100) / 100,
    deductions_utilized: oldDeductions,
    deductions_wasted_in_new: wasted,
    explanation,
  };
}
