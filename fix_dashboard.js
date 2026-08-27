const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(dashboard)/whatsapp/dashboard/page.tsx');
let content = fs.readFileSync(file, 'utf-8');

content = content.replace('?2,45,900', '?0');
content = content.replace('1,204', '0');
content = content.replace('4,892', '{data?.metrics?.totalMessages || 0}');

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed hardcoded data');
