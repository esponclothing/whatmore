import { NextRequest, NextResponse } from "next/server";

const OWNER_SECRET = process.env.OWNER_PORTAL_SECRET || "whatmore-owner-2026";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== OWNER_SECRET) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("owner_token", OWNER_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/owner"
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("owner_token");
  return res;
}
