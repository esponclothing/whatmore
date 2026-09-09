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

    // Client-specific Instagram verify tokens
    const clientSpecificVerifyToken = `espon_ig_${client.webhookClientId.slice(0, 8)}`;
    const allowedTokens = [
      clientSpecificVerifyToken,
      client.webhookVerifyToken,
      process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
      "espon_instagram_secure_token_2026"
    ].filter(Boolean);

    if (mode === "subscribe" && allowedTokens.includes(token)) {
      console.log(`[Instagram Webhook] Client "${client.businessName}" (${clientId}) verification successful.`);
      return new NextResponse(challenge, { status: 200 });
    }

    console.warn(`[Instagram Webhook] Client "${client.businessName}" verification failed. Received: "${token}"`);
    return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
  } catch (e: any) {
    console.error("[Instagram Webhook] GET Error:", e);
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
        event: "instagram_event",
        status: "RECEIVED",
        payload: {
          clientId: client.id,
          businessName: client.businessName,
          webhookClientId: client.webhookClientId,
          channel: "INSTAGRAM",
          ...body
        }
      }
    }).catch(() => {});

    // Iterate Instagram entries and messages
    if (body.object === "instagram" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const instagramAccountId = entry.id; // Instagram Business Account ID
        const time = entry.time;

        if (Array.isArray(entry.messaging)) {
          for (const msgEvent of entry.messaging) {
            const senderId = msgEvent.sender?.id; // User IGSID
            const recipientId = msgEvent.recipient?.id; // IG Business Account
            const message = msgEvent.message;
            const postback = msgEvent.postback;

            console.log(`[Instagram Webhook] Message for client "${client.businessName}" (${client.id}) from ${senderId} -> ${recipientId}:`, message?.text || postback?.title || "(media/event)");
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED", clientId: client.id }, { status: 200 });
  } catch (e: any) {
    console.error("[Instagram Webhook] POST Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
