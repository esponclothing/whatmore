const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/api/whatsapp/webhook/route.ts');
let content = fs.readFileSync(file, 'utf-8');

// The exact string in the file right now
const badStr = '      /* if (metadata && metadata.display_phone_number !== \\'917404388242\\') {\n' +
' *         console.log([WhatsApp Webhook] Ignored message for other number:  */);\n' +
'        return NextResponse.json({ status: "ignored - different phone number" });\n' +
'      }';

const replacement = '      // Phone filter removed';

if (content.includes(badStr)) {
    content = content.replace(badStr, replacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed syntax error!');
} else {
    console.log('Bad string not found');
}
