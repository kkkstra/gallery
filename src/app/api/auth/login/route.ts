import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 500 },
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAuthCookie();
  return NextResponse.json({ ok: true });
}
