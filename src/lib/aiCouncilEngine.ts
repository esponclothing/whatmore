import { prisma } from "@/lib/prisma";
import { callGeminiRest, HARDCODED_PRIMARY_MODEL } from "@/lib/whatsappAI";

export interface CouncilAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  personality: string;
  rules: string;
  priority: number; // 1 - 10
  isEnabled: boolean;
}

export interface AICouncilConfig {
  enabled: boolean;
  councilName: string;
  consensusModel: "BOSS_SYNTHESIS" | "UNANIMOUS" | "WEIGHTED_MAJORITY";
  bossAgentName: string;
  industryPreset: string;
  agents: CouncilAgent[];
  minConsensusConfidence: number; // e.g. 75
  autoHumanHandoverOnVeto: boolean;
}

export interface AgentDebateThought {
  agentId: string;
  agentName: string;
  role: string;
  avatar: string;
  color: string;
  thought: string;
  verdict: "APPROVED" | "VETOED" | "MODIFIED" | "PITCH";
  proposedAction?: string;
  confidenceScore: number; // 0 - 100
}

export interface CouncilDebateResult {
  success: boolean;
  thoughts: AgentDebateThought[];
  finalAnswer: string;
  bossReasoning: string;
  overallConfidence: number;
  hasVeto: boolean;
  vetoDetails?: string;
  recommendedHandover: boolean;
}

