const fs = require('fs');
const path = require('path');

// Fix page.tsx
const pageFile = path.join(__dirname, 'src/app/(dashboard)/whatsapp/api-settings/page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf-8');
pageContent = pageContent.replace(/Ã¢€”Â /g, '');
pageContent = pageContent.replace(
  /<span className=\{\px-3 py-2 text-xs font-bold rounded-lg \$\{isConnected \? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'\}\\}>\s*\{isConnected \? "CONNECTED" : "NOT CONNECTED"\}\s*<\/span>/,
  "<span className={px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1 }>{isConnected ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}</span>"
);
fs.writeFileSync(pageFile, pageContent, 'utf-8');

// Fix whatsAppPlatformActions.ts
const actionFile = path.join(__dirname, 'src/app/actions/whatsAppPlatformActions.ts');
let actionContent = fs.readFileSync(actionFile, 'utf-8');
actionContent = actionContent.replace(/name: "hello_world"/g, 'name: "espon_test_message"');
fs.writeFileSync(actionFile, actionContent, 'utf-8');

console.log('Fixed both files');
