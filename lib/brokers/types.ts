export interface PortfolioHolding {
  symbol: string;
  companyName?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  dayChange: number;
  dayChangePercentage: number;
  investedValue: number;
  currentValue: number;
  broker: string; // "UPSTOX", "ZERODHA"
  instrumentToken?: string;
  exchange?: string;
  isin?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  brokerUserId?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface IBrokerProvider {
  name: string;
  getAuthUrl(redirectUri: string): string;
  exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse>;
  fetchHoldings(accessToken: string): Promise<PortfolioHolding[]>;
  getUserProfile(accessToken: string): Promise<UserProfile>;
  getHistoricalCandles(accessToken: string, instrumentToken: string, fromDate: string, toDate: string): Promise<any[]>;
  getIntradayCandles(accessToken: string, instrumentToken: string): Promise<any[]>;
}
