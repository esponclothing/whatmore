const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'src/app/(dashboard)/whatsapp/api-settings/page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf-8');

const endStr = '</span>';

let startIdx = pageContent.indexOf('<span className={`px-3 py-2 text-xs font-bold rounded-lg ${isConnected');
if (startIdx !== -1) {
    let endIdx = pageContent.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        let replacement = '<span className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1 ${isConnected ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{isConnected ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {isConnected ? "CONNECTED" : "NOT CONNECTED"}</span>';
        pageContent = pageContent.substring(0, startIdx) + replacement + pageContent.substring(endIdx + endStr.length);
        fs.writeFileSync(pageFile, pageContent, 'utf-8');
        console.log('Replaced span block perfectly');
    }
}
