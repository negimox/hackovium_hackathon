import DashboardPageLayout from "@/components/dashboard/layout";
import StockScreener from "@/components/investment/stock-screener";
import EmailIcon from "@/components/icons/email";
import type { Stock } from "@/types/dashboard";

async function getStocks(): Promise<Stock[]> {
  // Try to fetch from Next.js API route first. If it fails during build time,
  // return an empty array and it will retry on mount if we used swr, but since it's server component
  // we just fetch directly from the absolute URL if possible.
  try {
    const res = await fetch("http://localhost:3000/api/market/stocks", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    
    // The Python response for NSE is a dictionary where keys are stock symbols
    // and values are stock objects. The Screener component expects an array of Stocks.
    const data = await res.json();
    
    // Convert object to array
    const stocksArray: Stock[] = Object.values(data);
    return stocksArray.filter((stock) => stock && stock.symbol);
  } catch (error) {
    console.error("Failed to fetch stocks:", error);
    return [];
  }
}

export default async function ScreenerPage() {
  const stocks = await getStocks();

  return (
    <DashboardPageLayout
      header={{
        title: "Stock Screener",
        description: "Filter & Find Stocks Based on Your Criteria",
        icon: EmailIcon,
      }}
    >
      <StockScreener stocks={stocks} />
    </DashboardPageLayout>
  );
}
