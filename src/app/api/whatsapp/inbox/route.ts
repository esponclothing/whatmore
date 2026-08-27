import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get the WhatsApp account and its token from DB
async function getAccount() {
  return prisma.whatsAppAccount.findFirst({ orderBy: { createdAt: "desc" } });
}

// --- GET --------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "chats";

  // -- 1. GET ALL CHATS -----------------------------------------------------
  if (action === "chats") {
    try {
      const conversations = await prisma.whatsAppConversation.findMany({
        include: {
          customer: {
            select: {
              id: true,
              contactPerson: true,
              businessName: true,
              mobile: true,
              whatsappNumber: true,
              tags: true,
              leadStage: true,
              temperature: true,
              totalOrders: true,
            },
          },
          messages: {
            orderBy: { sentAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              senderType: true,
              sentAt: true,
              messageType: true,
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 100,
      });

      const chats = conversations.map((conv) => {
        const lastMsg = conv.messages[0];
        const phone = conv.customer?.mobile || conv.customer?.whatsappNumber || "";
        const hoursElapsed = conv.lastMessageAt
          ? (Date.now() - new Date(conv.lastMessageAt).getTime()) / (1000 * 3600)
          : 999;

        return {
          id: conv.id,
          phone: `91${phone.replace(/\D/g, "").slice(-10)}`,
          customer_name: conv.customer?.contactPerson || conv.customer?.businessName || phone,
          last_message: lastMsg?.content || "",
          last_role: lastMsg?.senderType === "CUSTOMER" ? "user" : "assistant",
          created_at: conv.lastMessageAt?.toISOString() || new Date().toISOString(),
          is_within_24h: hoursElapsed <= 24,
          hours_elapsed: Math.round(hoursElapsed * 10) / 10,
          ai_paused: !conv.aiHandled,
          chat_status: conv.status === "OPEN" ? "open" : "closed",
          tags: conv.customer?.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || [],
          has_order: (conv.customer?.totalOrders || 0) > 0,
          order_count: conv.customer?.totalOrders || 0,
          order_status: "unknown",
          message_count: conv.unreadCount || 0,
          priority: conv.priority,
          unreadCount: conv.unreadCount,
          customerId: conv.customerId,
          assignedEmployeeId: conv.assignedEmployeeId,
        };
      });

      return NextResponse.json({ success: true, chats });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // -- 2. GET MESSAGES FOR A PHONE -----------------------------------------
  if (action === "messages") {
    const phone = searchParams.get("phone");
    const convId = searchParams.get("convId");
    if (!phone && !convId)
      return NextResponse.json({ error: "phone or convId required" }, { status: 400 });

    try {
      let conversation: any = null;

      if (convId) {
        conversation = await prisma.whatsAppConversation.findUnique({ where: { id: convId } });
      } else {
        const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
        const customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { mobile: { contains: cleanPhone } },
              { whatsappNumber: { contains: cleanPhone } },
            ],
          },
        });
        if (customer) {
          conversation = await prisma.whatsAppConversation.findFirst({
            where: { customerId: customer.id },
          });
        }
      }

      if (!conversation) {
        return NextResponse.json({ success: true, messages: [] });
      }

      // Reset unread count
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });

      const rawMessages = await prisma.whatsAppMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { sentAt: "asc" },
      });

      const messages = rawMessages.map((m) => ({
        id: m.id,
        phone: phone || "",
        role: m.senderType === "CUSTOMER" ? "user" : m.senderType === "AGENT" ? "assistant" : m.senderType === "AI" ? "assistant" : "internal_note",
        content: m.content || "",
        created_at: m.sentAt?.toISOString() || new Date().toISOString(),
        message_type: m.messageType,
        media_url: m.mediaUrl || null,
        media_type: m.mediaType || null,
        status: m.status,
        meta_message_id: m.metaMessageId,
        sender_name: m.senderName,
        conversationId: conversation.id,
      }));

      return NextResponse.json({ success: true, messages });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // -- 3. GET AI EXECUTION LOGS ---------------------------------------------
  if (action === "executions") {
    try {
      const executions = await prisma.whatsAppAILog.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      });

      const total_count = executions.length;
      const success_count = executions.filter((e) => e.status === "SUCCESS").length;
      const error_count = executions.filter((e) => e.status === "FAILED").length;
      const ignored_count = executions.filter((e) => e.status === "IGNORED").length;
      const validDurations = executions.filter((e) => (e.durationMs || 0) > 0).map((e) => e.durationMs || 0);
      const avg_duration = validDurations.length
        ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
        : 0;

      return NextResponse.json({
        success: true,
        executions: executions.map((e) => ({
          id: e.id,
          phone: e.phone,
          status: e.status,
          user_message: e.userMessage,
          ai_reply: e.aiReply,
          tools_called: e.toolsCalled,
          error_message: e.errorMessage,
          duration_ms: e.durationMs,
          created_at: e.createdAt?.toISOString(),
        })),
        stats: { total_count, success_count, error_count, ignored_count, avg_duration },
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// --- POST --------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action: postAction, phone, ai_paused, text, media_url, template_name, template_params, type, chat_status, convId } = body;

    if (!phone && !convId) {
      return NextResponse.json({ error: "phone or convId required" }, { status: 400 });
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);

    // -- A. Toggle AI ---------------------------------------------------------
    if (postAction === "toggle_ai") {
      let conversation: any = null;
      if (convId) {
        conversation = await prisma.whatsAppConversation.findUnique({ where: { id: convId } });
      } else {
        const customer = await prisma.customer.findFirst({
          where: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] },
        });
        if (customer) {
          conversation = await prisma.whatsAppConversation.findFirst({ where: { customerId: customer.id } });
        }
      }
      if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { aiHandled: !ai_paused },
      });
      return NextResponse.json({ success: true, phone, ai_paused: !!ai_paused });
    }

    // -- B. Set Chat Status ---------------------------------------------------
    if (postAction === "set_status") {
      let conversation: any = null;
      if (convId) {
        conversation = await prisma.whatsAppConversation.findUnique({ where: { id: convId } });
      } else {
        const customer = await prisma.customer.findFirst({
          where: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] },
        });
        if (customer) {
          conversation = await prisma.whatsAppConversation.findFirst({ where: { customerId: customer.id } });
        }
      }
      if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { status: chat_status === "closed" ? "CLOSED" : "OPEN" },
      });
      return NextResponse.json({ success: true, phone, chat_status });
    }

    // -- C. Send Message / Template -------------------------------------------
    if (postAction === "send_message" || postAction === "send_template") {
      // Find or create conversation
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ mobile: { contains: cleanPhone } }, { whatsappNumber: { contains: cleanPhone } }] },
      });

      let conversation: any = null;
      if (customer) {
        conversation = await prisma.whatsAppConversation.findFirst({ where: { customerId: customer.id } });
      }

      // Get WhatsApp account for token
      const account = await getAccount();
      const token = account?.accessToken || process.env.META_WHATSAPP_TOKEN;
      const phoneId = account?.phoneId || process.env.META_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        return NextResponse.json({ error: "WhatsApp API Token not configured. Please set in Settings." }, { status: 500 });
      }

      // Handle internal note (no Meta API call)
      if (type === "internal_note") {
        if (conversation) {
          await prisma.whatsAppMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: "AGENT",
              senderName: "Internal Note",
              messageType: "TEXT",
              content: text || "",
              status: "DELIVERED",
              sentAt: new Date(),
            },
          });
        }
        return NextResponse.json({ success: true, message_id: "internal", content: text });
      }

      const toPhone = String(phone).replace(/\D/g, "");
      const metaUrl = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

      let payload: any = { messaging_product: "whatsapp", to: toPhone };

      if (type === "image" && media_url) {
        payload.type = "image";
        payload.image = { link: media_url, caption: text || "" };
      } else if (type === "audio" && media_url) {
        payload.type = "audio";
        payload.audio = { link: media_url };
      } else if ((type === "template" || postAction === "send_template") && template_name) {
        payload.type = "template";
        const components: any[] = [];
        if (Array.isArray(template_params) && template_params.length > 0) {
          components.push({
            type: "body",
            parameters: template_params.map((p: any) => ({ type: "text", text: String(p || "") })),
          });
        }
        payload.template = {
          name: template_name,
          language: { code: "en_US" },
          ...(components.length > 0 && { components }),
        };
      } else {
        payload.type = "text";
        payload.text = { body: text || "" };
      }

      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        const errMsg = metaData?.error?.message || "Meta API Error";
        return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
      }

      // Save message to DB
      const displayContent =
        type === "template" || postAction === "send_template"
          ? `[TEMPLATE SENT: ${template_name}]`
          : type === "image"
          ? `[IMAGE] ${text || media_url}`
          : type === "audio"
          ? `[AUDIO] ${media_url}`
          : text || "";

      if (conversation) {
        await prisma.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            senderType: "AGENT",
            senderName: "Agent",
            messageType: type?.toUpperCase() || "TEXT",
            content: displayContent,
            mediaUrl: media_url || null,
            status: "SENT",
            metaMessageId: metaData?.messages?.[0]?.id || null,
            sentAt: new Date(),
          },
        });
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { lastMessageText: displayContent, lastMessageAt: new Date(), status: "OPEN" },
        });
      }

      return NextResponse.json({
        success: true,
        message_id: metaData?.messages?.[0]?.id || "sent",
        content: displayContent,
      });
    }

    return NextResponse.json({ error: "Unknown postAction" }, { status: 400 });
  } catch (err: any) {
    console.error("[inbox POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
