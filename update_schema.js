const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'prisma/schema.prisma');
let content = fs.readFileSync(file, 'utf-8');

// Add geminiApiKey
content = content.replace('aiFallbackLanguage   String   @default("English")', 'aiFallbackLanguage   String   @default("English")\n  geminiApiKey         String?');

// Add WhatsAppWebhookLog model at the end
const webhookModel = \n
// ---------------------------------------------------------
// WhatsApp Webhook Raw Logs
// ---------------------------------------------------------
model WhatsAppWebhookLog {
  id           String   @id @default(uuid())
  event        String
  status       String   @default("RECEIVED") // RECEIVED, IGNORED, ERROR, PROCESSED
  payload      Json?
  errorMessage String?
  createdAt    DateTime @default(now())
}
;

if (!content.includes('model WhatsAppWebhookLog')) {
    content += webhookModel;
}

fs.writeFileSync(file, content, 'utf-8');
console.log('Schema updated successfully');
