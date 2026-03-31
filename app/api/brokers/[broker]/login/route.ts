import { NextRequest, NextResponse } from 'next/server';
import { getBrokerProvider } from '@/lib/brokers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ broker: string }> } // Params is a Promise in Next.js 15/16
) {
  const { broker } = await params;
  const provider = getBrokerProvider(broker);

  if (!provider) {
    return NextResponse.json({ error: 'Invalid broker' }, { status: 400 });
  }

  // Construct callback URL dynamically or from env
  // Assuming default development URL for now.
  // In prod, this should use process.env.NEXT_PUBLIC_APP_URL
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/brokers/${broker}/callback`;

  try {
    const authUrl = provider.getAuthUrl(callbackUrl);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
