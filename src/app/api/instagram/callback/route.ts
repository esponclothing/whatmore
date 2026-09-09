import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const origin = req.nextUrl.origin || "https://whatsapp.esponsports.com";

  if (error || !code) {
    console.warn("[Instagram OAuth Callback] Error or cancelled:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/whatsapp/integrations?tab=instagram&oauth_error=${encodeURIComponent(errorDescription || error || "cancelled")}`, origin)
    );
  }

  try {
    console.log("[Instagram OAuth Callback] Received authorization code from Meta.");
    // Redirect back to Whatmore Instagram integrations tab
    return NextResponse.redirect(
      new URL(`/whatsapp/integrations?tab=instagram&oauth_status=success`, origin)
    );
  } catch (e: any) {
    console.error("[Instagram OAuth Callback] Error:", e);
    return NextResponse.redirect(
      new URL(`/whatsapp/integrations?tab=instagram&oauth_error=${encodeURIComponent(e.message)}`, origin)
    );
  }
}
