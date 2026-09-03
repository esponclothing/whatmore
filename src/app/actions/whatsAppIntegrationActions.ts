"use server";

import { prisma } from "@/lib/prisma";

export async function getWhatsAppIntegrationsAction() {
  try {
    const integrations = await prisma.whatsAppIntegration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, integrations };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createWhatsAppIntegrationAction(data: { name: string, url: string, token: string, type?: string }) {
  try {
    const integration = await prisma.whatsAppIntegration.create({
      data: {
        name: data.name,
        url: data.url,
        token: data.token || null,
        type: data.type || "CRM_LEAD"
      }
    });
    return { success: true, integration };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateWhatsAppIntegrationAction(id: string, data: { name: string, url: string, token: string, type?: string }) {
  try {
    const integration = await prisma.whatsAppIntegration.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        token: data.token || null,
        type: data.type || "CRM_LEAD"
      }
    });
    return { success: true, integration };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteWhatsAppIntegrationAction(id: string) {
  try {
    await prisma.whatsAppIntegration.delete({
      where: { id }
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function toggleWhatsAppIntegrationAction(id: string, isActive: boolean) {
  try {
    const integration = await prisma.whatsAppIntegration.update({
      where: { id },
      data: { isActive }
    });
    return { success: true, integration };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function pushLeadToIntegrationAction(conversationId: string, integrationId: string) {
  try {
    const integration = await prisma.whatsAppIntegration.findUnique({ where: { id: integrationId } });
    if (!integration) throw new Error("Integration not found");

    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: { customer: true, assignedEmployee: { include: { user: true } } }
    });
    if (!conv || !conv.customer) throw new Error("Conversation or customer not found");

    const payload = {
      name: conv.customer.contactPerson || conv.customer.businessName || 'Unknown',
      whatsappNumber: conv.customer.whatsappNumber || conv.customer.mobile,
      shopName: conv.customer.shopName || '',
      agentEmail: conv.assignedEmployee?.user?.email || ''
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (integration.token) {
      headers['Authorization'] = integration.token;
    }

    const whRes = await fetch(integration.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!whRes.ok) {
      const errText = await whRes.text().catch(() => "");
      throw new Error(`Webhook failed with status ${whRes.status}: ${errText}`);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
