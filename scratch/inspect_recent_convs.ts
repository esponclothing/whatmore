import { prisma } from "../src/lib/prisma";

async function main() {
  const convs = await prisma.whatsAppConversation.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: true,
      assignedEmployee: { include: { user: true } }
    }
  });

  console.log("Recent 5 conversations:");
  for (const c of convs) {
    console.log({
      id: c.id,
      phone: c.phone,
      contactName: (c as any).contactName,
      leadStatus: c.leadStatus,
      customerId: c.customerId,
      customerName: c.customer?.contactPerson,
      customerNotes: c.customer?.notes,
      assignedEmployee: c.assignedEmployee?.user?.name
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
