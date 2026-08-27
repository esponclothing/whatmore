const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/lib/whatsappAI.ts');
let content = fs.readFileSync(file, 'utf-8');

const targetFunction = sync function callAIEngine(messages: any[], model: string, jsonMode = false, maxTokens = 600) {;

let startIdx = content.indexOf(targetFunction);
if (startIdx !== -1) {
    let endIdx = content.indexOf('export async function lookupOrder', startIdx);
    if (endIdx === -1) endIdx = content.length;
    
    let oldFunc = content.substring(startIdx, endIdx);
    
    let newFunc = sync function callAIEngine(messages: any[], modelName: string, jsonMode = false, maxTokens = 600) {
  const settings = await prisma.whatsAppSettings.findFirst();
  const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Please set it in AI Automation settings.");
  
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert OpenAI messages to Gemini format
  let systemInstruction = "";
  const contents: any[] = [];
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction += msg.content + '\\n';
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }
  
  const response = await ai.models.generateContent({
    model: modelName || 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: systemInstruction || undefined,
      temperature: 0.4,
      maxOutputTokens: maxTokens,
      responseMimeType: jsonMode ? 'application/json' : 'text/plain',
    }
  });
  
  if (response.text) {
    return response.text.trim();
  }
  throw new Error('Gemini AI Model failed to return text');
}

;

    content = content.replace(oldFunc, newFunc);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Successfully updated callAIEngine to use Gemini');
} else {
    console.log('Could not find callAIEngine');
}
