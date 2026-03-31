import { PortfolioHolding, IBrokerProvider } from "@/lib/brokers/types";
import { ChartData, ChartDataPoint } from "@/types/dashboard";

/**
 * Format a date string into a readable label.
 * - For intraday: "HH:MM" (e.g., "09:30")
 * - For daily/weekly: "MMM DD" (e.g., "Feb 17")
 */
function formatDateLabel(rawDate: string, isIntraday: boolean): string {
  const d = new Date(rawDate);
  if (isIntraday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  }
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
}

/**
 * Get a date key in YYYY-MM-DD format, normalized to IST.
 */
function getDateKey(rawDate: string): string {
  const d = new Date(rawDate);
  // Use IST formatting to avoid UTC date boundary issues
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

/**
 * Get a time key in HH:MM format, normalized to IST.
 */
function getTimeKey(rawDate: string): string {
  const d = new Date(rawDate);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
}

export async function generatePortfolioHistory(
  holdings: PortfolioHolding[],
  provider: IBrokerProvider,
  accessToken: string
): Promise<ChartData> {
  // 1. Get top 5 holdings by value
  const topHoldings = [...holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5); // Limit to top 5 to avoid rate limits / performance issues

  // --- Historical data (for week/month/year) ---
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);
  
  // Format dates in IST for API
  const toDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const fromDate = yearAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Map: DateKey -> Total Portfolio Value
  const dateValueMap: Record<string, { rawDate: string; value: number }> = {};
  
  // Map: TimeKey -> Total Portfolio Value (for intraday)
  const timeValueMap: Record<string, { rawDate: string; value: number }> = {};

  for (const h of topHoldings) {
    if (!h.instrumentToken) continue;

    // Fetch historical candles (for week/month/year)
    try {
      const candles = await provider.getHistoricalCandles(accessToken, h.instrumentToken, fromDate, toDate);
      
      for (const candle of candles) {
        const rawDate = candle[0]; 
        const closePrice = candle[4];
        const dateKey = getDateKey(rawDate);
        
        if (!dateValueMap[dateKey]) dateValueMap[dateKey] = { rawDate, value: 0 };
        dateValueMap[dateKey].value += (closePrice * h.quantity);
      }
    } catch (e) {
      console.warn(`Failed to fetch history for ${h.symbol}`, e);
    }

    // Fetch intraday candles (for day tab)
    try {
      const intradayCandles = await provider.getIntradayCandles(accessToken, h.instrumentToken);
      
      for (const candle of intradayCandles) {
        const rawDate = candle[0];
        const closePrice = candle[4];
        const timeKey = getTimeKey(rawDate);
        
        if (!timeValueMap[timeKey]) timeValueMap[timeKey] = { rawDate, value: 0 };
        timeValueMap[timeKey].value += (closePrice * h.quantity);
      }
    } catch (e) {
      console.warn(`Failed to fetch intraday for ${h.symbol}`, e);
    }
  }

  // --- Build historical series with formatted dates ---
  const sortedDates = Object.keys(dateValueMap).sort();
  const fullSeries: ChartDataPoint[] = sortedDates.map(dateKey => ({
    date: formatDateLabel(dateValueMap[dateKey].rawDate, false),
    value: Math.round(dateValueMap[dateKey].value),
  }));

  // --- Build intraday series with formatted times ---
  const sortedTimes = Object.keys(timeValueMap).sort();
  const daySeries: ChartDataPoint[] = sortedTimes.map(timeKey => ({
    date: timeKey, // Already formatted as HH:MM
    value: Math.round(timeValueMap[timeKey].value),
  }));

  // --- Split historical into periods ---
  const oneWeekAgo = new Date(); oneWeekAgo.setDate(today.getDate() - 7);
  const oneMonthAgo = new Date(); oneMonthAgo.setMonth(today.getMonth() - 1);

  // For filtering, we need the original date keys
  const weekStartKey = oneWeekAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const monthStartKey = oneMonthAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const weekDates = sortedDates.filter(d => d >= weekStartKey);
  const monthDates = sortedDates.filter(d => d >= monthStartKey);

  const weekSeries: ChartDataPoint[] = weekDates.map(dateKey => ({
    date: formatDateLabel(dateValueMap[dateKey].rawDate, false),
    value: Math.round(dateValueMap[dateKey].value),
  }));

  const monthSeries: ChartDataPoint[] = monthDates.map(dateKey => ({
    date: formatDateLabel(dateValueMap[dateKey].rawDate, false),
    value: Math.round(dateValueMap[dateKey].value),
  }));

  return {
    day: daySeries,
    week: weekSeries,
    month: monthSeries,
    year: fullSeries,
  };
}
