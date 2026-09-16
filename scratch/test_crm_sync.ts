import { prisma } from "../src/lib/prisma";
import { syncLeadToCRMAction } from "../src/app/actions/whatsAppPlatformActions";

async function main() {
  console.log("Testing syncLeadToCRMAction...");
  
  // Find an existing conversation
  const conv = await prisma.whatsAppConversation.findFirst({
    include: {
      customer: true,
      messages: { take: 5, orderBy: { sentAt: "desc" } }
    }
  });

  if (!conv) {
    console.log("No conversation found in DB.");
    return;
  }

  console.log(`Found conversation ${conv.id} for phone: ${conv.customerPhone}, existing customer: ${conv.customer?.name || "none"}`);

  // Test syncing this conversation to CRM
  const res = await syncLeadToCRMAction({
    conversationId: conv.id,
    customerName: conv.customerName || "Test Lead",
    leadStage: "HOT_LEAD",
    tags: ["Hot Lead", "WhatsApp Inbound", "Espon Qualified"],
    notes: "Auto-qualified lead synced via WhatsApp CRM Quick Push action."
  });

  console.log("syncLeadToCRMAction Result:", JSON.stringify(res, null, 2));

  // Verify in DB
  const updatedConv = await prisma.whatsAppConversation.findUnique({
    where: { id: conv.id },
    include: { customer: true }
  });

  console.log("Updated Customer in DB:", {
    id: updatedConv?.customer?.id,
    name: updatedConv?.customer?.name,
    phone: updatedConv?.customer?.phone,
    leadStatus: updatedConv?.customer?.leadStatus,
    tags: updatedConv?.customer?.tags,
    notes: updatedConv?.customer?.notes?.slice(0, 100)
  });
}

main()
  .catch((e) => {
    console.error("Test error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
