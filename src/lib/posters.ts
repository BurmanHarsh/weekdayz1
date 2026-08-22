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
  } catch (e) {
    console.error("Failed to save website posters to storage", e);
  }
}
