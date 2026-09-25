import { PrismaClient } from "@prisma/client";
import { ALL_MODULE_KEYS } from "../src/lib/moduleRegistry";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.whatsAppClient.findMany();
  for (const c of clients) {
    if (c.enabledModules) {
      try {
        const parsed = JSON.parse(c.enabledModules);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(k => ALL_MODULE_KEYS.includes(k as any));
          await prisma.whatsAppClient.update({
            where: { id: c.id },
            data: { enabledModules: JSON.stringify(cleaned.length > 0 ? cleaned : ALL_MODULE_KEYS) }
          });
          console.log(`Cleaned client: ${c.businessName} (${c.id}) ->`, cleaned);
        }
      } catch (err) {
        console.error(`Error on client ${c.id}:`, err);
      }
    }
  }
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); });
