/**
 * Curated mutual fund data for educational recommendations.
 * Ported from ET_Hackathon/tools/mutual_fund_data.py
 *
 * Data sources: Value Research, Morningstar India (as of Q1 2026)
 * Note: Past performance does not guarantee future results.
 */

import type {
  FundRecommendation,
  FundOptions,
} from "../schemas/financial-plan";
import { CATEGORY_EXPECTED_RETURNS } from "./constants";

// ─────────────────────────────────────────────────────────────
// FUND DATA TYPES
// ─────────────────────────────────────────────────────────────

export interface MutualFund {
  name: string;
  isin: string;
  category: "large_cap" | "mid_cap" | "small_cap" | "debt" | "gold";
  sub_category: string;
  amc: string;
  risk_level: "low" | "moderate" | "high" | "very_high";
  expense_ratio_pct: number;
  aum_cr: number;
  returns_1y_pct: number;
  returns_3y_pct: number;
  returns_5y_pct: number;
  min_sip_amount: number;
  benchmark: string;
  rating: number;
}

// ─────────────────────────────────────────────────────────────
// CURATED FUND DATA (Updated: March 2026)
// ─────────────────────────────────────────────────────────────

export const LARGE_CAP_FUNDS: MutualFund[] = [
  {
    name: "UTI Nifty 50 Index Fund Direct Growth",
    isin: "INF789FC1GL6",
    category: "large_cap",
    sub_category: "index",
    amc: "UTI",
    risk_level: "moderate",
    expense_ratio_pct: 0.18,
    aum_cr: 18500,
    returns_1y_pct: 14.2,
    returns_3y_pct: 15.8,
    returns_5y_pct: 14.5,
    min_sip_amount: 500,
    benchmark: "Nifty 50 TRI",
    rating: 5,
  },
  {
    name: "HDFC Index Fund Nifty 50 Plan Direct Growth",
    isin: "INF179KA1BP0",
    category: "large_cap",
    sub_category: "index",
    amc: "HDFC",
    risk_level: "moderate",
    expense_ratio_pct: 0.2,
    aum_cr: 12800,
    returns_1y_pct: 14.0,
    returns_3y_pct: 15.6,
    returns_5y_pct: 14.3,
    min_sip_amount: 500,
    benchmark: "Nifty 50 TRI",
    rating: 5,
  },
  {
    name: "Nippon India Large Cap Fund Direct Growth",
    isin: "INF204KB1FA4",
    category: "large_cap",
    sub_category: "active",
    amc: "Nippon India",
    risk_level: "moderate",
    expense_ratio_pct: 0.85,
    aum_cr: 22300,
    returns_1y_pct: 16.5,
    returns_3y_pct: 17.2,
    returns_5y_pct: 15.8,
    min_sip_amount: 500,
    benchmark: "Nifty 100 TRI",
    rating: 4,
  },
  {
    name: "ICICI Prudential Bluechip Fund Direct Growth",
    isin: "INF109KA1MO1",
    category: "large_cap",
    sub_category: "active",
    amc: "ICICI Prudential",
    risk_level: "moderate",
    expense_ratio_pct: 0.98,
    aum_cr: 51200,
    returns_1y_pct: 15.8,
    returns_3y_pct: 16.4,
    returns_5y_pct: 15.2,
    min_sip_amount: 500,
    benchmark: "Nifty 100 TRI",
    rating: 4,
  },
  {
    name: "SBI Bluechip Fund Direct Growth",
    isin: "INF200KA1H75",
    category: "large_cap",
    sub_category: "active",
    amc: "SBI",
    risk_level: "moderate",
    expense_ratio_pct: 0.92,
    aum_cr: 46800,
    returns_1y_pct: 14.9,
    returns_3y_pct: 15.9,
    returns_5y_pct: 14.7,
    min_sip_amount: 500,
    benchmark: "S&P BSE 100 TRI",
    rating: 4,
  },
];

