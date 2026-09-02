import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingAILogic } from "@/lib/whatsappAI";
import { executeFlowEngine } from "@/lib/whatsappFlowEngine";
import { assignWhatsAppLeadAction } from "@/app/actions/whatsAppPlatformActions";

const PROCESSED_WEBHOOK_IDS = new Set<string>();

// GET Endpoint - Webhook Verification Challenge from Meta WhatsApp API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "espon_whatsapp_secure_webhook_token_2026";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] Verification successful!");
      return new NextResponse(challenge, { status: 200 });
    }
  }

  return NextResponse.json({ error: "Forbidden - Invalid verify token" }, { status: 403 });
}

// POST Endpoint - Incoming Messages & Delivery Receipts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log Webhook Payload
    try {
      await prisma.whatsAppWebhookLog.create({
        data: {
          event: "WEBHOOK_RECEIVED",
          payload: body
        }
      });
    } catch (e) { console.error("Failed to log webhook", e); }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: "ignored" });
    }

    // ══════════════════════════════════════════════════════
    // 0. EMERGENCY DEBUG LOGGING (Raw Payload Dump)
    // ══════════════════════════════════════════════════════
    /* 
    try {
      const dbAccount = await prisma.whatsAppAccount.findFirst() || await prisma.whatsAppAccount.create({ data: { name: "Debug", phoneNumber: "000", status: "CONNECTED" } });
      let debugCustomer = await prisma.customer.findFirst({ where: { mobile: "0000000000" } });
      if (!debugCustomer) debugCustomer = await prisma.customer.create({ data: { businessName: "Debug", contactPerson: "Debug", mobile: "0000000000" } });
      let debugConv = await prisma.whatsAppConversation.findFirst({ where: { customerId: debugCustomer.id } });
      if (!debugConv) debugConv = await prisma.whatsAppConversation.create({ data: { accountId: dbAccount.id, customerId: debugCustomer.id, status: "OPEN" } });
      
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: debugConv.id,
          senderType: "SYSTEM",
          senderName: "WEBHOOK_PAYLOAD_DUMP",
          messageType: "TEXT",
          content: JSON.stringify(body).slice(0, 4000),
          status: "SENT",
          sentAt: new Date()
        }
      });
    } catch (e) {
      console.error("Failed to dump raw payload", e);
    }
    */

    // ══════════════════════════════════════════════════════
    // 1. PROCESS INCOMING MESSAGES
    // ══════════════════════════════════════════════════════
    if (value.messages && value.messages.length > 0) {
      const metadata = value.metadata;
      
      // Ensure we only process messages for our specific CRM phone number (7404388242)
      // because Meta Webhook sends events for ALL numbers attached to the Meta App.
      // Phone filter removed

      const msg = value.messages[0];

      // Deduplication Check
      if (msg.id && PROCESSED_WEBHOOK_IDS.has(msg.id)) {
        return NextResponse.json({ status: "ignored - duplicate" });
      }
      if (msg.id) {
        PROCESSED_WEBHOOK_IDS.add(msg.id);
        if (PROCESSED_WEBHOOK_IDS.size > 1000) PROCESSED_WEBHOOK_IDS.clear();
      }

      const fromPhone = msg.from;
      const cleanPhone = fromPhone.replace(/\D/g, '').slice(-10);
      
      // Feature: WebRTC Call Handling
      if (msg.type === "interactive" && msg.interactive?.type === "webrtc_call") {
        const callData = msg.interactive.webrtc_call;
        console.log(`[WhatsApp Webhook] WebRTC Call event from ${cleanPhone}:`, callData.status);
        await prisma.whatsAppCall.upsert({
           where: { id: callData.call_id },
           create: { id: callData.call_id, phone: cleanPhone, direction: 'inbound', status: callData.status },
           update: { status: callData.status, ended_at: callData.status === 'ended' ? new Date() : undefined }
        }).catch(()=>console.warn("Could not save WebRTC state"));
        return NextResponse.json({ status: "success" });
      }

      const isMedia = ["image", "video", "audio", "document"].includes(msg.type);
      const mediaId = isMedia ? msg[msg.type]?.id : null;
      const mediaMimeType = isMedia ? msg[msg.type]?.mime_type : null;
      const proxyMediaUrl = mediaId ? `/api/whatsapp/media/${mediaId}` : null;
      
      let textContent = "[Message]";
      if (msg.text?.body) {
        textContent = msg.text.body;
      } else if (msg.button?.text) {
        textContent = msg.button.text;
      } else if (msg.interactive?.button_reply?.title) {
        textContent = msg.interactive.button_reply.title;
      } else if (msg.interactive?.list_reply?.title) {
        textContent = msg.interactive.list_reply.title;
      } else if (msg.reaction?.emoji) {
        textContent = `Reacted with: ${msg.reaction.emoji}`;
      } else if (isMedia) {
        textContent = `[${msg.type.toUpperCase()}]`;
      } else if (msg[msg.type]?.caption) {
        textContent = msg[msg.type].caption;
      } else if (msg.type === "template") {
        textContent = "[Template Message]";
      } else if (msg.type === "interactive" && msg.interactive?.type === "nfm_reply") {
        const flowReply = msg.interactive.nfm_reply;
        let summary = "📋 Form Submitted:\n";
        try {
          const answers = JSON.parse(flowReply.response_json || "{}");
          Object.entries(answers).forEach(([key, val]) => {
            const cleanKey = key.replace(/_/g, " ").toUpperCase();
            summary += `• ${cleanKey}: ${val}\n`;
          });
        } catch (_) {
          summary += `Raw response: ${flowReply.response_json}`;
        }
        textContent = summary.trim();
      }

      // Feature: Intercept `buy_` buttons
      if (msg.interactive?.button_reply?.id?.startsWith("buy_")) {
         console.log(`[WhatsApp Webhook] Buy button clicked for ${msg.interactive.button_reply.id}`);
      }

      // Feature 5: Extract WhatsApp Profile Name from Meta payload
      const whatsappProfileName = value.contacts?.[0]?.profile?.name || null;

      // Step A: Search CRM by Phone Number
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { mobile: { contains: cleanPhone } },
            { whatsappNumber: { contains: cleanPhone } }
          ]
        }
      });

      // Step B: Auto-create Contact/Lead if customer does not exist
      if (!customer) {
        const defaultEmployee = await prisma.employee.findFirst();
        customer = await prisma.customer.create({
          data: {
            businessName: whatsappProfileName || `+91 ${cleanPhone}`,
            contactPerson: whatsappProfileName || `+91 ${cleanPhone}`,
            mobile: cleanPhone,
            whatsappNumber: cleanPhone,
            customerType: "Wholesaler",
            status: "New Lead",
            leadStage: "New Enquiry",
            temperature: "HOT",
            assignedSalespersonId: defaultEmployee?.id,
            tags: null
          }
        });
      } else if (whatsappProfileName && (customer.contactPerson?.startsWith("Contact +91") || customer.contactPerson === "Unknown Lead" || !customer.contactPerson)) {
        // Feature 5: Update contact name if it was an auto-placeholder or Unknown
        await prisma.customer.update({
          where: { id: customer.id },
          data: { contactPerson: whatsappProfileName }
        });
        customer = { ...customer, contactPerson: whatsappProfileName };
      }

      // Step C: Link/Find Conversation
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: { customerId: customer.id }
      });

      const account = await prisma.whatsAppAccount.findFirst() || await prisma.whatsAppAccount.create({
        data: {
          name: "Main WhatsApp",
          phoneNumber: "+91 7206066678",
          status: "CONNECTED"
        }
      });

      const messageTimestamp = new Date(parseInt(msg.timestamp) * 1000 || Date.now());
      
      // Log Meta Flow submissions in database
      if (msg.type === "interactive" && msg.interactive?.type === "nfm_reply") {
        try {
          const flowReply = msg.interactive.nfm_reply;
          let formRecord = await prisma.whatsAppForm.findFirst({ where: { name: "Meta Flow Form" } });
          if (!formRecord) {
            formRecord = await prisma.whatsAppForm.create({
              data: { name: "Meta Flow Form", fields: "[]" }
            });
          }
          await prisma.whatsAppFormSubmission.create({
            data: {
              formId: formRecord.id,
              conversationId: conversation.id,
              customerId: customer.id,
              dataJson: flowReply.response_json || "{}"
            }
          });
        } catch (err) {
          console.error("Failed to log form submission in webhook:", err);
        }
      }

      let wasClosed = false;

      if (!conversation) {
        conversation = await prisma.whatsAppConversation.create({
          data: {
            accountId: account.id,
            customerId: customer.id,
            status: "OPEN",
            leadStatus: customer.leadStage || "New Lead",
            lastMessageText: textContent,
            lastMessageAt: messageTimestamp,
            unreadCount: 1,
            tags: null
          }
        });
      } else {
        wasClosed = conversation.status === "CLOSED";

        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageText: textContent,
            lastMessageAt: messageTimestamp,
            unreadCount: conversation.unreadCount + 1,
            status: "OPEN",
          }
        });

        if (wasClosed && conversation.assignedEmployeeId) {
          console.log(`[Webhook Reopen] Reopened closed chat ${conversation.id} and retained assigned agent ${conversation.assignedEmployeeId}`);
        }
      }

      // Step D: Store Incoming Message
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: "CUSTOMER",
          senderName: customer.contactPerson,
          messageType: msg.type ? msg.type.toUpperCase() : "TEXT",
          content: textContent,
          mediaUrl: proxyMediaUrl,
          mediaType: mediaMimeType,
          status: "RECEIVED",
          metaMessageId: msg.id,
          sentAt: messageTimestamp
        }
      });

      console.log(`[WhatsApp Webhook] Incoming message from +91 ${cleanPhone}: "${textContent.slice(0, 50)}"`);

      // Removed old global auto-assignment logic to rely purely on Chatbot Engine routing.
        // Feature 1: Send Web Push Notification to assigned agent or all if unassigned
        sendPushNotificationToAgents(
          `dY' ${customer.contactPerson || '+91 ' + cleanPhone}`,
          textContent.slice(0, 100),
          `/whatsapp/inbox`,
          conversation.assignedEmployeeId
        ).catch((e) => console.error("[Push] Failed:", e.message));

      // Feature 2: Chatbot Flow Engine — check if a flow should intercept
      const isTextMessage = msg.type === "text" || msg.type === "interactive";
      if (isTextMessage) {
        const flowHandled = await executeFlowEngine(fromPhone, textContent, conversation.id, wasClosed);

        if (!flowHandled && conversation.aiHandled) {
          // Feature 7: AI + Logging
          const aiStart = Date.now();
          const recentMessages = await prisma.whatsAppMessage.findMany({
            where: { conversationId: conversation.id, senderType: { in: ["CUSTOMER", "AGENT", "AI"] } },
            orderBy: { sentAt: 'desc' },
            take: 6
          });
          const historyLines = recentMessages.reverse().map(m => `${m.senderType}: ${m.content}`);

          let aiResponse: string | null = null;
          let aiStatus = "SUCCESS";
          let aiError: string | undefined;
          let toolsCalled = "none";

          try {
            aiResponse = await handleIncomingAILogic(fromPhone, textContent, historyLines, conversation.id);
            // Detect which tools were called from the response content
            const tools: string[] = [];
            if (textContent.match(/[12]\d{3}/)) tools.push("lookupOrder");
            if (/shirt|short|combo|pant|product/i.test(textContent)) tools.push("searchProducts");
            if (/size|weight|kg|cm|waist/i.test(textContent)) tools.push("recommendSize");
            toolsCalled = tools.length > 0 ? tools.join(", ") : "ai_reply";
          } catch (e: any) {
            aiStatus = "FAILED";
            aiError = e.message;
          }

          const aiDuration = Date.now() - aiStart;

          // Feature 7: Log AI execution to DB
          await prisma.whatsAppAILog.create({
            data: {
              phone: cleanPhone,
              userMessage: textContent.slice(0, 500),
              aiReply: aiResponse?.slice(0, 2000) || null,
              toolsCalled,
              status: aiStatus,
              errorMessage: aiError,
              durationMs: aiDuration
            }
          }).catch(() => {}); // Non-critical, don't fail webhook on log error

          // Message sent and saved inside handleIncomingAILogic via sendWhatsAppMessageAction
        }
      }
    }

    // ══════════════════════════════════════════════════════
    // 2. PROCESS MESSAGE STATUS UPDATES (Delivered, Read, Failed)
    // ══════════════════════════════════════════════════════
    if (value.statuses && value.statuses.length > 0) {
      const statusUpdate = value.statuses[0];
      const metaMessageId = statusUpdate.id;
      const status = statusUpdate.status.toUpperCase();

      console.log(`[WhatsApp Webhook] Status update: ${status} for msg ID: ${metaMessageId}`);

      const updateData: any = { status };
      if (status === 'DELIVERED') updateData.deliveredAt = new Date(parseInt(statusUpdate.timestamp) * 1000 || Date.now());
      if (status === 'READ') updateData.readAt = new Date(parseInt(statusUpdate.timestamp) * 1000 || Date.now());

      try {
        await prisma.whatsAppMessage.updateMany({
          where: { metaMessageId },
          data: updateData
        });
      } catch (_) {
        console.warn(`[WhatsApp Webhook] Could not update status for message ID ${metaMessageId}`);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: Fire-and-forget Web Push to agents (respects assignment)
async function sendPushNotificationToAgents(title: string, body: string, url: string, assignedEmployeeId?: string | null) {
  let targetEmails: string[] = [];

  if (assignedEmployeeId) {
    const emp = await prisma.employee.findUnique({
      where: { id: assignedEmployeeId },
      include: { user: true }
    });
    if (emp && emp.user) {
      targetEmails.push(emp.user.email);
    }
  } else {
    // Unassigned chat: only notify ADMINs
    const [adminUsers, adminAgents] = await Promise.all([
      prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
      prisma.whatsAppAgentUser.findMany({ where: { role: "ADMIN" }, select: { email: true } })
    ]);
    targetEmails = [
      ...adminUsers.map((u) => u.email),
      ...adminAgents.map((a) => a.email)
    ];
  }

  const subs = await prisma.whatsAppPushSubscription.findMany();
  if (subs.length === 0) return;

  const payload = JSON.stringify({ title, body, data: { url } });

  for (const sub of subs) {
    // If chat is assigned to someone, only notify them. If unassigned, only notify admins.
    if (!targetEmails.includes(sub.userId)) {
      continue; 
    }

    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      // Call our own internal push endpoint (avoids importing web-push in Edge Runtime)
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || 'crm_internal_2026' },
        body: JSON.stringify({ subscription, payload })
      });
    } catch (_) {}
  }
}
