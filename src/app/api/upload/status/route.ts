import { NextResponse } from "next/server";
import { isOSSConfigured } from "@/lib/oss";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: isOSSConfigured() });
}
