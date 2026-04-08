import { createHmac, randomUUID } from "crypto";

function getConfig() {
  const region = process.env.ALIYUN_OSS_REGION;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error(
      "Missing required OSS env vars: ALIYUN_OSS_REGION, ALIYUN_OSS_BUCKET, ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET",
    );
  }

  return { region, bucket, accessKeyId, accessKeySecret };
}

function getPublicBaseUrl() {
  const custom = process.env.ALIYUN_OSS_CUSTOM_DOMAIN;
  if (custom) return `https://${custom}`;
  const { bucket, region } = getConfig();
  return `https://${bucket}.${region}.aliyuncs.com`;
}

function buildObjectKey(filename: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `photos/${yyyy}/${mm}/${randomUUID()}-${safe}`;
}

/**
 * Generate an OSS V1 presigned PUT URL using HMAC-SHA1.
 * No external SDK needed — only Node.js built-in crypto.
 */
function signV1Put(key: string, contentType: string, expireSeconds: number) {
  const { bucket, region, accessKeyId, accessKeySecret } = getConfig();
  const expires = Math.floor(Date.now() / 1000) + expireSeconds;

  // Content-Type MUST match exactly what the client sends in the request header.
  // Format: VERB \n Content-MD5 \n Content-Type \n Expires \n CanonicalizedResource
  const stringToSign = `PUT\n\n${contentType}\n${expires}\n/${bucket}/${key}`;
  const signature = createHmac("sha1", accessKeySecret)
    .update(stringToSign)
    .digest("base64");

  const host = `https://${bucket}.${region}.aliyuncs.com`;
  const params = new URLSearchParams({
    OSSAccessKeyId: accessKeyId,
    Expires: String(expires),
    Signature: signature,
  });

  return `${host}/${encodeURI(key)}?${params.toString()}`;
}

export function getPresignedPut(filename: string, contentType: string) {
  const key = buildObjectKey(filename);
  const signedUrl = signV1Put(key, contentType, 300);
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
