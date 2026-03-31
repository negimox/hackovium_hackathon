// ===== Stock Market Types =====
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  percent?: number; // Added from NSE backend response
  volume: number;
  marketCap: string;
  sector: string;
  pe: number;
  dividendYield: number;
  dayHigh: number;
  dayLow: number;
  weekHigh: number;
  weekLow: number;
  eps: number;
  bookValue: number;
}

export interface Fund {
  id: string;
  symbol: string;
  name: string;
  type: "mutual" | "etf";
  nav: number;
  change: number;
  changePercent: number;
  expenseRatio: number;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  aum: string;
  riskProfile: "low" | "moderate" | "high";
  category: string;
  fundManager: string;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
  type: "stock" | "mutual" | "etf";
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  timestamp: string;
  symbol?: string;
  impact: "positive" | "negative" | "neutral";
  predictedImpact: string;
  sentimentScore: number; // -1 to 1
  read: boolean;
  url?: string;
  imageUrl?: string;
}

export interface MarketMood {
  index: number; // 0-100
  sentiment: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  trend: "down" | "stable" | "up";
  buyerSentiment: number;
  sellerSentiment: number;
  volatilityIndex: number;
  breadthAdvance: number;
  breadthDecline: number;
}

export interface ScreenerCriteria {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  minPE: number;
  maxPE: number;
  minDividend: number;
  sector?: string;
  marketCapRange: "micro" | "small" | "mid" | "large";
  results: any[]; // Updated to any[] to avoid undeclared Stock error
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sectorAllocation: Record<string, number>;
  holdings: PortfolioHolding[];
}

export interface DashboardStat {
  label: string;
  value: string;
  description: string;
  intent: "positive" | "negative" | "neutral";
  icon: string;
  tag?: string;
  direction?: "up" | "down";
}

export interface ChartDataPoint {
  date: string;
  value: number;
  indexValue?: number;
  gainLoss?: number;
}

export interface ChartData {
  day: ChartDataPoint[];
  week: ChartDataPoint[];
  month: ChartDataPoint[];
  year: ChartDataPoint[];
}

export interface RebelRanking {
  id: number;
  name: string;
  handle: string;
  streak: string;
  points: number;
  avatar: string;
  featured?: boolean;
  subtitle?: string;
}

export interface SecurityStatus {
  title: string;
  value: string;
  status: string;
  variant: "success" | "warning" | "destructive";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  priority: "low" | "medium" | "high";
}

export interface WidgetData {
  marketStatus: "open" | "closed";
  time: string;
  sensex: number;
  nifty: number;
  indexChange: number;
  indexChangePercent: number;
  date: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  isFavorite?: boolean;
}

export interface WatchlistCategory {
  name: string;
  items: WatchlistItem[];
  isExpanded?: boolean;
}

export interface Watchlist {
  categories: WatchlistCategory[];
}

export interface MockData {
  dashboardStats: DashboardStat[];
  chartData: ChartData;
  rebelsRanking: RebelRanking[];
  securityStatus: SecurityStatus[];
  notifications: Notification[];
  widgetData: WidgetData;
  stocks?: Stock[];
  funds?: Fund[];
  portfolio?: PortfolioStats;
  marketMood?: MarketMood;
  news?: MarketNews[];
  topStocks?: Stock[];
  watchlist?: Watchlist;
}

export type TimePeriod = "day" | "week" | "month" | "year";