// -------------------------------------------------------------
// Industry Presets
// -------------------------------------------------------------
export const INDUSTRY_PRESETS: Record<string, { name: string; icon: string; description: string; config: AICouncilConfig }> = {
  APPAREL_D2C: {
    name: "Fashion & D2C Apparel",
    icon: "👕",
    description: "Ideal for clothing brands, streetwear, wholesale garments, and retail boutiques.",
    config: {
      enabled: true,
      councilName: "Apparel Sales & Margin Council",
      consensusModel: "BOSS_SYNTHESIS",
      bossAgentName: "Director Sterling (Council Boss)",
      industryPreset: "APPAREL_D2C",
      minConsensusConfidence: 75,
      autoHumanHandoverOnVeto: false,
      agents: [
        {
          id: "agent-1",
          name: "Alex",
          role: "Sales Closer & Urgency Expert",
          avatar: "⚡",
          color: "#6366f1",
          personality: "High-energy, charismatic, focused on locking orders with subtle urgency and limited-edition hype.",
          rules: "Always try to close the sale. Highlight fast dispatch, premium quality, and exclusive perks.",
          priority: 9,
          isEnabled: true,
        },
        {
          id: "agent-2",
          name: "Marcus",
          role: "Margin & Policy Guardian",
          avatar: "🛡️",
          color: "#ef4444",
          personality: "Strict financial protector. Zero tolerance for unapproved discounts below floor price.",
          rules: "NEVER allow discounts > 10% unless order is > 50 pcs. Free shipping only above ₹999. Reject COD on bulk orders.",
          priority: 10,
          isEnabled: true,
        },
        {
          id: "agent-3",
          name: "Sophia",
          role: "Personal Stylist & Cross-Seller",
          avatar: "🎨",
          color: "#10b981",
          personality: "Fashion-forward advisor. Knows size fits, fabric GSM, and which bottoms/accessories pair best.",
          rules: "Always recommend a matching accessory or bottom-wear if customer is interested. Advise on sizing chart.",
          priority: 8,
          isEnabled: true,
        },
        {
          id: "agent-4",
          name: "Logistics Leo",
          role: "Stock & Dispatch Specialist",
          avatar: "📦",
          color: "#f59e0b",
          personality: "Realistic operations advisor. Gives exact delivery timelines and courier assurances.",
          rules: "Standard dispatch in 24-48 hrs. Express delivery available on prepaid. Easy 7-day exchange.",
          priority: 7,
          isEnabled: true,
        }
      ]
    }
  },
  B2B_MANUFACTURING: {
    name: "B2B & Wholesale Manufacturing",
    icon: "🏭",
    description: "For textile mills, fabric suppliers, bulk distributors, and OEM factories.",
    config: {
      enabled: true,
      councilName: "B2B Wholesale Quotation Council",
      consensusModel: "BOSS_SYNTHESIS",
      bossAgentName: "Chief Commercial Officer",
      industryPreset: "B2B_MANUFACTURING",
      minConsensusConfidence: 80,
      autoHumanHandoverOnVeto: true,
      agents: [
        {
          id: "b2b-1",
          name: "Vikram",
          role: "Volume Slab Negotiator",
          avatar: "💰",
          color: "#3b82f6",
          personality: "Sharp B2B commercial manager. Offers volume slab tiers: 50 pcs, 200 pcs, 500+ pcs.",
          rules: "Minimum Order Quantity (MOQ) is 30 pcs. Offer 5% at 50 pcs, 10% at 200 pcs, 15% at 500 pcs.",
          priority: 9,
          isEnabled: true,
        },
        {
          id: "b2b-2",
          name: "Rajesh",
          role: "Fabric & GSM Technical Engineer",
          avatar: "⚙️",
          color: "#8b5cf6",
          personality: "Technical textile expert. Explains 220 GSM combed cotton, bio-wash, screen/puff print specs.",
          rules: "Highlight sample swatch books for new buyers. Confirm GST invoicing and HSN codes.",
          priority: 8,
          isEnabled: true,
        },
        {
          id: "b2b-3",
          name: "Anita",
          role: "Credit Risk & Payment Terms Guard",
          avatar: "🛡️",
          color: "#ef4444",
          personality: "Conservative risk underwriter. Strictly controls credit and advance tokens.",
          rules: "First-time buyers must pay 100% advance or 30% advance + 70% against dispatch LR copy. No unverified credit.",
          priority: 10,
          isEnabled: true,
        }
      ]
    }
  },
  REAL_ESTATE: {
    name: "Real Estate & Builders",
    icon: "🏢",
    description: "For property developers, brokers, luxury villas, and commercial real estate agents.",
    config: {
      enabled: true,
      councilName: "Property Advisory Council",
      consensusModel: "BOSS_SYNTHESIS",
      bossAgentName: "Senior Partner",
      industryPreset: "REAL_ESTATE",
      minConsensusConfidence: 75,
      autoHumanHandoverOnVeto: false,
      agents: [
        {
          id: "re-1",
          name: "Arjun",
          role: "Luxury Project Specialist",
          avatar: "🌟",
          color: "#ec4899",
          personality: "High-end property consultant. Highlights prime location, clubhouse, RERA registration, and ROI.",
          rules: "Build high aspiration. Never reveal bottom-line discounted price in initial chat; offer on site visit only.",
          priority: 9,
          isEnabled: true,
        },
        {
          id: "re-2",
          name: "Meera",
          role: "Financial & EMI Consultant",
          avatar: "📊",
          color: "#10b981",
          personality: "Practical financial counselor. Assists with down-payment slabs, pre-approved bank loans.",
          rules: "Offer 10:90 or 20:80 construction-linked payment plans. Mention all major bank tie-ups.",
          priority: 8,
          isEnabled: true,
        },
        {
          id: "re-3",
          name: "Kabir",
          role: "Site Visit & VIP Cab Coordinator",
          avatar: "📅",
          color: "#6366f1",
          personality: "Action-oriented appointment closer. Main objective is locking a physical or virtual site visit.",
          rules: "Always offer two specific weekend slots for site inspection. Offer complimentary AC cab pickup.",
          priority: 9,
          isEnabled: true,
        }
      ]
    }
  },
  HEALTHCARE: {
    name: "Healthcare, Clinics & Diagnostics",
    icon: "🏥",
    description: "For dental clinics, diagnostic centers, dermatologists, and wellness centers.",
    config: {
      enabled: true,
      councilName: "Clinical Care & Triage Council",
      consensusModel: "BOSS_SYNTHESIS",
      bossAgentName: "Chief Medical Concierge",
      industryPreset: "HEALTHCARE",
      minConsensusConfidence: 85,
      autoHumanHandoverOnVeto: true,
      agents: [
        {
          id: "hc-1",
          name: "Dr. Elena",
          role: "Empathy & Symptom Triage",
          avatar: "🩺",
          color: "#06b6d4",
          personality: "Warm, professional, listening deeply to patient concerns and guiding to appropriate specialist.",
          rules: "Never prescribe prescription drugs on WhatsApp. Always guide patient to in-person/video consultation.",
          priority: 10,
          isEnabled: true,
        },
        {
          id: "hc-2",
          name: "Legal Guard",
          role: "Medical Compliance Officer",
          avatar: "🛡️",
          color: "#ef4444",
          personality: "Strict healthcare regulator. Enforces HIPAA and medical board ethical guidelines.",
          rules: "Must append standard disclaimer: 'This is not emergency medical advice. For emergencies visit nearest hospital.'",
          priority: 10,
          isEnabled: true,
        },
        {
          id: "hc-3",
          name: "Ria",
          role: "Doctor Slot & Booking Specialist",
          avatar: "📅",
          color: "#10b981",
          personality: "Efficient scheduling assistant. Finds the earliest available doctor slot.",
          rules: "Offer slots for Morning (10 AM - 1 PM) and Evening (5 PM - 8 PM). Confirm appointment with instant calendar link.",
          priority: 8,
          isEnabled: true,
        }
      ]
    }
  }
};

