import DashboardPageLayout from "@/components/dashboard/layout";
import StockTable from "@/components/investment/stock-table";
import StockDetailCard from "@/components/investment/stock-detail-card";
import AtomIcon from "@/components/icons/atom";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";

const mockData = mockDataJson as MockData;

export default function ResearchPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Research",
        description: "Detailed Stock Analysis & Insights",
        icon: AtomIcon,
      }}
    >
      {/* Featured Stock */}
      {mockData.topStocks && mockData.topStocks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Featured Stock</h2>
          <StockDetailCard stock={mockData.topStocks[0]} />
        </div>
      )}

      {/* All Stocks Table */}
      {mockData.topStocks && (
        <div>
          <StockTable stocks={mockData.topStocks} showActions={true} />
        </div>
      )}
    </DashboardPageLayout>
  );
}
