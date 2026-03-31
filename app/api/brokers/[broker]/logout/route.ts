import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ broker: string }> }
) {
  const { broker } = await params;
  const response = NextResponse.json({ success: true });

  // Clear cookie
  response.cookies.delete(`broker_token_${broker}`);

  return response;
}
