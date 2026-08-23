import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  generateFabricRoughnessMap,
  generateFabricNormalMap,
} from "./fabricTexture";

/**
 * Helper to safely parse color strings into distinct, accurate hex codes.
 */
const COLOR_NAME_MAP: Record<string, string> = {
  white: "#ffffff",
  black: "#111111",
  "navy blue": "#0f2042",
  navy: "#0f2042",
  "off white": "#efe6d5",
  offwhite: "#efe6d5",
  gray: "#737373",
  grey: "#737373",
  green: "#15803d",
  red: "#dc2626",
};

export function parseToSafeHex(colorInput?: string | null): string {
  if (!colorInput) return "#ffffff";
  const str = String(colorInput).trim();
  if (str.startsWith("#")) {
    const lowerHex = str.toLowerCase();
    // Map existing hex codes to tuned distinct values if needed
    if (lowerHex === "#162238") return "#0f2042"; // Navy Blue
    if (lowerHex === "#f3ebdd") return "#efe6d5"; // Off White
    if (lowerHex === "#121212") return "#111111"; // Black
    return str;
  }
  const lower = str.toLowerCase();
  if (COLOR_NAME_MAP[lower]) return COLOR_NAME_MAP[lower];
  try {
    const c = new THREE.Color(lower);
    return `#${c.getHexString()}`;
  } catch {
    return "#ffffff";
  }
}

export interface TShirtModelMaterials {
  front: THREE.MeshStandardMaterial;
  back: THREE.MeshStandardMaterial;
}

export interface TShirtModelHandle {
  group: THREE.Group;
  materials: TShirtModelMaterials;
  dispose: () => void;
}

export interface TShirtModelOptions {
  baseColor: string;
  size?: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
}

const SIZE_SCALE: Record<NonNullable<TShirtModelOptions["size"]>, number> = {
  XS: 0.88,
  S: 0.94,
  M: 1.0,
  L: 1.06,
  XL: 1.12,
  XXL: 1.18,
  XXXL: 1.24,
};

const loader = new GLTFLoader();

/**
 * Asynchronously loads and configures the photorealistic GLTF T-Shirt model.
 */
export async function loadTShirtModel({
  baseColor,
  size = "L",
}: TShirtModelOptions): Promise<TShirtModelHandle> {
  const hex = parseToSafeHex(baseColor);

  return new Promise((resolve, reject) => {
    loader.load(
      "/models/shirt_baked.glb",
      (gltf) => {
        try {
          const root = gltf.scene;

          // Clone geometry to avoid mutating cached model across renders
          const group = root.clone(true);
          group.scale.setScalar((SIZE_SCALE[size] ?? 1.0) * 2.2);

          // Center model at origin
          const box = new THREE.Box3().setFromObject(group);
          const center = box.getCenter(new THREE.Vector3());
          group.position.sub(center);

          let shirtMesh: THREE.Mesh | null = null;

          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              shirtMesh = child as THREE.Mesh;
              shirtMesh.castShadow = true;
              shirtMesh.receiveShadow = true;
            }
          });

          const roughnessMap = generateFabricRoughnessMap(512);
          const normalMap = generateFabricNormalMap(512);

          // Create high-quality fabric material
          const fabricMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(hex),
            roughness: 0.82,
            metalness: 0.02,
            roughnessMap,
            normalMap,
            normalScale: new THREE.Vector2(0.15, 0.15),
            side: THREE.DoubleSide,
          });

          if (shirtMesh) {
            (shirtMesh as THREE.Mesh).material = fabricMat;
          }

          const handle: TShirtModelHandle = {
            group,
            materials: {
              front: fabricMat,
              back: fabricMat,
            },
            dispose: () => {
              roughnessMap.dispose();
              normalMap.dispose();
              fabricMat.dispose();
              group.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh;
                  mesh.geometry?.dispose();
                }
              });
            },
          };

          resolve(handle);
        } catch (err) {
          reject(err);
        }
      },
      undefined,
      (err) => reject(err),
    );
  });
}

// Backward-compatibility alias
export const buildTShirtModel = loadTShirtModel;
