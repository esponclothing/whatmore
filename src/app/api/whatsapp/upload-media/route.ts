import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { fileDataUrl, filename, mimeType } = await req.json();
    if (!fileDataUrl) {
      return NextResponse.json({ success: false, error: "fileDataUrl is required" }, { status: 400 });
    }

    const account = await prisma.whatsAppAccount.findFirst();
    const token = account?.accessToken;
    const phoneId = account?.phoneId;
    if (!token || !phoneId) {
      return NextResponse.json({ success: false, error: "Missing WhatsApp credentials" }, { status: 400 });
    }

    const base64Data = fileDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');

    const url = `https://graph.facebook.com/v20.0/${phoneId}/media`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const resData = await response.json();
    if (resData.id) {
      return NextResponse.json({ success: true, mediaId: resData.id });
    } else {
      return NextResponse.json({ success: false, error: resData.error?.message || "Upload failed" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
