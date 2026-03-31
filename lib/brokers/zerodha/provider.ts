
import { IBrokerProvider, PortfolioHolding, TokenResponse, UserProfile } from '../types';
import crypto from 'crypto';

export class ZerodhaProvider implements IBrokerProvider {
  name = 'ZERODHA';
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY || '';
    this.apiSecret = process.env.ZERODHA_API_SECRET || '';
    
    // Warn but don't crash at boot
    if (!this.apiKey || !this.apiSecret) {
      console.warn('ZerodhaProvider: ZERODHA_API_KEY or ZERODHA_API_SECRET is not set.');
    }
  }

  getAuthUrl(redirectUri: string): string {
    if (!this.apiKey) throw new Error('ZERODHA_API_KEY is missing');
    return `https://kite.trade/connect/login?v=3&api_key=${this.apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.apiKey || !this.apiSecret) throw new Error('Zerodha credentials missing');

    const requestToken = code;
    // Checksum = SHA-256(api_key + request_token + api_secret)
    const checksumInput = this.apiKey + requestToken + this.apiSecret;
    const checksum = crypto.createHash('sha256').update(checksumInput).digest('hex');

    const url = 'https://api.kite.trade/session/token';
    const params = new URLSearchParams();
    params.append('api_key', this.apiKey);
    params.append('request_token', requestToken);
    params.append('checksum', checksum);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3'
      },
      body: params
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Zerodha Token Exchange Error:', errorText);
        throw new Error(`Failed to exchange code: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.status !== 'success') {
       throw new Error(`Zerodha API Error: ${json.message || 'Unknown error'}`);
    }

    const data = json.data;
    return {
      access_token: data.access_token,
      // Zerodha doesn't provide a refresh token in the standard flow usually, 
      // but if they did, we'd map it here. They have a 24h session.
      // public_token is unique to Zerodha, not needed for IBrokerProvider interface strictly unless we expand it.
      expires_in: 86400 // 24 hours typical session
    };
  }

  async fetchHoldings(accessToken: string): Promise<PortfolioHolding[]> {
    const url = 'https://api.kite.trade/portfolio/holdings';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${accessToken}`,
        'X-Kite-Version': '3'
      }
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Zerodha Fetch Holdings Error:', err);
        throw new Error('Failed to fetch Zerodha holdings');
    }

    const json = await res.json();
    if (json.status !== 'success') {
       throw new Error(`Zerodha API Error: ${json.message || 'Unknown error'}`);
    }

    const holdings = json.data || [];
    
    return holdings.map((h: any) => {
        // Zerodha fields:
        // tradingsymbol, exchange, instrument_token, quantity, authorised_quantity,
        // average_price, last_price, close_price, pnl, day_change, day_change_percentage
        
        return {
            symbol: h.tradingsymbol,
            companyName: h.tradingsymbol, // Zerodha doesn't always send full company name in holdings
            quantity: h.quantity || 0,
            averagePrice: h.average_price || 0,
            currentPrice: h.last_price || 0,
            pnl: h.pnl,
            dayChange: h.day_change,
            dayChangePercentage: h.day_change_percentage,
            investedValue: (h.average_price || 0) * (h.quantity || 0),
            currentValue: (h.last_price || 0) * (h.quantity || 0),
            broker: this.name,
            instrumentToken: String(h.instrument_token),
            exchange: h.exchange,
            isin: h.isin
        };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const url = 'https://api.kite.trade/user/profile';
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'X-Kite-Version': '3'
        }
    });

    if (!res.ok) {
        throw new Error('Failed to fetch Zerodha profile');
    }

    const json = await res.json();
    if (json.status !== 'success') {
        throw new Error(`Zerodha API Error: ${json.message}`);
    }

    const data = json.data;
    return {
        id: data.user_id,
        name: data.user_name,
        email: data.email,
        brokerUserId: data.user_id
    };
  }

  // --- Historical Data ---
  // https://api.kite.trade/instruments/historical/{instrument_token}/{interval}?from=...&to=...
  async getHistoricalCandles(accessToken: string, instrumentToken: string, fromDate: string, toDate: string): Promise<any[]> {
    if (!instrumentToken) {
        console.warn('Zerodha: No instrument token provided for historical data');
        return [];
    }

    const interval = 'day';
    const url = `https://api.kite.trade/instruments/historical/${instrumentToken}/${interval}?from=${fromDate}&to=${toDate}`;
    
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'X-Kite-Version': '3'
        }
    });

    if (!res.ok) {
        console.warn(`Zerodha: Failed to fetch history for ${instrumentToken}: ${res.statusText}`);
        return [];
    }

    const json = await res.json();
    if (json.status !== 'success') {
        console.warn(`Zerodha historical API error: ${json.message}`);
        return [];
    }

    // Response: { data: { candles: [[timestamp, open, high, low, close, volume], ...] } }
    return json.data?.candles || [];
  }

  // --- Intraday Data ---
  async getIntradayCandles(accessToken: string, instrumentToken: string): Promise<any[]> {
    if (!instrumentToken) return [];
    
    const interval = 'minute'; // or '5minute'
    // For intraday, we usually want just today. Zerodha requires 'from' and 'to'.
    // We'll calculate today's date YYYY-MM-DD
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const url = `https://api.kite.trade/instruments/historical/${instrumentToken}/${interval}?from=${todayStr}&to=${todayStr}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `token ${this.apiKey}:${accessToken}`,
            'X-Kite-Version': '3'
        }
    });

    if (!res.ok) {
        console.warn(`Zerodha: Failed to fetch intraday for ${instrumentToken}: ${res.statusText}`);
        return [];
    }

    const json = await res.json();
    if (json.status !== 'success') {
        console.warn(`Zerodha intraday API error: ${json.message}`);
        return [];
    }

    return json.data?.candles || [];
  }
}
