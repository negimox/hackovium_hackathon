import { NextRequest, NextResponse } from 'next/server';
import { getAllBrokers, decryptToken } from '@/lib/brokers';

export async function GET(request: NextRequest) {
  const brokers = getAllBrokers();
  const allHoldings = [];
  const errors = [];

  for (const provider of brokers) {
    // Check for cookie
    const cookieName = `broker_token_${provider.name.toLowerCase()}`;
    const cookie = request.cookies.get(cookieName);

    if (cookie?.value) {
      try {
        const accessToken = decryptToken(cookie.value);
        const holdings = await provider.fetchHoldings(accessToken);
        allHoldings.push(...holdings);
      } catch (error: any) {
        console.error(`Error fetching ${provider.name}:`, error);
        errors.push({ broker: provider.name, error: error.message });
      }
    }
  }

  return NextResponse.json({
    data: allHoldings,
    errors: errors.length > 0 ? errors : undefined
  });
}
