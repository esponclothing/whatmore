import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.whatsAppCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      queues: true
    }
  });

  console.log("Found campaigns:", campaigns.length);
  for (const c of campaigns) {
    console.log(`\nCampaign: ${c.name} (ID: ${c.id})`);
    console.log(`Audience: ${c.totalAudience}, Sent: ${c.sentCount}, Delivered: ${c.deliveredCount}, Read: ${c.readCount}, Clicks: ${c.clicksCount}, Status: ${c.status}`);
    console.log(`Queues count: ${c.queues.length}`);
    const statusCounts: Record<string, number> = {};
    for (const q of c.queues) {
      statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
    }
    console.log("Queue statuses:", statusCounts);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
