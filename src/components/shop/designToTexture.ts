import * as THREE from "three";
import { parseToSafeHex } from "./TShirt3DModel";

/**
 * Renders the customer's DesignLayer[] onto an offscreen canvas for the 3D shirt model.
 *
 * Fills the texture canvas with the customer's selected garment color (White, Black,
 * Navy, Off White, etc.), then projects uploaded graphics and text onto the exact
 * 3D UV positions on the front chest and back.
 *
 * Exact UV Alignment for shirt_baked.glb:
 *   - Front Chest UV: U = 0.2633, V = 0.3660 (canvas left region)
 *   - Back Center UV: U = 0.7487, V = 0.2918 (canvas right region)
 *   - tex.flipY = false ensures right-side-up rendering
 */

export interface TextureLayer {
  id: string;
  type: "image" | "text";
  side: "Front" | "Back" | "Sleeve" | "Left Sleeve" | "Right Sleeve";
  previewUrl?: string;
  text?: string;
  fontFamily?: string;
  fillColor?: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface RenderDesignToTextureOptions {
  layers: TextureLayer[];
  side?: "Front" | "Back" | "Sleeve" | "Left Sleeve" | "Right Sleeve";
  baseColor: string;
  resolution?: number;
}

const loadedImageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = loadedImageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Builds a CanvasTexture representing the complete t-shirt texture (base color + custom designs).
 */
export async function renderDesignToTexture({
  layers,
  baseColor,
  resolution = 2048,
}: RenderDesignToTextureOptions): Promise<THREE.CanvasTexture | null> {
  const hex = parseToSafeHex(baseColor);

  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fill entire texture canvas with customer's selected base color
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, resolution, resolution);

  // Front Chest Center on shirt_baked.glb (U = 0.2633, V = 0.3660)
  const frontCx = resolution * 0.2633;
  const frontCy = resolution * 0.3660;

  // Back Center on shirt_baked.glb (U = 0.7487, V = 0.2918)
  const backCx = resolution * 0.7487;
  const backCy = resolution * 0.2918;

  // Left Sleeve Outer Cap UV Center (U = 0.1971, V = 0.8306)
  const leftSleeveCx = resolution * 0.1971;
  const leftSleeveCy = resolution * 0.8306;

  // Right Sleeve Outer Cap UV Center (U = 0.5669, V = 0.8306)
  const rightSleeveCx = resolution * 0.5669;
  const rightSleeveCy = resolution * 0.8306;

  // Draw user design graphics & text layers on top
  if (layers && layers.length > 0) {
    for (const layer of layers) {
      ctx.save();

      let cx = frontCx;
      let cy = frontCy;

      if (layer.side === "Back") {
        cx = backCx;
        cy = backCy;
      } else if (layer.side === "Right Sleeve") {
        cx = rightSleeveCx;
        cy = rightSleeveCy;
      } else if (layer.side === "Left Sleeve" || layer.side === "Sleeve") {
        cx = leftSleeveCx;
        cy = leftSleeveCy;
      }

      // Map 2D designer offset (around 400x400) to 3D UV space
      const scaleFactor = (resolution / 800) * 1.3;
      const layerX = cx + layer.x * scaleFactor;
      const layerY = cy + layer.y * scaleFactor;

      ctx.translate(layerX, layerY);
      ctx.rotate((layer.rotate * Math.PI) / 180);

      if (layer.type === "image" && layer.previewUrl) {
        try {
          const img = await loadImage(layer.previewUrl);
          const baseSize = (resolution / 4.5) * layer.scale;
          ctx.drawImage(img, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
        } catch {
          // skip broken image
        }
      } else if (layer.type === "text" && layer.text) {
        const fontSize = Math.round((resolution / 26) * layer.scale);
        ctx.font = `bold ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
        ctx.fillStyle = layer.fillColor || "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.text, 0, 0);
      }
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}
