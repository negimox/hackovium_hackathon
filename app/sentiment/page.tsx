import DashboardPageLayout from "@/components/dashboard/layout";
import MarketMoodIndex from "@/components/investment/market-mood-index";
import CuteRobotIcon from "@/components/icons/cute-robot";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";

const mockData = mockDataJson as MockData;

export default function SentimentPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Market Sentiment",
        description: "Real-time Market Mood Index & Analysis",
        icon: CuteRobotIcon,
      }}
    >
      {mockData.marketMood && (
        <div>
          <MarketMoodIndex mood={mockData.marketMood} />
        </div>
      )}

      {/* Sentiment Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <Bullet />
            Understanding Market Mood
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-success">Bullish Signals (70-100)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Strong buying interest from investors</li>
                <li>Positive economic indicators</li>
                <li>High market participation</li>
                <li>Breadth improving significantly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-600">Neutral Zone (40-60)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Balanced buying and selling</li>
                <li>Market consolidation phase</li>
                <li>Volatility may increase</li>
                <li>Direction unclear</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-destructive">Bearish Signals (0-30)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Strong selling pressure</li>
                <li>Negative investor sentiment</li>
                <li>Weak market participation</li>
                <li>Declining breadth</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Key Metrics to Monitor</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Volatility Index (VIX)</li>
                <li>Advance/Decline Ratio</li>
                <li>Market Breadth</li>
                <li>Put/Call Ratio</li>
              </ul>
            </div>
          </div>

          <div className="bg-accent/50 rounded p-4 border border-border">
            <h4 className="font-semibold mb-2">Tips for Using Market Sentiment</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Use sentiment as a confirmation tool, not sole indicator</li>
              <li>Extreme readings often signal reversals</li>
              <li>Combine with technical and fundamental analysis</li>
              <li>Monitor trend changes for early signals</li>
              <li>Consider sector-specific sentiment alongside overall market</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </DashboardPageLayout>
  );
}
