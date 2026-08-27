const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(dashboard)/whatsapp/api-settings/page.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Fix hydration error
content = content.replace(
  /\{typeof window !== "undefined" \? \$\{window\.location\.origin\}\/api\/whatsapp\/webhook : "https:\/\/your-domain\.com\/api\/whatsapp\/webhook"\}/g,
  "{origin ? ${origin}/api/whatsapp/webhook : 'https://your-domain.com/api/whatsapp/webhook'}"
);

// Add origin state
if (!content.includes('const [origin, setOrigin] = useState("")')) {
  content = content.replace(
    'const [isConnected, setIsConnected] = useState(false);',
    'const [isConnected, setIsConnected] = useState(false);\n  const [origin, setOrigin] = useState("");\n  useEffect(() => {\n    setOrigin(window.location.origin);\n  }, []);'
  );
}

// Fix garbled text
content = content.replace(/Ã¢â‚¬Å/g, '');
content = content.replace(/â— /g, '');
content = content.replace(/Ã¢/g, ''); // just in case

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed');
