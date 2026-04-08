import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import { getPresignedPut, isOSSConfigured } from "@/lib/oss";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOSSConfigured()) {
    return NextResponse.json(
      { error: "OSS is not configured. Set ALIYUN_OSS_* environment variables." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { filename, contentType } = body as {
    filename: string;
    contentType: string;
  };

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }

  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 },
    );
  }

  try {
    const result = getPresignedPut(filename, contentType);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate presigned URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
