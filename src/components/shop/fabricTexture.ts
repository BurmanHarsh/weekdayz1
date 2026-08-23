import * as THREE from "three";

/**
 * Procedural fabric texture utilities for the 3D T-shirt preview.
 *
 * Generates roughness maps, normal maps, and studio backgrounds entirely
 * at runtime — no external assets needed.
 */

// ── Fabric Roughness Map ─────────────────────────────────────────────
/**
 * Generates a canvas texture that simulates woven cotton fabric roughness.
 * Fine crosshatch pattern with subtle variation gives the material a cloth feel.
 */
export function generateFabricRoughnessMap(resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d")!;

  // Base mid-gray roughness
  ctx.fillStyle = "#b8b8b8";
  ctx.fillRect(0, 0, resolution, resolution);

  // Horizontal weave lines
  ctx.strokeStyle = "rgba(180, 180, 180, 0.4)";
  ctx.lineWidth = 1;
  const spacing = Math.max(2, resolution / 128);
  for (let y = 0; y < resolution; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(resolution, y);
    ctx.stroke();
  }

  // Vertical weave lines (slightly offset for crosshatch)
  ctx.strokeStyle = "rgba(160, 160, 160, 0.3)";
  for (let x = 0; x < resolution; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, resolution);
    ctx.stroke();
  }

  // Add subtle noise for micro-roughness variation
  const imageData = ctx.getImageData(0, 0, resolution, resolution);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

// ── Fabric Normal Map ────────────────────────────────────────────────
/**
 * Generates a subtle normal map that gives the shirt surface a fabric
 * micro-detail bump. Uses a Sobel-like approach on a noise pattern to
 * create believable surface perturbation in tangent-space.
 *
 * Normal map convention: (R, G, B) → (X+right, Y+up, Z+out)
 * Flat = (128, 128, 255) i.e. pointing straight out.
 */
export function generateFabricNormalMap(resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d")!;

  // Generate a height field from fabric-like pattern
  const heightField = new Float32Array(resolution * resolution);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      // Combine horizontal + vertical weave with noise
      const weaveH = Math.sin((y / resolution) * Math.PI * 64) * 0.3;
      const weaveV = Math.sin((x / resolution) * Math.PI * 64) * 0.2;
      const noise = (Math.random() - 0.5) * 0.15;
      heightField[y * resolution + x] = weaveH + weaveV + noise;
    }
  }

  // Convert height field to normal map using finite differences
  const imageData = ctx.createImageData(resolution, resolution);
  const data = imageData.data;
  const strength = 1.5; // How pronounced the bumps are

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const idx = y * resolution + x;
      const xp = x < resolution - 1 ? idx + 1 : idx;
      const xm = x > 0 ? idx - 1 : idx;
      const yp = y < resolution - 1 ? idx + resolution : idx;
      const ym = y > 0 ? idx - resolution : idx;

      const dx = (heightField[xp] - heightField[xm]) * strength;
      const dy = (heightField[yp] - heightField[ym]) * strength;

      // Normalize the normal vector
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = 1 / len;

      const pi = idx * 4;
      data[pi] = Math.round((nx * 0.5 + 0.5) * 255);     // R
      data[pi + 1] = Math.round((ny * 0.5 + 0.5) * 255); // G
      data[pi + 2] = Math.round((nz * 0.5 + 0.5) * 255); // B
      data[pi + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

// ── Studio Background Gradient ───────────────────────────────────────
/**
 * Creates a smooth radial gradient texture for the scene background,
 * giving a premium studio-photography feel.
 */
export function generateStudioBackground(resolution = 1024): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d")!;

  // Radial gradient: bright center → slightly darker edges
  const gradient = ctx.createRadialGradient(
    resolution / 2, resolution * 0.45, 0,
    resolution / 2, resolution * 0.45, resolution * 0.75,
  );
  gradient.addColorStop(0, "#fafaf9");
  gradient.addColorStop(0.5, "#f5f5f4");
  gradient.addColorStop(1, "#e7e5e4");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, resolution, resolution);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Environment Map (Procedural Studio HDRI) ─────────────────────────
/**
 * Generates a simple procedural environment map that simulates soft
 * studio lighting with a warm key light and cool fill. This replaces
 * the need for loading an external HDR file.
 *
 * Returns a CubeTexture-compatible equirect texture.
 */
export function generateStudioEnvMap(resolution = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = resolution * 2;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d")!;

  // Base: neutral dark gray
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Warm key light (top-right area)
  const key = ctx.createRadialGradient(
    canvas.width * 0.7, canvas.height * 0.2, 0,
    canvas.width * 0.7, canvas.height * 0.2, canvas.width * 0.35,
  );
  key.addColorStop(0, "rgba(255, 248, 230, 0.95)");
  key.addColorStop(0.3, "rgba(255, 240, 210, 0.5)");
  key.addColorStop(1, "rgba(255, 240, 210, 0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cool fill light (left side)
  const fill = ctx.createRadialGradient(
    canvas.width * 0.15, canvas.height * 0.4, 0,
    canvas.width * 0.15, canvas.height * 0.4, canvas.width * 0.3,
  );
  fill.addColorStop(0, "rgba(200, 215, 255, 0.6)");
  fill.addColorStop(0.4, "rgba(200, 215, 255, 0.25)");
  fill.addColorStop(1, "rgba(200, 215, 255, 0)");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground bounce (warm from bottom)
  const ground = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.6);
  ground.addColorStop(0, "rgba(245, 235, 220, 0.35)");
  ground.addColorStop(1, "rgba(245, 235, 220, 0)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rim light (behind, top center)
  const rim = ctx.createRadialGradient(
    canvas.width * 0.5, canvas.height * 0.1, 0,
    canvas.width * 0.5, canvas.height * 0.1, canvas.width * 0.2,
  );
  rim.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  rim.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  rim.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
