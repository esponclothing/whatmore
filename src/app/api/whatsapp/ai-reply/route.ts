import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { conversationId, customPrompt } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    // 1. Fetch settings
    const settings = await prisma.whatsAppSettings.findFirst();
    const aiKnowledgeBase = settings?.aiKnowledgeBase || "";
    const aiSystemPrompt = settings?.aiSystemPrompt || "You are a helpful customer service assistant for our business.";
    const fallbackLanguage = settings?.aiFallbackLanguage || "English";
    const aiModel = settings?.aiModel || "gemini-2.0-flash"; // gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash

    // 2. Fetch the conversation and its messages
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 50 // last 50 messages for context
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 3. Format chat history for Gemini
    let chatHistory = "";
    conversation.messages.forEach((msg: any) => {
      const sender = msg.senderType === 'CUSTOMER' ? 'Customer' : 'Agent';
      chatHistory += `${sender}: ${msg.content || '[Media Message]'}\n`;
    });

    // 4. Construct the prompt
    let fullPrompt = `System Persona & Instructions:
${aiSystemPrompt}

Knowledge Base (Company Information & FAQs):
${aiKnowledgeBase}

Rules:
- Start the conversation in ${fallbackLanguage}. If the customer speaks another language (like Hindi/Hinglish), smoothly adapt and respond in their language.
- ONLY entertain B2B customers (Wholesalers, Retailers, Business owners). If the customer is asking for personal use (B2C), politely decline and state that we only do wholesale.
- Base your response ONLY on the knowledge base provided. If you don't know, politely state that you will connect them to a human agent.
- Keep the response concise and friendly, suitable for WhatsApp (1-3 short sentences max).
- CRITICAL: Output ONLY the exact, raw text message to be sent to the customer. Do NOT include any prefixes (like 'Agent:', 'Reply:'), internal thoughts, quotes, or markdown bullet points.
`;

    if (customPrompt) {
      fullPrompt += `\nAdditional Instructions for this specific reply: ${customPrompt}\n`;
    }

    fullPrompt += `\n--- Chat History ---\n${chatHistory}\n\nAgent (Your suggested reply):`;

    // 5. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY || settings?.geminiApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const { callGeminiRest, GEMINI_MODEL_CASCADE } = await import('@/lib/whatsappAI');

    const preferredModel = aiModel || 'gemini-3.8-flash';
    const cascade = [
      preferredModel,
      ...GEMINI_MODEL_CASCADE.filter(m => m !== preferredModel)
    ];

    let responseText = "";
    let finalModelUsed = preferredModel;
    let lastError = "";

    for (const model of cascade) {
      try {
        responseText = await callGeminiRest(apiKey, model, fullPrompt, aiSystemPrompt, 400);
        finalModelUsed = model;
        break;
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[AI Reply] Model ${model} failed:`, err.message);
      }
    }

    if (!responseText) {
      throw new Error(`All AI models failed in cascade. Last error: ${lastError}`);
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      modelUsed: finalModelUsed
    });

  } catch (error: any) {
    console.error("AI Reply Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
