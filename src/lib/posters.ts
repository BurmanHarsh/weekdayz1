import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export interface WebsitePoster {
  id: string;
  img: string;
  kicker: string;
  title: string;
  sub: string;
  badge?: string;
  to: string;
  cta: string;
  is_active: boolean;
}

export const DEFAULT_POSTERS: WebsitePoster[] = [
  {
    id: "poster-rcb-26",
    img: hero1,
    kicker: "JUST DROPPED · LIMITED STOCK",
    title: "RCB EDITION '26",
    sub: "Cheer in style with the official oversized fit.",
    badge: "FLAT 20% OFF",
    to: "/collections/rcb",
    cta: "GRAB YOURS",
    is_active: true,
  },
  {
    id: "poster-oversized-ss26",
    img: hero2,
    kicker: "BESTSELLER · SS26",
    title: "THE OVERSIZED EDIT",
    sub: "Premium heavyweight cotton. Minimal branding. Maximum comfort.",
    badge: "BUY 2 GET 10% OFF",
    to: "/shop",
    cta: "SHOP THE LOOK",
    is_active: true,
  },
  {
    id: "poster-f1-pitlane",
    img: hero3,
    kicker: "PREMIUM CAPSULE",
    title: "F1 PIT-LANE",
    sub: "Carbon detailing. Race-day ready. The ultimate speed aesthetic.",
    badge: "NEW ARRIVAL",
    to: "/collections/f1",
    cta: "EXPLORE NOW",
    is_active: true,
  },
];

const STORAGE_KEY = "weekdayz_website_posters_v2";

export function fetchWebsitePosters(): WebsitePoster[] {
  if (typeof window === "undefined") return DEFAULT_POSTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSTERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.error("Failed to parse website posters from storage", e);
  }
  return DEFAULT_POSTERS;
}

export function saveWebsitePosters(posters: WebsitePoster[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event("website-posters-updated"));
  } catch (e: any) {
    // localStorage quota (typically ~5MB) gets blown out by base64 DataURLs
    // when Supabase storage rejects unauthenticated uploads. Drop non-critical
    // fields on older entries so the new poster still saves.
    const isQuota =
      e?.name === "QuotaExceededError" ||
      e?.code === 22 ||
      e?.code === 1014 ||
      /quota/i.test(String(e?.message ?? ""));
    if (isQuota) {
      console.warn("Posters storage quota exceeded — trimming prior entries");
      const trimmed = posters.map((p, i) =>
        i === posters.length - 1
          ? p
          : { ...p, img: typeof p.img === "string" && p.img.startsWith("data:") ? "" : p.img },
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        window.dispatchEvent(new Event("website-posters-updated"));
        return;
      } catch {
        // give up silently — caller surfaces toast already
      }
    }
    console.error("Failed to save website posters to storage", e);
  }
}
