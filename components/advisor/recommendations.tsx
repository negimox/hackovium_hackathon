"use client";

import { Lightbulb, CheckCircle } from "lucide-react";

interface RecommendationsProps {
  recommendations: string[];
  educationalNotes: string[];
}

export default function Recommendations({
  recommendations,
  educationalNotes,
}: RecommendationsProps) {
  return (
    <div className="space-y-4">
      {/* Key Recommendations */}
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Action Items
        </h3>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 text-sm"
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary
                text-xs font-semibold flex items-center justify-center mt-0.5"
              >
                {i + 1}
              </span>
              <p className="leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Notes */}
      {educationalNotes.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-400">
            <Lightbulb className="w-4 h-4" />
            Why This Plan Works
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {educationalNotes.map((note, i) => (
              <li
                key={i}
                className="leading-relaxed pl-4 border-l-2 border-amber-500/20"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
