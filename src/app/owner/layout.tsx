import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const OWNER_SECRET = process.env.OWNER_PORTAL_SECRET || "whatmore-owner-2026";

export const metadata = {
  title: "Whatmore Owner Console",
  description: "Super Admin portal for managing SaaS clients"
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("owner_token")?.value;
  const pathname = ""; // layout doesn't have access to pathname
  // Skip auth check for login page (handled by login page itself)
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif", background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
