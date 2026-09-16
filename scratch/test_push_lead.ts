import { prisma } from "../src/lib/prisma";

async function testPushLead() {
  const conv = await prisma.whatsAppConversation.findFirst({
    orderBy: { updatedAt: "desc" },
    include: { customer: true, assignedEmployee: { include: { user: true } } }
  });

  if (!conv) {
    console.log("No conv found");
    return;
  }

  console.log("Found conv:", conv.id, "customer:", conv.customer?.contactPerson, "phone:", conv.customer?.whatsappNumber || conv.customer?.mobile);

  // Check integrations
  const allActive = await prisma.whatsAppIntegration.findMany({
    where: {
      isActive: true,
      type: { notIn: ['META_CAPI', 'PIXEL', 'META_CATALOG', 'CATALOG_ACTIVE_SOURCE'] }
    }
  });

  console.log("Active CRM integrations:", allActive.length);
  for (const int of allActive) {
    console.log("Integration:", int.name, int.url, "token:", int.token ? "YES" : "NO");
    const payload = {
      name: conv.customer?.contactPerson || conv.customer?.businessName || 'WhatsApp Customer',
      whatsappNumber: (conv.customer?.whatsappNumber || conv.customer?.mobile || '').replace(/\D/g, ''),
      mobile: (conv.customer?.mobile || conv.customer?.whatsappNumber || '').replace(/\D/g, ''),
      shopName: (conv.customer as any)?.shopName || conv.customer?.businessName || '',
      agentEmail: conv.assignedEmployee?.user?.email || 'esponclothing103@gmail.com',
      tags: conv.customer?.tags || conv.tags || 'WhatsApp Lead',
      city: (conv.customer as any)?.city || (conv.customer as any)?.billingAddress || '',
      source: 'WhatsApp Inbox'
    };

    console.log("Payload to send:", payload);

    try {
      const res = await fetch(int.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(int.token ? { Authorization: int.token } : {})
        },
        body: JSON.stringify(payload)
      });
      console.log("Response:", res.status, res.statusText);
      const text = await res.text();
      console.log("Response text:", text);
    } catch (e: any) {
      console.log("Fetch error:", e.message);
    }
  }
}

testPushLead().catch(console.error).finally(() => prisma.$disconnect());