export const MID_CAP_FUNDS: MutualFund[] = [
  {
    name: "Motilal Oswal Nifty Midcap 150 Index Fund Direct Growth",
    isin: "INF247L01AE5",
    category: "mid_cap",
    sub_category: "index",
    amc: "Motilal Oswal",
    risk_level: "high",
    expense_ratio_pct: 0.3,
    aum_cr: 8200,
    returns_1y_pct: 22.5,
    returns_3y_pct: 24.8,
    returns_5y_pct: 19.2,
    min_sip_amount: 500,
    benchmark: "Nifty Midcap 150 TRI",
    rating: 5,
  },
  {
    name: "UTI Nifty Next 50 Index Fund Direct Growth",
    isin: "INF789FA1MO7",
    category: "mid_cap",
    sub_category: "index",
    amc: "UTI",
    risk_level: "high",
    expense_ratio_pct: 0.32,
    aum_cr: 6500,
    returns_1y_pct: 18.2,
    returns_3y_pct: 19.5,
    returns_5y_pct: 16.8,
    min_sip_amount: 500,
    benchmark: "Nifty Next 50 TRI",
    rating: 4,
  },
  {
    name: "Kotak Emerging Equity Fund Direct Growth",
    isin: "INF174KA1EN9",
    category: "mid_cap",
    sub_category: "active",
    amc: "Kotak",
    risk_level: "high",
    expense_ratio_pct: 0.58,
    aum_cr: 38500,
    returns_1y_pct: 25.8,
    returns_3y_pct: 26.2,
    returns_5y_pct: 21.5,
    min_sip_amount: 500,
    benchmark: "Nifty Midcap 150 TRI",
    rating: 5,
  },
  {
    name: "Axis Midcap Fund Direct Growth",
    isin: "INF846K01EJ3",
    category: "mid_cap",
    sub_category: "active",
    amc: "Axis",
    risk_level: "high",
    expense_ratio_pct: 0.52,
    aum_cr: 25600,
    returns_1y_pct: 20.4,
    returns_3y_pct: 21.8,
    returns_5y_pct: 18.9,
    min_sip_amount: 500,
    benchmark: "Nifty Midcap 150 TRI",
    rating: 4,
  },
  {
    name: "HDFC Mid-Cap Opportunities Fund Direct Growth",
    isin: "INF179KB1CC5",
    category: "mid_cap",
    sub_category: "active",
    amc: "HDFC",
    risk_level: "high",
    expense_ratio_pct: 0.88,
    aum_cr: 62400,
    returns_1y_pct: 24.2,
    returns_3y_pct: 25.5,
    returns_5y_pct: 20.8,
    min_sip_amount: 500,
    benchmark: "Nifty Midcap 150 TRI",
    rating: 4,
  },
];

export const SMALL_CAP_FUNDS: MutualFund[] = [
  {
    name: "Motilal Oswal Nifty Smallcap 250 Index Fund Direct Growth",
    isin: "INF247L01BF1",
    category: "small_cap",
    sub_category: "index",
    amc: "Motilal Oswal",
    risk_level: "very_high",
    expense_ratio_pct: 0.36,
    aum_cr: 3200,
    returns_1y_pct: 28.5,
    returns_3y_pct: 30.2,
    returns_5y_pct: 22.5,
    min_sip_amount: 500,
    benchmark: "Nifty Smallcap 250 TRI",
    rating: 4,
  },
  {
    name: "Nippon India Small Cap Fund Direct Growth",
    isin: "INF204KB1GD0",
    category: "small_cap",
    sub_category: "active",
    amc: "Nippon India",
    risk_level: "very_high",
    expense_ratio_pct: 0.78,
    aum_cr: 52000,
    returns_1y_pct: 32.5,
    returns_3y_pct: 35.8,
    returns_5y_pct: 28.2,
    min_sip_amount: 500,
    benchmark: "Nifty Smallcap 250 TRI",
    rating: 5,
  },
  {
    name: "Axis Small Cap Fund Direct Growth",
    isin: "INF846K01F51",
    category: "small_cap",
    sub_category: "active",
    amc: "Axis",
    risk_level: "very_high",
    expense_ratio_pct: 0.58,
    aum_cr: 18500,
    returns_1y_pct: 26.8,
    returns_3y_pct: 28.5,
    returns_5y_pct: 24.2,
    min_sip_amount: 500,
    benchmark: "Nifty Smallcap 250 TRI",
    rating: 4,
  },
  {
    name: "SBI Small Cap Fund Direct Growth",
    isin: "INF200KA1MR2",
    category: "small_cap",
    sub_category: "active",
    amc: "SBI",
    risk_level: "very_high",
    expense_ratio_pct: 0.72,
    aum_cr: 28600,
    returns_1y_pct: 29.5,
    returns_3y_pct: 31.2,
    returns_5y_pct: 25.8,
    min_sip_amount: 500,
    benchmark: "S&P BSE SmallCap TRI",
    rating: 4,
  },
  {
    name: "Kotak Small Cap Fund Direct Growth",
    isin: "INF174KA1GN5",
    category: "small_cap",
    sub_category: "active",
    amc: "Kotak",
    risk_level: "very_high",
    expense_ratio_pct: 0.62,
    aum_cr: 15800,
    returns_1y_pct: 27.2,
    returns_3y_pct: 29.8,
    returns_5y_pct: 23.5,
    min_sip_amount: 500,
    benchmark: "Nifty Smallcap 250 TRI",
    rating: 4,
  },
];

