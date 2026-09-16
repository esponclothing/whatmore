import { prisma } from "../src/lib/prisma";

async function main() {
  const integrations = await prisma.whatsAppIntegration.findMany();
  console.log("Total Integrations:", integrations.length);
  for (const it of integrations) {
    console.log({
      id: it.id,
      name: it.name,
      type: it.type,
      isActive: it.isActive,
      webhookUrl: it.webhookUrl,
      clientId: it.clientId,
      events: it.events
    });
  }

  const agents = await prisma.whatsAppAgentUser.findMany();
  console.log("Total WhatsAppAgentUsers:", agents.length);
  for (const a of agents) {
    console.log({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      clientId: a.clientId,
      isActive: a.isActive
    });
  }

  const legacyUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });
  console.log("Total Legacy Users:", legacyUsers.length);
  for (const u of legacyUsers) {
    console.log(u);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
