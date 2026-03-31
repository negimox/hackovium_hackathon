import { NextRequest, NextResponse } from "next/server";
import { createConsent, getConsentStatus } from "@/lib/setu/client";

/**
 * POST /api/setu/consent
 * Create a new consent request. Body: { mobileNumber: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, redirectUrl } = body;

    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required" },
        { status: 400 }
      );
    }

    const consent = await createConsent(mobileNumber, redirectUrl);

    return NextResponse.json({
      id: consent.id,
      url: consent.url,
      status: consent.status,
      traceId: consent.traceId,
    });
  } catch (error: any) {
    console.error("Error creating consent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create consent" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setu/consent?id=<consent_id>
 * Get the status of a consent request.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consentId = searchParams.get("id");

    if (!consentId) {
      return NextResponse.json(
        { error: "Consent ID is required as query parameter '?id='" },
        { status: 400 }
      );
    }

    const consent = await getConsentStatus(consentId);

    return NextResponse.json({
      id: consent.id,
      status: consent.status,
      url: consent.url,
      detail: consent.detail,
      traceId: consent.traceId,
    });
  } catch (error: any) {
    console.error("Error fetching consent status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch consent status" },
      { status: 500 }
    );
  }
}
