import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_FB_TOKEN = "espon_facebook_secure_token_2026";

// GET Endpoint - Webhook Verification Challenge from Meta Facebook Messenger API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const validTokens = [
    DEFAULT_FB_TOKEN,
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    "espon_whatsapp_secure_webhook_token_2026"
  ].filter(Boolean);

  if (mode === "subscribe" && token) {
    if (validTokens.includes(token)) {
      console.log("[Facebook Messenger Webhook] Verification challenge successful!");
      return new NextResponse(challenge, { status: 200 });
    }

    // Dynamic client-specific token check (e.g. espon_fb_xxx or custom)
    try {
      if (token.startsWith("espon_fb_") || token.startsWith("wm_")) {
        const prefix = token.startsWith("espon_fb_") ? "espon_fb_" : "wm_";
        const shortId = token.replace(prefix, "");
        const client = await prisma.whatsAppClient.findFirst({
          where: {
            OR: [
              { webhookClientId: { startsWith: shortId } },
              { webhookVerifyToken: token }
            ]
          }
        });
        if (client) {
          console.log(`[Facebook Webhook] Client "${client.businessName}" verify token matched!`);
          return new NextResponse(challenge, { status: 200 });
        }
      }
    } catch (e) {
      console.error("[Facebook Webhook] Error resolving client token:", e);
    }
  }

  console.warn(`[Facebook Webhook] Forbidden - Token received: ${token}`);
  return NextResponse.json({ error: "Forbidden - Invalid verify token" }, { status: 403 });
}

// POST Endpoint - Incoming Facebook Page Messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Audit Log incoming payload in database
    try {
      await prisma.whatsAppWebhookLog.create({
        data: {
          event: "FACEBOOK_WEBHOOK_RECEIVED",
          payload: body
        }
      });
    } catch (e) {
      console.warn("[Facebook Webhook] Failed to log payload:", e);
    }

    // 2. Parse Facebook Page entries
    const entries = body.entry || [];
    for (const entry of entries) {
      const messagingList = entry.messaging || [];
      for (const event of messagingList) {
        const senderId = event.sender?.id;
        const recipientId = event.recipient?.id;
        const message = event.message;

        if (message && !message.is_echo && senderId) {
          const text = message.text || (message.attachments ? `[${message.attachments[0]?.type || 'Attachment'}]` : "[Message]");

          // Match which client or integration this belongs to
          let clientTag = "GLOBAL";
          try {
            const integration = await prisma.whatsAppIntegration.findFirst({
              where: { type: "FACEBOOK_MESSENGER", url: recipientId }
            });
            if (integration) {
              clientTag = integration.name || "Facebook Page";
            }
          } catch {}

          console.log(`[Facebook Message] [${clientTag}] From ${senderId} -> To ${recipientId}: ${text}`);
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[Facebook Webhook Error]:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 200 });
  }
}
