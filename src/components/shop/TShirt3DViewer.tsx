import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { loadTShirtModel, parseToSafeHex, type TShirtModelHandle } from "./TShirt3DModel";
import { renderDesignToTexture, type TextureLayer } from "./designToTexture";
import { useAutoRotate } from "./useAutoRotate";
import { generateStudioEnvMap, generateStudioBackground } from "./fabricTexture";
import { Loader2 } from "lucide-react";

interface TShirt3DViewerProps {
  baseColor: string;
  garmentType: string;
  layers: TextureLayer[];
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
}

/**
 * Photorealistic Three.js viewer with GLTF 3D garment model loading.
 */
export function TShirt3DViewer({ baseColor, garmentType, layers, size }: TShirt3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelHandleRef = useRef<TShirtModelHandle | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"Front" | "Back">("Front");

  const hexColor = parseToSafeHex(baseColor);

  // ── Build scene + load model once ──────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 460;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Studio background
    const bgTexture = generateStudioBackground(1024);
    scene.background = bgTexture;

    // Environment map
    const envMap = generateStudioEnvMap(256);
    scene.environment = envMap;

    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Studio Lighting ───────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d0c8, 0.5);
    hemi.position.set(0, 10, 0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd0e0ff, 0.6);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const groundGeom = new THREE.CircleGeometry(3.5, 64);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Load 3D GLTF Model ─────────────────────────────────────────
    loadTShirtModel({ baseColor: hexColor, size })
      .then(async (model) => {
        if (!isMounted) {
          model.dispose();
          return;
        }
        modelHandleRef.current = model;
        scene.add(model.group);

        // Render & apply initial texture (base color + design layers)
        const designTex = await renderDesignToTexture({ layers, baseColor: hexColor });
        if (designTex && isMounted) {
          model.materials.front.map = designTex;
          model.materials.front.color.set("#ffffff");
          model.materials.front.needsUpdate = true;
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load 3D GLTF T-Shirt model:", err);
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : "Failed to load 3D model");
          setIsLoading(false);
        }
      });

    // ── Resize handling ───────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || 460;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ── Drag-to-rotate ────────────────────────────────────────────
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const dom = renderer.domElement;
    dom.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      autoRotate.notifyInteract();
      autoRotate.pause();
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging || !modelHandleRef.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const model = modelHandleRef.current.group;
      model.rotation.y += dx * 0.008;
      model.rotation.x = Math.max(-0.5, Math.min(0.5, model.rotation.x + dy * 0.004));
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      autoRotate.resume();
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      dom.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3, Math.min(7, camera.position.z + e.deltaY * 0.004));
    };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const onCameraEvt = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: string; delta?: number }>).detail;
      if (detail.kind === "zoom" && detail.delta != null) {
        camera.position.z = Math.max(3, Math.min(7, camera.position.z - detail.delta));
      } else if (detail.kind === "reset") {
        camera.position.set(0, 0.2, 5.0);
        camera.lookAt(0, 0, 0);
      }
    };
    window.addEventListener("tshirt3d:camera", onCameraEvt);

    // ── Render loop ───────────────────────────────────────────────
    let raf = 0;
    const loop = () => {
      renderer.render(scene, camera);

      if (modelHandleRef.current) {
        const totalY = modelHandleRef.current.group.rotation.y;
        const deg = ((((totalY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180) / Math.PI;
        setActiveSide(deg <= 90 || deg >= 270 ? "Front" : "Back");
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      isMounted = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("tshirt3d:camera", onCameraEvt);
      renderer.dispose();
      if (mount.contains(dom)) mount.removeChild(dom);
      scene.clear();
      if (modelHandleRef.current) {
        modelHandleRef.current.dispose();
        modelHandleRef.current = null;
      }
      bgTexture.dispose();
      envMap.dispose();
      groundGeom.dispose();
      groundMat.dispose();
      cameraRef.current = null;
    };
  }, [size]);

  // ── Auto-rotate ───────────────────────────────────────────────────
  const autoRotate = useAutoRotate({ speed: 0.6, idleResumeMs: 1500 });

  useEffect(() => {
    const unsub = autoRotate.subscribe((r) => {
      const m = modelHandleRef.current;
      if (m) {
        m.group.rotation.y = r;
      }
    });
    return () => {
      unsub();
    };
  }, [autoRotate]);

  // ── Toolbar events ────────────────────────────────────────────────
  useEffect(() => {
    const onPaused = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (detail) autoRotate.pause();
      else autoRotate.resume();
    };
    const onZoom = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      window.dispatchEvent(new CustomEvent("tshirt3d:camera", { detail: { kind: "zoom", delta } }));
    };
    const onReset = () => {
      window.dispatchEvent(new CustomEvent("tshirt3d:camera", { detail: { kind: "reset" } }));
      const m = modelHandleRef.current;
      if (m) {
        m.group.rotation.x = 0;
        m.group.rotation.y = 0;
      }
      autoRotate.resume();
    };
    window.addEventListener("tshirt3d:paused", onPaused);
    window.addEventListener("tshirt3d:zoom", onZoom);
    window.addEventListener("tshirt3d:reset", onReset);
    return () => {
      window.removeEventListener("tshirt3d:paused", onPaused);
      window.removeEventListener("tshirt3d:zoom", onZoom);
      window.removeEventListener("tshirt3d:reset", onReset);
    };
  }, [autoRotate]);

  // ── Dynamically update texture on layer OR base color change ─────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const designTex = await renderDesignToTexture({ layers, baseColor: hexColor });
        if (cancelled) return;
        const m = modelHandleRef.current;
        if (m && designTex) {
          if (m.materials.front.map && m.materials.front.map !== designTex) {
            (m.materials.front.map as THREE.Texture).dispose();
          }
          m.materials.front.map = designTex;
          m.materials.front.color.set("#ffffff");
          m.materials.front.needsUpdate = true;
        }
      } catch (err) {
        console.error("Error applying design texture to 3D model:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [layers, hexColor]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={mountRef}
        className="absolute inset-0 select-none"
        style={{ background: "#f5f5f4" }}
        aria-label={`3D preview of ${garmentType}`}
        role="img"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-foreground mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Loading Photorealistic 3D Model…
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-1">
            3D Viewer Error
          </p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
        </div>
      )}

      {/* Side indicator */}
      <div className="absolute top-3 left-3 bg-foreground/90 text-background px-2.5 py-1 text-[10px] font-black uppercase tracking-widest pointer-events-none z-10">
        {activeSide} View
      </div>

      {/* Interaction Hint */}
      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pointer-events-none z-10">
        Drag · Scroll to Zoom
      </div>

      {/* Studio Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.08) 100%)",
        }}
      />
    </div>
  );
}
