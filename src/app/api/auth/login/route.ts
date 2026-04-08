import { NextRequest, NextResponse } from "next/server";
import { signToken, setAuthCookie } from "@/lib/auth";

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

  const token = await signToken();
  const response = NextResponse.json({ ok: true });
  setAuthCookie(response, token);
  return response;
}
