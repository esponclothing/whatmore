import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { integrationId, eventName = "Lead", testEventCode, testPhone = "919876543210" } = body;

    let integration: any = null;
    if (integrationId) {
      integration = await prisma.whatsAppIntegration.findUnique({ where: { id: integrationId } });
    }
    if (!integration) {
      integration = await prisma.whatsAppIntegration.findFirst({ where: { type: "META_CAPI", isActive: true } });
    }

    if (!integration || !integration.isActive) {
      return NextResponse.json({
        success: false,
        error: "No active Meta CAPI integration found. Please save Pixel ID and Access Token in Integrations first."
      }, { status: 400 });
    }

    const pixelId = integration.url?.trim();
    const accessToken = integration.token?.trim();

    if (!pixelId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: "Missing Pixel ID or Access Token in selected Meta Integration."
      }, { status: 400 });
    }

    const cleanPhone = testPhone.replace(/\D/g, "").slice(-10);
    const hashedPhone = crypto.createHash("sha256").update(cleanPhone).digest("hex");

    const capiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events`;
    const payload: any = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "system_generated",
          user_data: {
            ph: [hashedPhone]
          }
        }
      ],
      access_token: accessToken
    };

    if (testEventCode && testEventCode.trim()) {
      payload.test_event_code = testEventCode.trim();
    }

    console.log(`[Test Meta CAPI] Posting test event '${eventName}' to Meta Pixel ${pixelId}...`);
    const metaRes = await fetch(capiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const metaData = await metaRes.json();
    console.log(`[Test Meta CAPI] Meta Response:`, metaData);

    if (metaRes.ok && metaData.events_received) {
      return NextResponse.json({
        success: true,
        message: `Successfully verified with Meta Events Manager! (${metaData.events_received} event received)`,
        eventsReceived: metaData.events_received,
        fbtraceId: metaData.fbtrace_id,
        pixelId,
        eventName
      });
    } else {
      return NextResponse.json({
        success: false,
        error: metaData.error?.message || metaData.error?.error_user_msg || "Meta API Error",
        rawError: metaData.error
      }, { status: metaRes.status || 400 });
    }
  } catch (err: any) {
    console.error("[Test Meta CAPI API Error]:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Internal Server Error"
    }, { status: 500 });
  }
}
