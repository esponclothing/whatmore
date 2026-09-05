import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.whatsAppSettings.findFirst();
    const key = settings?.geminiApiKey;
    if (!key) {
      return NextResponse.json({ success: false, error: 'Gemini API Key not set in database' });
    }

    // Candidate model names to test
    const models = [
      'gemini-2.0-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-2.0-flash-exp'
    ];

    const results: any[] = [];
    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          })
        });
        const data = await res.json();
        if (res.ok && data.candidates) {
          results.push({ model: m, working: true });
        } else {
          results.push({ model: m, working: false, error: data.error?.message || 'invalid response' });
        }
      } catch (e: any) {
        results.push({ model: m, working: false, error: e.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      keySaved: true, 
      keyPrefix: key.slice(0, 8) + '...' + key.slice(-4),
      keyLength: key.length,
      results 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
