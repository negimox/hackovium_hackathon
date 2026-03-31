import { NextRequest, NextResponse } from 'next/server';
import { getBrokerProvider, encryptToken } from '@/lib/brokers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ broker: string }> }
) {
  const { broker } = await params;
  const provider = getBrokerProvider(broker);

  if (!provider) {
    return NextResponse.json({ error: 'Invalid broker' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Broker returned error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/brokers/${broker}/callback`;

  try {
    const tokenResponse = await provider.exchangeCodeForToken(code, callbackUrl);
    
    // Encrypt the access token
    const encryptedToken = encryptToken(tokenResponse.access_token);
    
    // Create response redirecting to dashboard
    const response = NextResponse.redirect(`${protocol}://${host}/`);
    
    // Set HttpOnly cookie
    // Cookie name: "broker_token_[BROKERNAME]"
    response.cookies.set(`broker_token_${broker}`, encryptedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenResponse.expires_in || 86400 // Default 1 day
    });

    return response;

  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
