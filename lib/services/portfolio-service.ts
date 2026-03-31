import { cookies } from "next/headers";
import { getAllBrokers, decryptToken, PortfolioHolding as BrokerHolding, UserProfile, IBrokerProvider } from "@/lib/brokers";
import { generatePortfolioHistory } from "@/lib/brokers/history-helper";
import type { ChartData } from "@/types/dashboard";

export interface PortfolioData {
  holdings: BrokerHolding[];
  userProfile: UserProfile | null;
  connectedBrokerName: string;
  chartData?: ChartData;
  isConnected: boolean;
}

/**
 * Shared server-side portfolio data fetcher.
 * Used by both the dashboard (/) and portfolio (/portfolio) pages.
 */
export async function getPortfolioData(options?: { includeChart?: boolean }): Promise<PortfolioData> {
  const cookieStore = await cookies();
  const brokers = getAllBrokers();
  const allHoldings: BrokerHolding[] = [];
  let userProfile: UserProfile | null = null;
  let connectedBrokerName = '';
  let chartData: ChartData | undefined;

  for (const provider of brokers) {
    const cookieName = `broker_token_${provider.name.toLowerCase()}`;
    const cookie = cookieStore.get(cookieName);

    if (cookie?.value) {
      try {
        const accessToken = decryptToken(cookie.value);
        const holdings = await provider.fetchHoldings(accessToken);
        allHoldings.push(...holdings);

        // Fetch User Profile (first connected broker only)
        if (!userProfile) {
          try {
            userProfile = await provider.getUserProfile(accessToken);
            connectedBrokerName = provider.name.toLowerCase();
          } catch (e) {
            console.warn('Failed to fetch profile', e);
          }
        }

        // Generate chart history (first connected broker only)
        if (options?.includeChart && !chartData) {
          try {
            chartData = await generatePortfolioHistory(holdings, provider, accessToken);
          } catch (e) {
            console.warn('Failed to generate portfolio history', e);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${provider.name}:`, error);
      }
    }
  }

  return {
    holdings: allHoldings,
    userProfile,
    connectedBrokerName,
    chartData,
    isConnected: allHoldings.length > 0,
  };
}

/**
 * Compute exchange allocation percentages from holdings.
 * Derives exchange segment from instrumentToken prefix (e.g., "NSE_EQ|INE..." → "NSE").
 */
export function computeExchangeAllocation(holdings: BrokerHolding[]): Record<string, number> {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  if (totalValue === 0) return {};

  const exchangeValues: Record<string, number> = {};
  
  for (const h of holdings) {
    // instrumentToken format: "NSE_EQ|INE...", exchange field: "NSE_EQ" or "BSE_EQ"
    let exchangeLabel = 'Other';
    
    if (h.exchange) {
      // Map exchange segment to readable label
      const segment = h.exchange.toUpperCase();
      if (segment.includes('NSE')) exchangeLabel = 'NSE';
      else if (segment.includes('BSE')) exchangeLabel = 'BSE';
      else if (segment.includes('MCX')) exchangeLabel = 'MCX';
      else exchangeLabel = segment;
    } else if (h.instrumentToken) {
      // Fallback: parse from instrumentToken prefix
      const prefix = h.instrumentToken.split('|')[0] || '';
      if (prefix.startsWith('NSE')) exchangeLabel = 'NSE';
      else if (prefix.startsWith('BSE')) exchangeLabel = 'BSE';
      else if (prefix.startsWith('MCX')) exchangeLabel = 'MCX';
      else exchangeLabel = prefix || 'Other';
    }

    exchangeValues[exchangeLabel] = (exchangeValues[exchangeLabel] || 0) + h.currentValue;
  }

  // Convert to percentages
  const allocation: Record<string, number> = {};
  for (const [exchange, value] of Object.entries(exchangeValues)) {
    allocation[exchange] = Math.round((value / totalValue) * 100);
  }

  return allocation;
}
