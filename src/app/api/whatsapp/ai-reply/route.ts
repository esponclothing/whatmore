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
    const aiModel = settings?.aiModel || "gemini-3.6-flash"; // gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash

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
- Respond in ${fallbackLanguage}.
- Base your response ONLY on the knowledge base provided. If the answer is not in the knowledge base, politely state that you do not know or will connect them to a human agent.
- Keep the response concise and friendly, suitable for WhatsApp.
- Do not include 'Agent:' in your output. Just provide the raw text response.
`;

    if (customPrompt) {
      fullPrompt += `\nAdditional Instructions for this specific reply: ${customPrompt}\n`;
    }

    fullPrompt += `\n--- Chat History ---\n${chatHistory}\n\nAgent (Your suggested reply):`;

    // 5. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Map custom UI model strings to actual Gemini model names
    let geminiModelName = "gemini-3.6-flash";
    if (aiModel === "gemini-3.5-flash") geminiModelName = "gemini-3.5-flash";
    else if (aiModel === "gemini-3.1-pro" || aiModel === "gemini-3.1-pro-preview") geminiModelName = "gemini-3.1-pro-preview";
    else if (aiModel === "gemini-2.5-flash") geminiModelName = "gemini-3.6-flash";
    else if (aiModel === "gemini-1.5-flash") geminiModelName = "gemini-3.5-flash";
    else geminiModelName = aiModel;

    let responseText = "";
    let finalModelUsed = geminiModelName;

    try {
      const response = await ai.models.generateContent({
        model: geminiModelName,
        contents: fullPrompt,
      });
      responseText = response.text?.trim() || "";
    } catch (e: any) {
      if (e.message?.includes("not found")) {
        console.warn(`[AI Reply] Model ${geminiModelName} not found. Trying fallback...`);
        // Fallback cascade
        const fallbacks = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview"];
        let success = false;
        
        for (const fallbackModel of fallbacks) {
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: fallbackModel,
              contents: fullPrompt,
            });
            responseText = fallbackResponse.text?.trim() || "";
            finalModelUsed = fallbackModel;
            success = true;
            break;
          } catch (err: any) {
             console.warn(`[AI Reply] Fallback model ${fallbackModel} failed.`);
          }
        }
        
        if (!success) {
           throw new Error("All AI models failed or were not found in your region. Check your API key access.");
        }
      } else {
        throw e;
      }
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
