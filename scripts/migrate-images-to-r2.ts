/**
 * Migration script: Supabase Storage → Cloudflare R2
 *
 * Run with:
 *   npx tsx scripts/migrate-images-to-r2.ts
 *
 * What it does:
 * 1. Lists all objects in the Supabase "product-images" bucket
 * 2. Downloads each image file (skips .json config files)
 * 3. Uploads to R2 under the same key path
 * 4. Updates all `image_urls` in the `products` DB table
 * 5. Optionally rewrites custom_products.json with new R2 URLs
 *
 * Prerequisites:
 *   - Fill in all env vars below (or in .env)
 *   - npm install @aws-sdk/client-s3 (already done)
 */

import "dotenv/config";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import https from "https";
import http from "http";

// ─── Config (reads from .env) ─────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_BUCKET = "product-images";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

// ─── Validate config ──────────────────────────────────────────────────────────

const missing = [
  !SUPABASE_URL && "SUPABASE_URL",
  !SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  !R2_ACCOUNT_ID && "R2_ACCOUNT_ID",
  !R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
  !R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
  !R2_BUCKET_NAME && "R2_BUCKET_NAME",
  !R2_PUBLIC_URL && "R2_PUBLIC_URL",
].filter(Boolean);

if (missing.length > 0) {
  console.error("❌ Missing env vars:", missing.join(", "));
  console.error("   Fill them in .env and re-run.");
  process.exit(1);
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fetchBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers["content-type"] ?? "application/octet-stream",
        })
      );
      res.on("error", reject);
    }).on("error", reject);
  });
}

function supabasePublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function r2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

// ─── Step 1: List all objects in the Supabase bucket ─────────────────────────

async function listAllSupabaseObjects(prefix = ""): Promise<string[]> {
  const keys: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error) throw new Error(`Supabase list error: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (item.metadata) {
        // It's a file
        keys.push(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        // It's a folder — recurse
        const subKeys = await listAllSupabaseObjects(prefix ? `${prefix}/${item.name}` : item.name);
        keys.push(...subKeys);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return keys;
}

// ─── Step 2: Migrate images to R2 ────────────────────────────────────────────

async function migrateImages(keys: string[]): Promise<Map<string, string>> {
  // Maps old Supabase URL → new R2 URL
  const urlMap = new Map<string, string>();

  const imageKeys = keys.filter((k) => {
    const lower = k.toLowerCase();
    // Skip JSON config files — those stay on Supabase (tiny, low traffic)
    return !lower.endsWith(".json") && !lower.endsWith(".txt");
  });

  console.log(`\n📦 Migrating ${imageKeys.length} image files to R2...`);

  for (let i = 0; i < imageKeys.length; i++) {
    const key = imageKeys[i];
    const oldUrl = supabasePublicUrl(SUPABASE_BUCKET, key);
    const newUrl = r2PublicUrl(key);

    process.stdout.write(`  [${i + 1}/${imageKeys.length}] ${key} ... `);

    try {
      const { buffer, contentType } = await fetchBuffer(oldUrl);

      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      urlMap.set(oldUrl, newUrl);
      console.log(`✅ ${(buffer.length / 1024).toFixed(0)} KB`);
    } catch (e: any) {
      console.log(`❌ FAILED: ${e?.message}`);
    }
  }

  return urlMap;
}

// ─── Step 3: Update product image_urls in the database ───────────────────────

async function updateProductUrls(urlMap: Map<string, string>): Promise<void> {
  console.log("\n🗄️  Updating product image_urls in database...");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, image_urls");

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  if (!products?.length) {
    console.log("  No products found in DB.");
    return;
  }

  let updated = 0;
  for (const product of products) {
    const oldUrls: string[] = product.image_urls ?? [];
    const newUrls = oldUrls.map((u: string) => urlMap.get(u) ?? u);

    if (JSON.stringify(oldUrls) === JSON.stringify(newUrls)) continue;

    const { error: upErr } = await supabase
      .from("products")
      .update({ image_urls: newUrls })
      .eq("id", product.id);

    if (upErr) {
      console.log(`  ❌ Failed to update product ${product.id}: ${upErr.message}`);
    } else {
      console.log(`  ✅ Updated product ${product.id}`);
      updated++;
    }
  }

  console.log(`  ${updated} product(s) updated.`);
}

// ─── Step 4: Rewrite custom_products.json with new R2 URLs ───────────────────

async function rewriteCustomProductsJson(urlMap: Map<string, string>): Promise<void> {
  console.log("\n📝 Rewriting custom_products.json with R2 URLs...");

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download("custom_products.json");

    if (error || !data) {
      console.log("  Skipped (file not found or error):", error?.message);
      return;
    }

    const text = await data.text();
    let rewritten = text;

    urlMap.forEach((newUrl, oldUrl) => {
      // Simple global string replace — safe because URLs are unique
      rewritten = rewritten.split(oldUrl).join(newUrl);
    });

    const buffer = Buffer.from(rewritten, "utf-8");

    const { error: upErr } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload("custom_products.json", buffer, { upsert: true, contentType: "application/json" });

    if (upErr) {
      console.log("  ❌ Failed to rewrite:", upErr.message);
    } else {
      console.log("  ✅ custom_products.json updated with R2 URLs.");
    }
  } catch (e: any) {
    console.log("  ❌ Exception:", e?.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting Supabase → Cloudflare R2 image migration");
  console.log(`   Supabase bucket : ${SUPABASE_BUCKET}`);
  console.log(`   R2 bucket       : ${R2_BUCKET_NAME}`);
  console.log(`   R2 public URL   : ${R2_PUBLIC_URL}`);
  console.log("");

  console.log("📋 Listing all objects in Supabase storage...");
  const keys = await listAllSupabaseObjects();
  console.log(`   Found ${keys.length} objects total`);
  console.log("   Files:", keys.slice(0, 10).join(", "), keys.length > 10 ? `... +${keys.length - 10} more` : "");

  const urlMap = await migrateImages(keys);

  if (urlMap.size === 0) {
    console.log("\n⚠️  No images were migrated. Check errors above.");
    return;
  }

  await updateProductUrls(urlMap);
  await rewriteCustomProductsJson(urlMap);

  console.log("\n✅ Migration complete!");
  console.log(`   ${urlMap.size} image(s) moved to R2.`);
  console.log("\nNext steps:");
  console.log("  1. Add R2 env vars to your Cloudflare Workers deployment");
  console.log("  2. Update src/lib/image.ts (already updated below — remove the Supabase render transform)");
  console.log("  3. Re-enable the Razorpay webhook in the dashboard");
  console.log("  4. Optionally: delete images from Supabase Storage to free space");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
