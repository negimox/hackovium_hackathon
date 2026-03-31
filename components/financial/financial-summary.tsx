"use client";

import { useState } from "react";
import {
  Landmark,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Banknote,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

interface FinancialSummaryProps {
  data: any[];
}

// FI type configuration
const FI_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Landmark; color: string }
> = {
  deposit: { label: "Savings & Current", icon: Landmark, color: "text-blue-500 bg-blue-500/10" },
  term_deposit: { label: "Fixed Deposits", icon: Landmark, color: "text-teal-500 bg-teal-500/10" },
  recurring_deposit: { label: "Recurring Deposits", icon: RefreshCw, color: "text-cyan-500 bg-cyan-500/10" },
  mutual_funds: { label: "Mutual Funds", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
  equities: { label: "Equities", icon: BarChart3, color: "text-violet-500 bg-violet-500/10" },
  etf: { label: "ETFs", icon: PiggyBank, color: "text-amber-500 bg-amber-500/10" },
  insurance_policies: { label: "Insurance", icon: ShieldCheck, color: "text-rose-500 bg-rose-500/10" },
  general_insurance: { label: "General Insurance", icon: ShieldCheck, color: "text-rose-500 bg-rose-500/10" },
  life_insurance: { label: "Life Insurance", icon: ShieldCheck, color: "text-pink-500 bg-pink-500/10" },
  nps: { label: "NPS", icon: PiggyBank, color: "text-orange-500 bg-orange-500/10" },
  sip: { label: "SIP", icon: TrendingUp, color: "text-indigo-500 bg-indigo-500/10" },
  gstr1_3b: { label: "GST Returns", icon: Banknote, color: "text-gray-500 bg-gray-500/10" },
  bonds: { label: "Bonds", icon: Landmark, color: "text-sky-500 bg-sky-500/10" },
};

// Insurance transaction types categorized
const INSURANCE_INFLOW_TYPES = new Set([
  "BONUS", "MONEY_BACK", "CLAIM", "FINAL_SETTLEMENT",
]);
const INSURANCE_OUTFLOW_TYPES = new Set([
  "PREMIUM_PAYMENT", "LATE_FEES", "INSURANCE_RENEWWAL", "PLAN_CHANGE",
]);

// MF transaction type categorization
const MF_INFLOW_TYPES = new Set(["SELL", "DIVIDEND", "REDEMPTION"]);
const MF_OUTFLOW_TYPES = new Set(["BUY", "PURCHASE", "SIP"]);

function formatCurrency(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/**
 * Normalize a SETU account entry.
 * SETU nests: { maskedAccNumber, linkRefNumber, data: { account: { type, profile, summary, transactions } } }
 */
function normalizeAccount(rawAccount: any) {
  const accountData = rawAccount?.data?.account || rawAccount?.account || rawAccount;
  const accountType = (accountData?.type || rawAccount?.fiType || "unknown").toLowerCase();

  // Profile
  const holders =
    accountData?.profile?.holders?.holder ||
    accountData?.Profile?.Holders?.Holder ||
    [];
  const holder = holders?.[0] || {};

  // Summary — varies by FI type
  const summary = accountData?.summary || accountData?.Summary || {};

  // For insurance: extract policy-level data
  const isInsurance = accountType.includes("insurance");
  const isMutualFund = accountType === "mutual_funds";
  const isGST = accountType === "gstr1_3b";

  // Financial value extraction
  let primaryValue: string | null = null;
  let secondaryLabel = "";
  let secondaryValue: string | null = null;

  if (isInsurance) {
    primaryValue = summary?.sumAssured || summary?.coverAmount || null;
    secondaryLabel = "Premium";
    secondaryValue = summary?.premiumAmount || null;
  } else if (isMutualFund) {
    primaryValue = summary?.currentValue || null;
    secondaryLabel = "Cost";
    secondaryValue = summary?.costValue || null;
  } else {
    primaryValue =
      summary?.currentValue || summary?.currentBalance ||
      summary?.maturityAmount || summary?.principalAmount || null;
    secondaryLabel = summary?.interestRate ? `@ ${summary.interestRate}%` : "";
    secondaryValue = null;
  }

  // Transactions
  const txnContainer = accountData?.transactions || accountData?.Transactions || {};
  const transactions = txnContainer?.transaction || txnContainer?.Transaction || [];

  return {
    maskedAccNumber: rawAccount?.maskedAccNumber || accountData?.maskedAccNumber || "••••",
    linkRefNumber: rawAccount?.linkRefNumber || "",
    fiType: accountType,
    fiStatus: rawAccount?.FIstatus || "",

    // Profile
    holderName: holder?.name || holder?.lgnm || "Account Holder",
    holderEmail: holder?.email,
    holderMobile: holder?.mobile,
    holderPan: holder?.pan || holder?.panNumber,
    holderDob: holder?.dob,

    // Summary
    primaryValue,
    secondaryLabel,
    secondaryValue,
    policyName: summary?.policyName,
    policyType: summary?.policyType,
    coverType: summary?.coverType,
    premiumFrequency: summary?.premiumFrequency,
    branch: summary?.branch,
    ifscCode: summary?.ifsc || summary?.ifscCode,
    maturityDate: summary?.maturityDate,

    // Flags
    isInsurance,
    isMutualFund,
    isGST,

    // Transactions
    transactions: Array.isArray(transactions) ? transactions : [],
    raw: accountData,
  };
}

type NormalizedAccount = ReturnType<typeof normalizeAccount>;

function getTransactionDirection(txn: any, account: NormalizedAccount): "in" | "out" | "other" {
  const type = (txn.type || "").toUpperCase();

  if (account.isInsurance) {
    if (INSURANCE_INFLOW_TYPES.has(type)) return "in";
    if (INSURANCE_OUTFLOW_TYPES.has(type)) return "out";
    return "other";
  }

  if (account.isMutualFund) {
    if (MF_INFLOW_TYPES.has(type)) return "in";
    if (MF_OUTFLOW_TYPES.has(type)) return "out";
    return "other";
  }

  // Bank accounts
  if (type === "CREDIT" || type === "INTEREST" || type === "INSTALLMENT") return "in";
  if (type === "DEBIT" || type === "TDS") return "out";
  return "other";
}

function AccountCard({ account }: { account: NormalizedAccount }) {
  const [expanded, setExpanded] = useState(false);

  // Skip GST accounts for the summary view
  if (account.isGST) return null;

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {account.policyName || account.holderName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {account.maskedAccNumber}
            </span>
            {account.fiStatus === "READY" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="capitalize">{account.fiType.replace(/_/g, " ")}</span>
            {account.policyType && (
              <span>• {account.policyType.replace(/_/g, " ")}</span>
            )}
            {account.branch && <span>• {account.branch}</span>}
            {account.ifscCode && <span>• {account.ifscCode}</span>}
            {account.premiumFrequency && (
              <span>• {account.premiumFrequency.replace(/_/g, " ")}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <span className="font-display font-semibold text-sm">
              {formatCurrency(account.primaryValue)}
            </span>
            {account.secondaryValue && (
              <div className="text-xs text-muted-foreground">
                {account.secondaryLabel}: {formatCurrency(account.secondaryValue)}
              </div>
            )}
            {account.secondaryLabel && !account.secondaryValue && (
              <div className="text-xs text-muted-foreground">
                {account.secondaryLabel}
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-4 py-3 space-y-3">
          {/* Profile info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {account.holderEmail && (
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span>{account.holderEmail}</span>
              </div>
            )}
            {account.holderPan && (
              <div>
                <span className="text-muted-foreground">PAN:</span>{" "}
                <span className="font-mono">{account.holderPan}</span>
              </div>
            )}
            {account.holderMobile && (
              <div>
                <span className="text-muted-foreground">Mobile:</span>{" "}
                <span>{account.holderMobile}</span>
              </div>
            )}
            {account.maturityDate && (
              <div>
                <span className="text-muted-foreground">Maturity:</span>{" "}
                <span>
                  {new Date(account.maturityDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Transactions */}
          {account.transactions.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Recent Transactions ({account.transactions.length})
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {account.transactions.slice(0, 15).map((txn: any, i: number) => {
                  const direction = getTransactionDirection(txn, account);
                  const amount = txn.amount || txn.transactionAmount || "0";
                  const timestamp =
                    txn.transactionTimestamp || txn.txnDate ||
                    txn.transactionDate || txn.valueDate || "";
                  const narration =
                    txn.narration || txn.description || txn.remarks || "Transaction";
                  const txnType = (txn.type || "").replace(/_/g, " ");

                  return (
                    <div
                      key={txn.txnId || txn.transactionId || i}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate block max-w-[250px]">{narration}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0 capitalize">
                            {txnType.toLowerCase()}
                          </span>
                        </div>
                        {timestamp && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(timestamp).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-display font-medium shrink-0 ${
                          direction === "in"
                            ? "text-emerald-500"
                            : direction === "out"
                            ? "text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {direction === "in" ? "+" : direction === "out" ? "−" : ""}
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No transaction data available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinancialSummary({ data }: FinancialSummaryProps) {
  // Normalize all accounts from all FIPs
  const allNormalized: NormalizedAccount[] = [];

  if (!data || !Array.isArray(data)) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
        <p className="text-muted-foreground text-sm">
          No valid account aggregator data available.
        </p>
      </div>
    );
  }

  for (const fipData of data) {
    const accounts: any[] =
      fipData.data || fipData.accounts || fipData.Accounts || [];

    if (!Array.isArray(accounts)) continue;

    for (const rawAccount of accounts) {
      if (rawAccount?.maskedAccNumber?.includes("FAILURE")) continue;

      const normalized = normalizeAccount(rawAccount);
      // Skip GST from aggregation
      if (normalized.isGST) continue;
      allNormalized.push(normalized);
    }
  }

  // Group by FI type
  const accountsByType: Record<string, NormalizedAccount[]> = {};
  for (const acc of allNormalized) {
    const type = acc.fiType;
    if (!accountsByType[type]) accountsByType[type] = [];
    accountsByType[type].push(acc);
  }

  const fiTypes = Object.keys(accountsByType);
  const [activeTab, setActiveTab] = useState(fiTypes[0] || "");

  if (fiTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No financial data available</p>
      </div>
    );
  }

  // Totals per type
  const typeTotals = fiTypes.map((type) => {
    const accounts = accountsByType[type];
    let total = 0;
    for (const acc of accounts) {
      total += parseFloat(acc.primaryValue || "0") || 0;
    }
    return { type, total, count: accounts.length };
  });

  const grandTotal = typeTotals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Net Worth</p>
          <p className="text-xl font-bold font-display">
            {formatCurrency(grandTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {allNormalized.length} accounts
          </p>
        </div>
        {typeTotals.map(({ type, total, count }) => {
          const config = FI_TYPE_CONFIG[type] || {
            label: type.replace(/_/g, " "),
            icon: Landmark,
            color: "text-muted-foreground bg-muted",
          };
          const Icon = config.icon;
          return (
            <div key={type} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {config.label}
                </span>
              </div>
              <p className="font-bold font-display">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {count} account{count !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tab navigation */}
      {fiTypes.length > 1 && (
        <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {fiTypes.map((type) => {
            const config = FI_TYPE_CONFIG[type] || { label: type.replace(/_/g, " ") };
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveTab(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  activeTab === type
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Account cards */}
      <div className="space-y-3">
        {(accountsByType[activeTab] || []).map((account, i) => (
          <AccountCard key={account.linkRefNumber || i} account={account} />
        ))}
      </div>
    </div>
  );
}