// -------------------------------------------------------------
// Database Get/Set Helpers
// -------------------------------------------------------------
export async function getClientAICouncilConfig(clientId?: string | null): Promise<AICouncilConfig> {
  const defaultPreset = INDUSTRY_PRESETS.APPAREL_D2C.config;

  try {
    if (clientId) {
      const client = await prisma.whatsAppClient.findUnique({
        where: { id: clientId },
        select: { customLimitsJson: true },
      });
      if (client?.customLimitsJson) {
        try {
          const parsed = JSON.parse(client.customLimitsJson);
          if (parsed.aiCouncil && typeof parsed.aiCouncil === "object") {
            return { ...defaultPreset, ...parsed.aiCouncil };
          }
        } catch (_) {}
      }
    }

    // Global settings fallback
    const settings = await prisma.whatsAppSettings.findFirst({
      select: { aiSystemPrompt: true },
    });
    if (settings?.aiSystemPrompt && settings.aiSystemPrompt.includes("AI_COUNCIL_CONFIG:")) {
      try {
        const jsonStr = settings.aiSystemPrompt.split("AI_COUNCIL_CONFIG:")[1]?.split("---END_AI_COUNCIL---")[0];
        if (jsonStr) {
          return { ...defaultPreset, ...JSON.parse(jsonStr) };
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error("[getClientAICouncilConfig Error]:", err);
  }

  return defaultPreset;
}

export async function saveClientAICouncilConfig(
  config: AICouncilConfig,
  clientId?: string | null
): Promise<boolean> {
  try {
    if (clientId) {
      const client = await prisma.whatsAppClient.findUnique({
        where: { id: clientId },
        select: { customLimitsJson: true },
      });
      let existingObj: Record<string, any> = {};
      if (client?.customLimitsJson) {
        try {
          existingObj = JSON.parse(client.customLimitsJson);
        } catch (_) {}
      }
      existingObj.aiCouncil = config;

      await prisma.whatsAppClient.update({
        where: { id: clientId },
        data: { customLimitsJson: JSON.stringify(existingObj) },
      });
      return true;
    }

    // Fallback to WhatsAppSettings
    const settings = await prisma.whatsAppSettings.findFirst();
    if (settings) {
      const promptWithoutCouncil = (settings.aiSystemPrompt || "").split("AI_COUNCIL_CONFIG:")[0].trim();
      const updatedPrompt = `${promptWithoutCouncil}\n\nAI_COUNCIL_CONFIG:${JSON.stringify(config)}---END_AI_COUNCIL---`;
      await prisma.whatsAppSettings.update({
        where: { id: settings.id },
        data: { aiSystemPrompt: updatedPrompt },
      });
      return true;
    }
  } catch (err) {
    console.error("[saveClientAICouncilConfig Error]:", err);
  }
  return false;
}

// -------------------------------------------------------------
// Multi-Agent Swarm Debate Simulation & Live Execution Engine
// -------------------------------------------------------------
export async function executeCouncilDebate(
  customerQuery: string,
  config: AICouncilConfig,
  contextKnowledgeBase?: string,
  apiKeyOverride?: string,
  modelOverride?: string
): Promise<CouncilDebateResult> {
  const enabledAgents = config.agents.filter((a) => a.isEnabled);
  if (enabledAgents.length === 0) {
    return {
      success: false,
      thoughts: [],
      finalAnswer: "No council agents are currently enabled.",
      bossReasoning: "Council is disabled or has no active members.",
      overallConfidence: 0,
      hasVeto: false,
      recommendedHandover: true,
    };
  }

  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY || "";
  const model = modelOverride || HARDCODED_PRIMARY_MODEL || "gemini-flash-lite-latest";

  const agentsDescription = enabledAgents
    .map(
      (a, i) =>
        `Agent #${i + 1}:
- Name: ${a.name} (${a.avatar})
- Role: ${a.role}
- Priority: ${a.priority}/10
- Personality: ${a.personality}
- Strict Rules & Guardrails: ${a.rules}`
    )
    .join("\n\n");

  const prompt = `You are the Autonomous Multi-Agent Swarm Debate Engine for a premier business.
Below is the council of specialized AI agents who must debate and synthesize the single best response for the customer.

KNOWLEDGE BASE & POLICIES:
${contextKnowledgeBase || "Standard wholesale apparel manufacturer with high quality standards, pan-India delivery, and easy exchanges."}

THE COUNCIL SQUAD:
${agentsDescription}

COUNCIL BOSS:
Name: ${config.bossAgentName}
Consensus Model: ${config.consensusModel}
Min Confidence Required: ${config.minConsensusConfidence}%

CUSTOMER MESSAGE / INQUIRY:
"${customerQuery}"

YOUR TASK:
1. Simulate the step-by-step internal debate from EVERY active agent. Each agent must analyze the customer inquiry according to their specific role, personality, and strict rules.
2. If any agent's strict rules or floor limits are violated (e.g. margin, credit risk, policy breach), that agent MUST issue a "VETOED" verdict with clear reasoning.
3. The Council Boss (${config.bossAgentName}) must review all opinions, strictly respect any valid VETO from high-priority guardrail agents, and synthesize the ultimate customer-facing WhatsApp response.
4. Output STRICT JSON only with this exact structure:

{
  "thoughts": [
    {
      "agentId": "agent-1",
      "agentName": "Alex",
      "role": "Sales Closer & Urgency Expert",
      "avatar": "⚡",
      "color": "#6366f1",
      "thought": "Direct thought on what we should do to win this customer",
      "verdict": "PITCH", // "APPROVED" | "VETOED" | "MODIFIED" | "PITCH"
      "proposedAction": "Counter with 8% discount + free express delivery",
      "confidenceScore": 88
    }
  ],
  "bossReasoning": "Brief explanation of how the boss resolved conflicts between the agents and obeyed guardrails",
  "hasVeto": false,
  "vetoDetails": "Details if any guardrail agent vetoed",
  "overallConfidence": 90,
  "recommendedHandover": false,
  "finalAnswer": "The exact natural, polished WhatsApp message in Hinglish/English ready to send to customer"
}`;

  const primaryModel = modelOverride || HARDCODED_PRIMARY_MODEL || "gemini-flash-lite-latest";
  const cascade = [
    primaryModel,
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
  ];

  let rawResponse = "";
  let lastError = "";

  for (const modelToTry of cascade) {
    try {
      rawResponse = await callGeminiRest(
        apiKey,
        modelToTry,
        prompt,
        "You are the Autonomous Multi-Agent Swarm Debate Engine. Always respond in strict valid JSON.",
        1500
      );
      if (rawResponse && rawResponse.trim()) {
        break;
      }
    } catch (e: any) {
      lastError = e.message;
      console.warn(`[AI Council] Model ${modelToTry} failed:`, e.message);
    }
  }

  if (!rawResponse) {
    return {
      success: false,
      thoughts: enabledAgents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        role: a.role,
        avatar: a.avatar,
        color: a.color,
        thought: "Awaiting API response...",
        verdict: "APPROVED",
        proposedAction: "Review customer message",
        confidenceScore: 70,
      })),
      finalAnswer: "Thank you for reaching out! Our team is reviewing your inquiry.",
      bossReasoning: `Google AI API error: ${lastError || "No response received. Please verify your Gemini API key."}`,
      overallConfidence: 65,
      hasVeto: false,
      recommendedHandover: true,
      vetoDetails: lastError,
    };
  }

  try {
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Resilient JSON substring finder
    let jsonStr = cleaned;
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Merge agent UI colors/avatars in case AI returned partial
    const enrichedThoughts: AgentDebateThought[] = (parsed.thoughts || []).map((t: any, index: number) => {
      const matched =
        enabledAgents.find(
          (a) => a.id === t.agentId || a.name.toLowerCase() === (t.agentName || "").toLowerCase()
        ) ||
        enabledAgents[index] ||
        enabledAgents[0];
      return {
        agentId: matched.id,
        agentName: matched.name,
        role: matched.role,
        avatar: matched.avatar,
        color: matched.color,
        thought: t.thought || "Analyzing customer inquiry...",
        verdict: t.verdict || "APPROVED",
        proposedAction: t.proposedAction || "",
        confidenceScore: t.confidenceScore || 85,
      };
    });

    return {
      success: true,
      thoughts: enrichedThoughts.length > 0 ? enrichedThoughts : enabledAgents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        role: a.role,
        avatar: a.avatar,
        color: a.color,
        thought: "Evaluated inquiry against guidelines.",
        verdict: "APPROVED",
        proposedAction: "Engage customer with best offer",
        confidenceScore: 85,
      })),
      finalAnswer: parsed.finalAnswer || "Hello! How can we assist you today?",
      bossReasoning: parsed.bossReasoning || "Consensus achieved across council.",
      overallConfidence: parsed.overallConfidence || 85,
      hasVeto: !!parsed.hasVeto,
      vetoDetails: parsed.vetoDetails || "",
      recommendedHandover: !!parsed.recommendedHandover || (parsed.overallConfidence || 85) < config.minConsensusConfidence,
    };
  } catch (err: any) {
    console.error("[executeCouncilDebate JSON Parse Error]:", err);
    return {
      success: false,
      thoughts: enabledAgents.map((a) => ({
        agentId: a.id,
        agentName: a.name,
        role: a.role,
        avatar: a.avatar,
        color: a.color,
        thought: "Analyzing inquiry based on role...",
        verdict: "APPROVED",
        proposedAction: "Review customer message",
        confidenceScore: 75,
      })),
      finalAnswer: "Thank you for reaching out! We are reviewing your inquiry to provide you with the best solution.",
      bossReasoning: `AI output parsing fallback: ${err.message}`,
      overallConfidence: 70,
      hasVeto: false,
      recommendedHandover: true,
    };
  }
}
