import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: any }
) {
  const resolved = await Promise.resolve(params);
  const clientId = resolved.clientId;
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  try {
    const client = await prisma.whatsAppClient.findFirst({
      where: {
        OR: [
          { webhookClientId: clientId },
          { id: clientId }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Client-specific Facebook Messenger verify tokens
    const clientSpecificVerifyToken = `espon_fb_${client.webhookClientId.slice(0, 8)}`;
    const allowedTokens = [
      clientSpecificVerifyToken,
      client.webhookVerifyToken,
      process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
      "espon_facebook_secure_token_2026"
    ].filter(Boolean);

    if (mode === "subscribe" && allowedTokens.includes(token)) {
      console.log(`[Facebook Webhook] Client "${client.businessName}" (${clientId}) verification successful.`);
      return new NextResponse(challenge, { status: 200 });
    }

    console.warn(`[Facebook Webhook] Client "${client.businessName}" verification failed. Received: "${token}"`);
    return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
  } catch (e: any) {
    console.error("[Facebook Webhook] GET Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: any }
) {
  const resolved = await Promise.resolve(params);
  const clientId = resolved.clientId;

  try {
    const client = await prisma.whatsAppClient.findFirst({
      where: {
        OR: [
          { webhookClientId: clientId },
          { id: clientId }
        ]
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.subscriptionStatus === "BLOCKED" || !client.isActive) {
      return NextResponse.json({ status: "ignored", reason: "client_blocked" });
    }

    const body = await req.json();

    // Log raw incoming event tagged with clientId
    await prisma.whatsAppWebhookLog.create({
      data: {
        event: "facebook_messenger_event",
        status: "RECEIVED",
        payload: {
          clientId: client.id,
          businessName: client.businessName,
          webhookClientId: client.webhookClientId,
          channel: "FACEBOOK_MESSENGER",
          ...body
        }
      }
    }).catch(() => {});

    // Iterate Facebook Page entries and messages
    if (body.object === "page" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const pageId = entry.id; // Facebook Page ID
        const time = entry.time;

        if (Array.isArray(entry.messaging)) {
          for (const msgEvent of entry.messaging) {
            const senderId = msgEvent.sender?.id; // User PSID
            const recipientId = msgEvent.recipient?.id; // Page ID
            const message = msgEvent.message;
            const postback = msgEvent.postback;

            console.log(`[Facebook Webhook] Message for client "${client.businessName}" (${client.id}) on Page ${pageId} from ${senderId}:`, message?.text || postback?.title || "(media/event)");
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED", clientId: client.id }, { status: 200 });
  } catch (e: any) {
    console.error("[Facebook Webhook] POST Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
