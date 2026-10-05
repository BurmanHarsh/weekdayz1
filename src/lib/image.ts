/**
 * Image URL utility — serves correctly-sized images to reduce egress.
 *
 * Two storage backends are supported:
 *
 * 1. Cloudflare R2 (preferred, zero egress fees)
 *    URLs like: https://images.weekdayzz.in/products/abc.webp
 *    → Served as-is. Images are pre-compressed to ≤1400px WebP at upload time
 *      (see MultiImageUploader compression step).
 *
 * 2. Supabase Storage (legacy / fallback)
 *    URLs like: https://*.supabase.co/storage/v1/object/public/...
 *    → Transformed via Supabase's /render/image/ endpoint (Pro plan feature).
 *      On Free plan these transform URLs simply redirect to the original.
 */

const SUPABASE_STORAGE_MARKER = "/storage/v1/object/";

export type ImageSize = "thumb" | "card" | "detail" | "full";

/** Width in pixels for each logical size bucket (used only for legacy Supabase URLs) */
const WIDTH_MAP: Record<ImageSize, number> = {
  thumb: 160,   // Nav cart thumbnails, order history micro-images
  card: 480,    // Product grid cards
  detail: 900,  // Product detail page main image
  full: 1600,   // Lightbox / zoomed view
};

/**
 * Returns a correctly-sized image URL.
 * - R2 or CDN URLs  → returned as-is (already WebP-compressed at upload)
 * - Supabase URLs   → transformed via /render/image/ (Pro plan only)
 * - Local paths     → returned as-is
 */
export function imgUrl(url: string | null | undefined, _size: ImageSize): string {
  if (!url) return "/products/tee-black.jpg";

  // R2 or any non-Supabase CDN URL — already optimised, pass through unchanged
  if (!url.includes(SUPABASE_STORAGE_MARKER)) return url;

  // Supabase Storage URL — apply render transform (requires Supabase Pro plan)
  const width = WIDTH_MAP[_size];

  try {
    const u = new URL(url);
    // Swap /object/public/ → /render/image/public/
    const transformed = url.replace(
      `${SUPABASE_STORAGE_MARKER}public/`,
      `${SUPABASE_STORAGE_MARKER.replace("object", "render/image")}public/`
    );
    const tu = new URL(transformed);
    tu.searchParams.set("width", String(width));
    tu.searchParams.set("quality", "80");
    tu.searchParams.set("format", "webp");
    // Preserve existing params (e.g. download tokens)
    u.searchParams.forEach((v, k) => {
      if (k !== "width" && k !== "quality" && k !== "format") {
        tu.searchParams.set(k, v);
      }
    });
    return tu.toString();
  } catch {
    return url;
  }
}
