const fs = require('fs');
const content = fs.readFileSync('src/components/whatsapp/LegacyInboxComponent.tsx', 'utf-8');

const startStr = "{activeSubTab === 'inbox' && (";
const startIdx = content.indexOf(startStr);
if (startIdx === -1) {
    console.log("Could not find start");
    process.exit(1);
}

// Find the end of this block
let braceCount = 0;
let inString = false;
let stringChar = '';
let endIdx = -1;

for (let i = startIdx; i < content.length; i++) {
    const char = content[i];
    
    if (inString) {
        if (char === stringChar && content[i-1] !== '\\') {
            inString = false;
        }
    } else {
        if (char === '"' || char === "'" || char === '') {
            inString = true;
            stringChar = char;
        } else if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
}

if (endIdx !== -1) {
    fs.writeFileSync('extracted_inbox.jsx', content.substring(startIdx, endIdx + 1));
    console.log("Extracted to extracted_inbox.jsx");
} else {
    console.log("Could not find end");
}
