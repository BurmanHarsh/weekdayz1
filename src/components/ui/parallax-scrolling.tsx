'use client';

import React, { useEffect, useRef } from 'react';

export function ParallaxScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsapModule: any;
    let ScrollTriggerModule: any;
    let lenisModule: any;
    let lenisInstance: any;
    let ctx: any;

    async function init() {
      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('@studio-freight/lenis'),
      ]);

      gsapModule = gsap;
      ScrollTriggerModule = ScrollTrigger;

      gsap.registerPlugin(ScrollTrigger);

      const triggerEl = layersRef.current;
      if (!triggerEl) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerEl,
            start: '0% 0%',
            end: '100% 0%',
            scrub: 0,
          },
        });

        const layers = [
          { layer: '1', yPercent: 70 },
          { layer: '2', yPercent: 55 },
          { layer: '3', yPercent: 40 },
          { layer: '4', yPercent: 10 },
        ];

        layers.forEach((layerObj, idx) => {
          tl.to(
            triggerEl.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
            { yPercent: layerObj.yPercent, ease: 'none' },
            idx === 0 ? undefined : '<'
          );
        });
      }, containerRef);

      lenisInstance = new Lenis();
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time: number) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    init();

    return () => {
      if (ctx) ctx.revert();
      if (ScrollTriggerModule) ScrollTriggerModule.getAll().forEach((st: any) => st.kill());
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="parallax-section w-full overflow-hidden">
      <section className="relative" style={{ height: '100svh' }}>
        {/* Overflow-clipping black bar at top */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-background z-10" />

        <div
          ref={layersRef}
          data-parallax-layers
          className="absolute inset-0 overflow-hidden"
          style={{ height: '100svh' }}
        >
          {/* Layer 1 — far background lifestyle image */}
          <img
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&auto=format&fit=crop&q=80"
            loading="eager"
            alt=""
            data-parallax-layer="1"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ willChange: 'transform' }}
          />

          {/* Layer 2 — mid-ground overlay texture */}
          <img
            src="https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=1600&auto=format&fit=crop&q=80"
            loading="eager"
            alt=""
            data-parallax-layer="2"
            className="absolute inset-0 w-full h-full object-cover object-top mix-blend-multiply opacity-60"
            style={{ willChange: 'transform' }}
          />

          {/* Layer 3 — centred display text */}
          <div
            data-parallax-layer="3"
            className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4"
            style={{ willChange: 'transform' }}
          >
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.4em] text-white/60 uppercase mb-4">
              WEEKDAYZZ STUDIO
            </span>
            <h2
              className="text-5xl sm:text-7xl md:text-9xl font-black text-white leading-none tracking-tight"
              style={{ textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}
            >
              CREATE
            </h2>
            <h2
              className="text-5xl sm:text-7xl md:text-9xl font-black text-white/30 leading-none tracking-tight -mt-2"
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}
            >
              YOUR OWN
            </h2>
          </div>

          {/* Layer 4 — foreground product detail image */}
          <img
            src="https://images.unsplash.com/photo-1503341455253-b2522382f669?w=1600&auto=format&fit=crop&q=80"
            loading="eager"
            alt=""
            data-parallax-layer="4"
            className="absolute inset-0 w-full h-full object-cover object-bottom opacity-70"
            style={{ willChange: 'transform' }}
          />

          {/* Bottom gradient fade into background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-20" />
        </div>
      </section>
    </div>
  );
}
