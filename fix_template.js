const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/actions/whatsAppPlatformActions.ts');
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  "if (resData.error && resData.error.message.includes('template')) {",
  "if (resData.error && (resData.error.code === 132001 || resData.error.code === 132000 || resData.error.message.toLowerCase().includes('template'))) {"
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed template catch');
