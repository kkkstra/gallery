import OSS from "ali-oss";
import { randomUUID } from "crypto";

function getClient() {
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error(
      "Missing required OSS env vars: ALIYUN_OSS_REGION, ALIYUN_OSS_BUCKET, ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET",
    );
  }

  return new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
  });
}

function getPublicBaseUrl() {
  const custom = process.env.ALIYUN_OSS_CUSTOM_DOMAIN;
  if (custom) return `https://${custom}`;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const region = process.env.ALIYUN_OSS_REGION;
  return `https://${bucket}.${region}.aliyuncs.com`;
}

function buildObjectKey(filename: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `photos/${yyyy}/${mm}/${randomUUID()}-${safe}`;
}

export function getPresignedPut(filename: string, contentType: string) {
  const client = getClient();
  const key = buildObjectKey(filename);

  const signedUrl = client.signatureUrl(key, {
    method: "PUT",
    expires: 300,
    "Content-Type": contentType,
  });

  const publicUrl = `${getPublicBaseUrl()}/${key}`;
  const thumbnailUrl = `${publicUrl}?x-oss-process=image/resize,w_800/quality,q_85`;

  return { signedUrl, publicUrl, thumbnailUrl, key };
}

export function isOSSConfigured(): boolean {
  return !!(
    process.env.ALIYUN_OSS_REGION &&
    process.env.ALIYUN_OSS_BUCKET &&
    process.env.ALIYUN_OSS_ACCESS_KEY_ID &&
    process.env.ALIYUN_OSS_ACCESS_KEY_SECRET
  );
}
