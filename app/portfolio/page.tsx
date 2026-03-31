import DashboardPageLayout from "@/components/dashboard/layout";
import PortfolioOverview from "@/components/investment/portfolio-overview";
import PortfolioHoldings from "@/components/investment/portfolio-holdings";
import DashboardChart from "@/components/dashboard/chart";
import ProcessorIcon from "@/components/icons/proccesor";
import BrokerConnect from "@/components/investment/broker-connect";
import ConnectOverlay from "@/components/investment/connect-overlay";
import { getPortfolioData, computeExchangeAllocation } from "@/lib/services/portfolio-service";
import type { PortfolioStats, PortfolioHolding as DashboardHolding } from "@/types/dashboard";

const placeholderPortfolioStats: PortfolioStats = {
  totalValue: 0,
  totalInvested: 0,
  totalGainLoss: 0,
  totalGainLossPercent: 0,
  dayChange: 0,
  dayChangePercent: 0,
  sectorAllocation: {},
  holdings: []
};

export default async function PortfolioPage() {
  const { holdings: brokerHoldings, userProfile, connectedBrokerName, chartData, isConnected } =
    await getPortfolioData({ includeChart: true });

  // Transform to Dashboard Format
  const dashboardHoldings: DashboardHolding[] = brokerHoldings.map((h, index) => {
    const totalPnlPercent = h.investedValue ? (h.pnl / h.investedValue) * 100 : 0;
    return {
      id: `${h.broker}-${h.symbol}-${index}`,
      symbol: h.symbol,
      name: h.companyName || h.symbol,
      quantity: h.quantity,
      buyPrice: h.averagePrice,
      currentPrice: h.currentPrice,
      value: h.currentValue,
      gainLoss: h.pnl,
      gainLossPercent: totalPnlPercent,
      type: "stock"
    };
  });

  // Aggregate Metrics
  const totalValue = dashboardHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalInvested = dashboardHoldings.reduce((sum, h) => sum + (h.quantity * h.buyPrice), 0);
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercent = totalInvested ? (totalGainLoss / totalInvested) * 100 : 0;
  
  const dayPnl = brokerHoldings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0);
  const dayPnlPercentage = totalValue ? (dayPnl / totalValue) * 100 : 0;

  const portfolioStats: PortfolioStats = {
    totalValue,
    totalInvested,
    totalGainLoss,
    totalGainLossPercent,
    dayChange: dayPnl,
    dayChangePercent: dayPnlPercentage,
    sectorAllocation: computeExchangeAllocation(brokerHoldings),
    holdings: dashboardHoldings
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Portfolio",
        description: "Your Investment Holdings & Performance",
        icon: ProcessorIcon,
      }}
    >
      {/* Portfolio content — wrapped in overlay when disconnected */}
      <ConnectOverlay isConnected={isConnected}>
        <div className="space-y-6">
          {/* Portfolio Performance Chart */}
          <div className="bg-card rounded-lg border border-border/50 p-4">
            <DashboardChart data={chartData} />
          </div>

          {/* Summary Section */}
          <PortfolioOverview portfolio={isConnected ? portfolioStats : placeholderPortfolioStats} />
          
          {/* Detailed Holdings */}
          <PortfolioHoldings holdings={dashboardHoldings} />
        </div>
      </ConnectOverlay>

      {/* Manage Connections — always visible */}
      {isConnected && (
        <div className="mt-8 pt-8 border-t">
          <h4 className="text-sm font-medium mb-4">Manage Connections</h4>
          <BrokerConnect connectedAccount={userProfile} brokerName={connectedBrokerName} />
        </div>
      )}
    </DashboardPageLayout>
  );
}
