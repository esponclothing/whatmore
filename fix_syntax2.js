const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/whatsapp/webhook/route.ts');
let content = fs.readFileSync(file, 'utf-8');

// Match from /* if (metadata down to the closing } of that block
const regex = /\/\* if \(metadata[\s\S]*?status: "ignored - different phone number" \}\);\s*\}/;
if (regex.test(content)) {
    content = content.replace(regex, '// Phone filter removed');
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed syntax error via regex!');
} else {
    console.log('Regex did not match!');
}
