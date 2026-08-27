const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/whatsapp/webhook/route.ts');
let content = fs.readFileSync(file, 'utf-8');

const targetStr = 'const body = await req.json();';
const newStr = targetStr + '\n\n    // Log Webhook Payload\n    try {\n      await prisma.whatsAppWebhookLog.create({\n        data: {\n          event: "WEBHOOK_RECEIVED",\n          payload: body\n        }\n      });\n    } catch (e) { console.error("Failed to log webhook", e); }';

if (content.includes(targetStr) && !content.includes('whatsAppWebhookLog.create')) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Added webhook logging');
} else {
    console.log('Could not add webhook logging or already added');
}
