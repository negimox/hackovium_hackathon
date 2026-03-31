import { NextRequest, NextResponse } from "next/server";
import type { SetuNotification } from "@/lib/setu/types";

/**
 * POST /api/setu/webhook
 * Receives notifications from SETU AA.
 * Configure this URL on the SETU Bridge dashboard.
 *
 * Notification types:
 * - CONSENT_STATUS_UPDATE: consent approved/rejected/revoked
 * - SESSION_STATUS_UPDATE: data session completed/failed
 */
export async function POST(request: NextRequest) {
  try {
    const notification: SetuNotification = await request.json();

    console.log(
      `[SETU Webhook] ${notification.type}`,
      JSON.stringify(notification, null, 2)
    );

    // Handle different notification types
    switch (notification.type) {
      case "CONSENT_STATUS_UPDATE":
        console.log(
          `Consent ${notification.consentId} → ${notification.consentStatus}`
        );
        // In production: persist consent status to DB, notify frontend via SSE/websocket
        break;

      case "SESSION_STATUS_UPDATE":
      case "FI_DATA_READY":
        console.log(
          `Data Session ${notification.dataSessionId} → ${notification.dataSessionStatus}`
        );
        // In production: trigger data fetch & persist
        break;

      default:
        console.log("Unknown notification type:", notification.type);
    }

    // SETU expects a 200 OK response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    // Still return 200 to avoid SETU retries for malformed payloads
    return NextResponse.json({ success: true });
  }
}