export const DEBT_FUNDS: MutualFund[] = [
  {
    name: "HDFC Low Duration Fund Direct Growth",
    isin: "INF179KB1DH3",
    category: "debt",
    sub_category: "low_duration",
    amc: "HDFC",
    risk_level: "low",
    expense_ratio_pct: 0.35,
    aum_cr: 18500,
    returns_1y_pct: 7.8,
    returns_3y_pct: 6.5,
    returns_5y_pct: 6.8,
    min_sip_amount: 500,
    benchmark: "CRISIL Low Duration Fund Index",
    rating: 5,
  },
  {
    name: "ICICI Prudential Short Term Fund Direct Growth",
    isin: "INF109KA1BU7",
    category: "debt",
    sub_category: "short_duration",
    amc: "ICICI Prudential",
    risk_level: "low",
    expense_ratio_pct: 0.42,
    aum_cr: 22800,
    returns_1y_pct: 8.2,
    returns_3y_pct: 7.1,
    returns_5y_pct: 7.4,
    min_sip_amount: 500,
    benchmark: "CRISIL Short Term Bond Fund Index",
    rating: 5,
  },
  {
    name: "Axis Banking & PSU Debt Fund Direct Growth",
    isin: "INF846K01HE2",
    category: "debt",
    sub_category: "banking_psu",
    amc: "Axis",
    risk_level: "low",
    expense_ratio_pct: 0.38,
    aum_cr: 12600,
    returns_1y_pct: 7.5,
    returns_3y_pct: 6.8,
    returns_5y_pct: 7.1,
    min_sip_amount: 500,
    benchmark: "CRISIL Banking & PSU Debt Index",
    rating: 4,
  },
  {
    name: "SBI Magnum Medium Duration Fund Direct Growth",
    isin: "INF200KA1MS0",
    category: "debt",
    sub_category: "medium_duration",
    amc: "SBI",
    risk_level: "moderate",
    expense_ratio_pct: 0.68,
    aum_cr: 9800,
    returns_1y_pct: 8.5,
    returns_3y_pct: 7.4,
    returns_5y_pct: 7.8,
    min_sip_amount: 500,
    benchmark: "CRISIL Medium Duration Debt Index",
    rating: 4,
  },
  {
    name: "Kotak Corporate Bond Fund Direct Growth",
    isin: "INF174KA1KH0",
    category: "debt",
    sub_category: "corporate_bond",
    amc: "Kotak",
    risk_level: "low",
    expense_ratio_pct: 0.35,
    aum_cr: 14200,
    returns_1y_pct: 7.9,
    returns_3y_pct: 6.9,
    returns_5y_pct: 7.2,
    min_sip_amount: 500,
    benchmark: "CRISIL Corporate Bond Fund Index",
    rating: 5,
  },
];

export const GOLD_FUNDS: MutualFund[] = [
  {
    name: "Nippon India Gold Savings Fund Direct Growth",
    isin: "INF204KB1HE7",
    category: "gold",
    sub_category: "gold_fund",
    amc: "Nippon India",
    risk_level: "moderate",
    expense_ratio_pct: 0.25,
    aum_cr: 2800,
    returns_1y_pct: 12.5,
    returns_3y_pct: 9.8,
    returns_5y_pct: 10.2,
    min_sip_amount: 500,
    benchmark: "Domestic Price of Gold",
    rating: 4,
  },
  {
    name: "HDFC Gold Fund Direct Growth",
    isin: "INF179KC1AB2",
    category: "gold",
    sub_category: "gold_fund",
    amc: "HDFC",
    risk_level: "moderate",
    expense_ratio_pct: 0.3,
    aum_cr: 2200,
    returns_1y_pct: 12.2,
    returns_3y_pct: 9.5,
    returns_5y_pct: 9.8,
    min_sip_amount: 500,
    benchmark: "Domestic Price of Gold",
    rating: 4,
  },
  {
    name: "SBI Gold Fund Direct Growth",
    isin: "INF200KA1MQ4",
    category: "gold",
    sub_category: "gold_fund",
    amc: "SBI",
    risk_level: "moderate",
    expense_ratio_pct: 0.28,
    aum_cr: 1850,
    returns_1y_pct: 12.0,
    returns_3y_pct: 9.4,
    returns_5y_pct: 9.6,
    min_sip_amount: 500,
    benchmark: "Domestic Price of Gold",
    rating: 4,
  },
  {
    name: "ICICI Prudential Gold Fund Direct Growth",
    isin: "INF109KA1JE8",
    category: "gold",
    sub_category: "gold_fund",
    amc: "ICICI Prudential",
    risk_level: "moderate",
    expense_ratio_pct: 0.32,
    aum_cr: 1650,
    returns_1y_pct: 11.8,
    returns_3y_pct: 9.2,
    returns_5y_pct: 9.4,
    min_sip_amount: 500,
    benchmark: "Domestic Price of Gold",
    rating: 4,
  },
  {
    name: "Axis Gold Fund Direct Growth",
    isin: "INF846K01JK5",
    category: "gold",
    sub_category: "gold_fund",
    amc: "Axis",
    risk_level: "moderate",
    expense_ratio_pct: 0.35,
    aum_cr: 980,
    returns_1y_pct: 11.5,
    returns_3y_pct: 9.0,
    returns_5y_pct: 9.2,
    min_sip_amount: 500,
    benchmark: "Domestic Price of Gold",
    rating: 3,
  },
];

