const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/api/whatsapp/webhook/route.ts');
let content = fs.readFileSync(file, 'utf-8');

const targetStr = "if (metadata && metadata.display_phone_number !== '917404388242') {";

let startIdx = content.indexOf(targetStr);
if (startIdx !== -1) {
    let endIdx = content.indexOf('}', startIdx);
    if (endIdx !== -1) {
        let block = content.substring(startIdx, endIdx + 1);
        content = content.replace(block, '/* ' + block.replace(/\n/g, '\n * ') + ' */');
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Successfully commented out hardcoded phone check.');
    }
} else {
    console.log('Target string not found!');
}
