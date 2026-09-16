import { prisma } from "../src/lib/prisma";

async function main() {
  const erp = await prisma.whatsAppIntegration.findUnique({
    where: { id: "dc4f2b65-1354-47a0-af43-74f0d66a78b0" }
  });
  console.log("Erp Espon integration record:", JSON.stringify(erp, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
