import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.whatsAppClient.findMany({
    select: {
      id: true,
      businessName: true,
      ownerWhatsApp: true,
      enabledModules: true,
      subscriptionPlan: true
    }
  });
  console.log("Current Clients in DB:");
  console.log(JSON.stringify(clients, null, 2));
}

main().finally(() => prisma.$disconnect());
