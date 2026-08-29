import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "espon-webhook-fix-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find Espon client
    const espon = await prisma.whatsAppClient.findFirst({
      where: { businessName: { contains: "Espon" } }
    });

    if (!espon) {
      return NextResponse.json({ error: "Espon client not found" }, { status: 404 });
    }

    // Set the default webhook URL (already registered on Meta)
    const updated = await prisma.whatsAppClient.update({
      where: { id: espon.id },
      data: {
        customWebhookUrl: "https://whatmore-production.up.railway.app/api/whatsapp/webhook",
        webhookVerifyToken: "espon_whatsapp_secure_webhook_token_2026",
      }
    });

    return NextResponse.json({
      success: true,
      message: "Espon webhook URL updated to default webhook",
      webhookUrl: updated.customWebhookUrl,
      verifyToken: updated.webhookVerifyToken,
      clientId: espon.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
