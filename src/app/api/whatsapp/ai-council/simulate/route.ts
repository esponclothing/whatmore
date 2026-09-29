import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isOwnerAuthenticated } from "@/lib/authSession";
import { getClientAICouncilConfig, executeCouncilDebate, AICouncilConfig } from "@/lib/aiCouncilEngine";

// POST: Run Multi-Agent Council Debate Simulation (Battle Arena)
export async function POST(req: NextRequest) {
  try {
    const isOwner = isOwnerAuthenticated(req);
    const user = await getAuthenticatedUser(req);
    if (!isOwner && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerQuery, config: customConfig, clientId: bodyClientId } = body;

    if (!customerQuery || typeof customerQuery !== "string" || !customerQuery.trim()) {
      return NextResponse.json({ error: "customerQuery is required" }, { status: 400 });
    }

    const clientId = user?.clientId || bodyClientId || null;

    // Resolve API key & Knowledge base
    let apiKey = process.env.GEMINI_API_KEY || "";
    let knowledgeBase = "";
    let model = "gemini-flash-lite-latest";

    if (clientId) {
      const client = await prisma.whatsAppClient.findUnique({
        where: { id: clientId },
        select: { geminiApiKey: true, aiKnowledgeBase: true, aiModel: true },
      });
      if (client?.geminiApiKey) apiKey = client.geminiApiKey;
      if (client?.aiKnowledgeBase) knowledgeBase = client.aiKnowledgeBase;
      if (client?.aiModel) model = client.aiModel;
    }

    if (!apiKey) {
      const settings = await prisma.whatsAppSettings.findFirst({
        select: { geminiApiKey: true, aiKnowledgeBase: true, aiModel: true },
      });
      if (settings?.geminiApiKey) apiKey = settings.geminiApiKey;
      if (settings?.aiKnowledgeBase && !knowledgeBase) knowledgeBase = settings.aiKnowledgeBase;
      if (settings?.aiModel && !model) model = settings.aiModel;
    }

    // Resolve config
    const configToUse: AICouncilConfig = customConfig || (await getClientAICouncilConfig(clientId));

    const result = await executeCouncilDebate(
      customerQuery.trim(),
      configToUse,
      knowledgeBase,
      apiKey,
      model
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[POST /api/whatsapp/ai-council/simulate Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
