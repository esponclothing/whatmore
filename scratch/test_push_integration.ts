import { prisma } from "../src/lib/prisma";
import { pushLeadToIntegrationAction } from "../src/app/actions/whatsAppIntegrationActions";

async function main() {
  console.log("Finding a conversation...");
  const conv = await prisma.whatsAppConversation.findFirst({
    include: { customer: true, assignedEmployee: { include: { user: true } } }
  });

  if (!conv) {
    console.log("No conversation found.");
    return;
  }

  console.log(`Found conversation: ${conv.id}, customer: ${conv.customer?.contactPerson || conv.customer?.businessName}, phone: ${conv.customer?.whatsappNumber || conv.customer?.mobile}`);

  console.log("Calling pushLeadToIntegrationAction...");
  const res = await pushLeadToIntegrationAction(conv.id);
  console.log("Result of pushLeadToIntegrationAction:", JSON.stringify(res, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
