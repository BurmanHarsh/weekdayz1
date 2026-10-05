/**
 * Cloudflare R2 storage client.
 *
 * R2 is S3-compatible, so we use @aws-sdk/client-s3.
 * Zero egress fees — images are served from the public R2 URL or a
 * Cloudflare custom domain (weekdayzz.in/cdn/...).
 *
 * Required env vars (add to .env AND Cloudflare Workers env):
 *   R2_ACCOUNT_ID        – Cloudflare account ID (found in dashboard sidebar)
 *   R2_ACCESS_KEY_ID     – R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY – R2 API token Secret Access Key
 *   R2_BUCKET_NAME       – e.g. "weekdayzz-images"
 *   R2_PUBLIC_URL        – Public base URL, e.g. "https://images.weekdayzz.in"
 *                          OR the default R2 dev URL for now:
 *                          "https://pub-<hash>.r2.dev"
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let _r2Client: S3Client | null | undefined; // undefined = not yet checked

function getR2Client(): S3Client | null {
  if (_r2Client !== undefined) return _r2Client;
  const cfg = getR2Config();
  if (!cfg) {
    _r2Client = null;
    return null;
  }
  _r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return _r2Client;
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

/**
 * Upload a file Buffer to R2 and return its public URL.
 *
 * @param key         Object key, e.g. "products/abc123.jpg"
 * @param body        File content as Buffer or Uint8Array
 * @param contentType MIME type, e.g. "image/jpeg"
 * @returns           Public URL string
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const cfg = getR2Config();

  if (!client || !cfg) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL.");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // R2 public buckets serve without ACL needed, but setting public-read is harmless
      ACL: "public-read",
    })
  );

  return `${cfg.publicUrl.replace(/\/$/, "")}/${key}`;
}

/**
 * Delete an object from R2 by key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const cfg = getR2Config();
  if (!client || !cfg) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      })
    );
  } catch (e) {
    console.warn("[deleteFromR2] Failed to delete:", key, e);
  }
}

/**
 * Given a full R2 public URL, extract the object key.
 * e.g. "https://images.weekdayzz.in/products/abc.jpg" → "products/abc.jpg"
 */
export function r2UrlToKey(url: string): string | null {
  const cfg = getR2Config();
  if (!cfg) return null;
  const base = cfg.publicUrl.replace(/\/$/, "");
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1); // strip leading slash
}

/**
 * Returns true if this URL is already hosted on R2.
 */
export function isR2Url(url: string): boolean {
  const cfg = getR2Config();
  if (!cfg) return false;
  return url.startsWith(cfg.publicUrl.replace(/\/$/, ""));
}