// ─────────────────────────────────────────────────────────────
// CATEGORY MAPPING
// ─────────────────────────────────────────────────────────────

export const FUNDS_BY_CATEGORY: Record<string, MutualFund[]> = {
  large_cap: LARGE_CAP_FUNDS,
  mid_cap: MID_CAP_FUNDS,
  small_cap: SMALL_CAP_FUNDS,
  debt: DEBT_FUNDS,
  gold: GOLD_FUNDS,
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Get top N funds for a given category.
 */
export function getFundsByCategory(
  category: string,
  topN: number = 5,
): MutualFund[] {
  const funds = FUNDS_BY_CATEGORY[category] || [];
  return funds.slice(0, topN);
}

/**
 * Convert MutualFund to FundRecommendation schema format.
 */
export function toFundRecommendation(fund: MutualFund): FundRecommendation {
  const expectedReturn =
    CATEGORY_EXPECTED_RETURNS[fund.category]?.expected || 10;

  return {
    name: fund.name,
    isin: fund.isin,
    category: fund.category,
    amc: fund.amc,
    risk_level: fund.risk_level,
    expense_ratio_pct: fund.expense_ratio_pct,
    returns_1y_pct: fund.returns_1y_pct,
    returns_3y_pct: fund.returns_3y_pct,
    returns_5y_pct: fund.returns_5y_pct,
    expected_return_pct: expectedReturn,
    min_sip_amount: fund.min_sip_amount,
    rating: fund.rating,
  };
}

/**
 * Get fund options for all categories (for plan output).
 */
export function getAllFundOptions(topN: number = 3): FundOptions {
  return {
    large_cap_funds: getFundsByCategory("large_cap", topN).map(
      toFundRecommendation,
    ),
    mid_cap_funds: getFundsByCategory("mid_cap", topN).map(
      toFundRecommendation,
    ),
    small_cap_funds: getFundsByCategory("small_cap", topN).map(
      toFundRecommendation,
    ),
    debt_funds: getFundsByCategory("debt", topN).map(toFundRecommendation),
    gold_funds: getFundsByCategory("gold", topN).map(toFundRecommendation),
  };
}

/**
 * Search funds with filters.
 */
export function searchFunds(options: {
  query?: string;
  category?: string;
  maxExpenseRatio?: number;
  minRating?: number;
}): MutualFund[] {
  const { query, category, maxExpenseRatio, minRating = 0 } = options;

  let funds: MutualFund[] = [];

  if (category) {
    funds = FUNDS_BY_CATEGORY[category] || [];
  } else {
    for (const catFunds of Object.values(FUNDS_BY_CATEGORY)) {
      funds.push(...catFunds);
    }
  }

  return funds.filter((fund) => {
    if (query) {
      const queryLower = query.toLowerCase();
      if (
        !fund.name.toLowerCase().includes(queryLower) &&
        !fund.amc.toLowerCase().includes(queryLower)
      ) {
        return false;
      }
    }

    if (
      maxExpenseRatio !== undefined &&
      fund.expense_ratio_pct > maxExpenseRatio
    ) {
      return false;
    }

    if (fund.rating < minRating) {
      return false;
    }

    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// DATA FRESHNESS
// ─────────────────────────────────────────────────────────────

export const DATA_LAST_UPDATED = new Date("2026-03-15");
export const DATA_VERSION = "2026-Q1";

export function getDataFreshness(): {
  last_updated: string;
  version: string;
  disclaimer: string;
} {
  return {
    last_updated: DATA_LAST_UPDATED.toISOString(),
    version: DATA_VERSION,
    disclaimer:
      "Fund performance data is historical and based on publicly available information. " +
      "Past performance does not guarantee future results. Please verify current NAV and " +
      "returns from official AMC websites before investing.",
  };
}
