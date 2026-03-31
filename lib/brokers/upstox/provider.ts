import { IBrokerProvider, PortfolioHolding, TokenResponse, UserProfile } from '../types';

export class UpstoxProvider implements IBrokerProvider {
  name = 'UPSTOX';
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = process.env.UPSTOX_CLIENT_ID || '';
    this.apiSecret = process.env.UPSTOX_CLIENT_SECRET || '';
    
    // Warn but don't crash at boot, might fail at runtime if envs missing
    if (!this.apiKey || !this.apiSecret) {
      console.warn('UpstoxProvider: UPSTOX_CLIENT_ID or UPSTOX_CLIENT_SECRET is not set.');
    }
  }

  getAuthUrl(redirectUri: string): string {
    if (!this.apiKey) throw new Error('UPSTOX_CLIENT_ID is missing');
    // Using minimal scopes. Adjust 'state' as needed for security.
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${this.apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.apiKey || !this.apiSecret) throw new Error('Upstox credentials missing');

    const url = 'https://api.upstox.com/v2/login/authorization/token';
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', this.apiKey);
    params.append('client_secret', this.apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Upstox Token Exchange Error:', errorText);
      throw new Error(`Failed to exchange code: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      access_token: data.access_token,
      // Upstox might not return refresh tokens for all users/apps
      refresh_token: data.refresh_token, 
      expires_in: data.expires_in
    };
  }

  async fetchHoldings(accessToken: string): Promise<PortfolioHolding[]> {
    const url = 'https://api.upstox.com/v2/portfolio/long-term-holdings';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
        // Handle 401 unauth specifically if needed
        const err = await res.text();
        console.error('Upstox Fetch Holdings Error:', err);
        throw new Error('Failed to fetch Upstox holdings');
    }

    // Upstox response.data is an array of holdings
    const holdings = (await res.json()).data || [];
    
    return holdings.map((h: any) => {
      const quantity = h.quantity || 0;
      const averagePrice = h.average_price || 0;
      const currentPrice = h.last_price || 0;
      const closePrice = h.close_price || 0;

      const investedValue = quantity * averagePrice;
      const currentValue = quantity * currentPrice;

      // P&L: Use API value if present, else calc
      const pnl = h.pnl !== undefined ? h.pnl : (currentValue - investedValue);

      // Day Change: Upstox API often returns 0 for day_change.
      // Calc: (Last Price - Previous Close)
      let dayChange = h.day_change;
      if (dayChange === 0 && closePrice > 0) {
        dayChange = currentPrice - closePrice;
      }
      
      const dayChangePercentage = h.day_change_percentage || (closePrice > 0 ? ((currentPrice - closePrice) / closePrice) * 100 : 0);

      return {
        symbol: h.trading_symbol,
        companyName: h.company_name || h.trading_symbol,
        quantity,
        averagePrice,
        currentPrice,
        pnl,
        dayChange,
        dayChangePercentage,
        investedValue,
        currentValue,
        broker: this.name,
        instrumentToken: h.instrument_token,
        exchange: h.exchange || 'NSE',
        isin: h.isin
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const url = 'https://api.upstox.com/v2/user/profile';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Accept': 'application/json'
      }
    });

    if (!res.ok) {
       throw new Error('Failed to fetch Upstox profile');
    }
    
    const json = await res.json();
    const data = json.data;

    return {
      id: data.user_id,
      name: data.user_name,
      email: data.email,
      brokerUserId: data.user_id
    };
  }

  // --- Historical Data for Graph ---
  // Upstox V3 API: /v3/historical-candle/{instrumentKey}/{unit}/{interval}/{to_date}/{from_date}
  // Response: { status: "success", data: { candles: [[timestamp, open, high, low, close, volume, oi], ...] } }
  async getHistoricalCandles(accessToken: string, instrumentToken: string, fromDate: string, toDate: string): Promise<any[]> {
    const unit = 'days';
    const interval = '1';
    const url = `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(instrumentToken)}/${unit}/${interval}/${toDate}/${fromDate}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch history for ${instrumentToken}: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    if (json.status !== 'success') {
      console.warn(`Upstox historical API error for ${instrumentToken}:`, json);
      return [];
    }

    // Data is [[timestamp, open, high, low, close, volume, oi], ...]
    return json.data?.candles || [];
  }

  // --- Intraday Data for Day Tab ---
  // Upstox V3 Intraday API: /v3/historical-candle/intraday/{instrumentKey}/{unit}/{interval}
  // Returns current day's candles only
  async getIntradayCandles(accessToken: string, instrumentToken: string): Promise<any[]> {
    const unit = 'minutes';
    const interval = '5'; // 5-minute candles
    const url = `https://api.upstox.com/v3/historical-candle/intraday/${encodeURIComponent(instrumentToken)}/${unit}/${interval}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch intraday for ${instrumentToken}: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    if (json.status !== 'success') {
      console.warn(`Upstox intraday API error for ${instrumentToken}:`, json);
      return [];
    }

    // Data is [[timestamp, open, high, low, close, volume, oi], ...]
    return json.data?.candles || [];
  }
}
