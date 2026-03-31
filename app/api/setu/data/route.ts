import { NextRequest, NextResponse } from "next/server";
import { createDataSession, getDataSession } from "@/lib/setu/client";

/**
 * POST /api/setu/data
 * Create a data session for an approved consent.
 * Body: { consentId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consentId } = body;

    if (!consentId) {
      return NextResponse.json(
        { error: "consentId is required" },
        { status: 400 }
      );
    }

    const session = await createDataSession(consentId);

    return NextResponse.json({
      sessionId: session.id,
      consentId: session.consentId,
      status: session.status,
      traceId: session.traceId,
    });
  } catch (error: any) {
    console.error("Error creating data session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create data session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setu/data?sessionId=<id>
 * 
 * GET /sessions/:id returns both status AND data.
 * FI data may be under various field names depending on SETU API version.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required as query parameter" },
        { status: 400 }
      );
    }

    const session = await getDataSession(sessionId);

    // Extract FI data — SETU returns FI data under the "fips" field
    const payload =
      session.fips ||
      session.Payload ||
      session.payload ||
      session.data ||
      null;

    return NextResponse.json({
      sessionId: session.id,
      consentId: session.consentId,
      status: session.status,
      format: session.format,
      payload,
      traceId: session.traceId,
    });
  } catch (error: any) {
    console.error("Error fetching data session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data session" },
      { status: 500 }
    );
  }
}
