import DashboardPageLayout from "@/components/dashboard/layout";
import FundComparison from "@/components/investment/fund-comparison";
import ProcessorIcon from "@/components/icons/proccesor";
import type { Fund } from "@/types/dashboard";

async function getFunds(): Promise<Fund[]> {
  try {
    const res = await fetch("http://localhost:3000/api/market/funds", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    // The mutual funds API returns an array directly
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch mutual funds:", error);
    return [];
  }
}

export default async function FundsPage() {
  const funds = await getFunds();

  return (
    <DashboardPageLayout
      header={{
        title: "Mutual Funds & ETFs",
        description: "Compare Returns, Expense Ratios & Performance",
        icon: ProcessorIcon,
      }}
    >
      <FundComparison funds={funds} />
    </DashboardPageLayout>
  );
}
