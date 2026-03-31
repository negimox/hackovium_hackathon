"use client";

interface TaxComparisonProps {
  tax: {
    old_regime_tax: number;
    new_regime_tax: number;
    recommended_regime: string;
    savings_amount: number;
    deductions_utilized: Record<string, number>;
    deductions_wasted_in_new: Record<string, number>;
    explanation: string;
  };
}

function formatINR(val: number): string {
  return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function TaxComparison({ tax }: TaxComparisonProps) {
  const isOldBetter = tax.recommended_regime === "old";

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Tax Regime Comparison — FY 2025-26</h3>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-medium ${
            isOldBetter
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {isOldBetter ? "OLD" : "NEW"} Regime Recommended
        </span>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-lg border p-4 ${
            isOldBetter ? "border-primary/40 bg-primary/5" : "border-border/50"
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">Old Regime</p>
          <p className="text-xl font-semibold font-display">{formatINR(tax.old_regime_tax)}</p>
          {isOldBetter && (
            <p className="text-xs text-emerald-400 mt-1">
              Saves {formatINR(tax.savings_amount)}
            </p>
          )}
        </div>
        <div
          className={`rounded-lg border p-4 ${
            !isOldBetter ? "border-primary/40 bg-primary/5" : "border-border/50"
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">New Regime</p>
          <p className="text-xl font-semibold font-display">{formatINR(tax.new_regime_tax)}</p>
          {!isOldBetter && (
            <p className="text-xs text-emerald-400 mt-1">
              Saves {formatINR(tax.savings_amount)}
            </p>
          )}
        </div>
      </div>

      {/* Deductions utilized */}
      {Object.keys(tax.deductions_utilized).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Deductions Utilized (Old Regime)
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tax.deductions_utilized).map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs"
              >
                <span className="text-muted-foreground">{key}:</span>
                <span className="font-medium font-display">{formatINR(val)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <p className="text-sm text-muted-foreground leading-relaxed">{tax.explanation}</p>
    </div>
  );
}
