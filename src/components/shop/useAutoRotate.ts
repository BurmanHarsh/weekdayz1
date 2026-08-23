import { useEffect, useRef } from "react";

/**
 * Drives a Y-axis rotation value with auto-spin, pause-on-interaction,
 * resume after idle. Returns the current rotation in radians.
 *
 * Used by the 3D preview so the shirt keeps turning 360° until the user
 * grabs it, then resumes spinning 1.5s after they let go.
 */
export function useAutoRotate(options: {
  speed?: number; // rad/sec
  idleResumeMs?: number;
  enabled?: boolean;
} = {}) {
  const { speed = 0.5, idleResumeMs = 1500, enabled = true } = options;
  const rotationRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const lastInteractRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const subscribersRef = useRef<Set<(r: number) => void>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const now = performance.now();
      const idle = now - lastInteractRef.current > idleResumeMs;
      if (!pausedRef.current && idle) {
        rotationRef.current += speed * dt;
      }
      subscribersRef.current.forEach((cb) => cb(rotationRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [speed, idleResumeMs, enabled]);

  return {
    getRotation: () => rotationRef.current,
    pause: () => {
      pausedRef.current = true;
    },
    resume: () => {
      pausedRef.current = false;
      lastInteractRef.current = performance.now();
    },
    notifyInteract: () => {
      lastInteractRef.current = performance.now();
    },
    subscribe: (cb: (r: number) => void) => {
      subscribersRef.current.add(cb);
      return () => {
        subscribersRef.current.delete(cb);
      };
    },
  };
}
