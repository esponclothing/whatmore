const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/actions/whatsAppPlatformActions.ts');
let content = fs.readFileSync(file, 'utf-8');

const targetMethod = export async function getWhatsAppWebhookLogsAction(search = '') {;
let startIdx = content.indexOf(targetMethod);
if (startIdx !== -1) {
    let endIdx = content.indexOf('export async function', startIdx + 10);
    if (endIdx === -1) endIdx = content.length;
    
    let oldMethod = content.substring(startIdx, endIdx);
    
    let newMethod = export async function getWhatsAppWebhookLogsAction(search = '') {
  try {
    const incomingWhere: any = { senderType: 'CUSTOMER' };
    const payloadWhere: any = {};
    if (search) {
      incomingWhere.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { metaMessageId: { contains: search, mode: 'insensitive' } }
      ];
    }
    const [events, payloadDumps, totalReceived, totalRead] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: incomingWhere,
        include: { conversation: { include: { customer: { select: { contactPerson: true, mobile: true, businessName: true } } } } },
        orderBy: { sentAt: 'desc' },
        take: 100
      }),
      prisma.whatsAppWebhookLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.whatsAppMessage.count({ where: { senderType: 'CUSTOMER' } }),
      prisma.whatsAppMessage.count({ where: { senderType: 'CUSTOMER', status: 'READ' } }),
    ]);
    return {
      success: true,
      events,
      payloadDumps,
      stats: {
        totalReceived,
        totalRead,
        totalText: events.filter((e: any) => e.messageType === 'TEXT').length,
        totalMedia: events.filter((e: any) => e.messageType !== 'TEXT').length
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
\n;

    content = content.replace(oldMethod, newMethod);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Successfully updated getWhatsAppWebhookLogsAction');
} else {
    console.log('Could not find getWhatsAppWebhookLogsAction');
}
