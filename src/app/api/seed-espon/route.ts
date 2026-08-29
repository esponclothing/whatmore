import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ONE-TIME SEED ENDPOINT — WILL BE DELETED AFTER USE
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "espon-seed-2026") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if already seeded
    const existing = await prisma.whatsAppClient.findFirst({
      where: { businessName: { contains: "Espon" } },
      include: { agents: true }
    });
    if (existing) {
      return NextResponse.json({
        already_seeded: true,
        clientId: existing.id,
        webhookClientId: existing.webhookClientId,
        adminEmail: existing.agents.find(a => a.role === "ADMIN")?.email,
        webhookUrl: "https://whatmore-production.up.railway.app/api/whatsapp/webhook/" + existing.webhookClientId
      });
    }

    // Read existing WhatsApp account credentials
    const account = await prisma.whatsAppAccount.findFirst();
    const farFuture = new Date("2099-12-31T23:59:59Z");

    // Create Espon client record
    const client = await prisma.whatsAppClient.create({
      data: {
        businessName:      "Espon Sports",
        contactEmail:      "admin@esponsports.com",
        contactPhone:      account?.phoneNumber || "",
        ownerWhatsApp:     account?.phoneNumber || "",
        wabaId:            account?.businessAccountId || "",
        phoneId:           account?.phoneId || "",
        metaAccessToken:   account?.accessToken || "",
        phoneNumber:       account?.phoneNumber || "",
        webhookVerifyToken: "espon_whatsapp_secure_webhook_token_2026",
        shopifyDomain:     "",
        shopifyToken:      "",
        subscriptionPlan:   "ENTERPRISE",
        monthlyFee:         0,
        subscriptionStatus: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd:   farFuture,
        maxAgents:   50,
        isActive:    true,
        notes: "Espon Sports — Original client, free plan, migrated from legacy setup.",
      }
    });

    // Create admin agent user
    const agent = await prisma.whatsAppAgentUser.upsert({
      where: { email: "admin@esponsports.com" },
      update: { clientId: client.id, role: "ADMIN", isActive: true, name: "Espon Admin" },
      create: {
        clientId: client.id,
        name:     "Espon Admin",
        email:    "admin@esponsports.com",
        password: "espon@admin2026",
        role:     "ADMIN",
        isActive: true
      }
    });

    // Mark as paid (free)
    await prisma.whatsAppClientPayment.create({
      data: {
        clientId:    client.id,
        amount:      0,
        periodStart: new Date(),
        periodEnd:   farFuture,
        notes:       "Free plan — Espon Sports original setup client, no charge.",
        markedByOwner: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Espon Sports registered successfully as SaaS client!",
      clientId: client.id,
      webhookClientId: client.webhookClientId,
      webhookUrl: "https://whatmore-production.up.railway.app/api/whatsapp/webhook/" + client.webhookClientId,
      adminEmail: agent.email,
      adminPassword: "espon@admin2026",
      plan: "ENTERPRISE (FREE — expires 2099)",
      maxAgents: 50,
      note: "All existing WhatsAppSettings (AI, Knowledge Base, SLA etc.) remain active and shared."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
