import LandingPageClient from "@/components/landing/LandingPageClient";
import { BRAND_WHATMORE } from "@/lib/brandConfig";

export const metadata = {
  title: "WhatMore - AI-Powered WhatsApp Commerce & Autonomous Sales Engine",
  description: "Turn WhatsApp into your highest-converting sales pipeline. Automate orders, native Meta catalog checkouts, Indian pincode & address auto-fetching, AI auto-pilot support, and multi-agent inboxes in one unified cloud platform.",
};

export default function HomePage() {
  return <LandingPageClient brandOverride={BRAND_WHATMORE} />;
}
