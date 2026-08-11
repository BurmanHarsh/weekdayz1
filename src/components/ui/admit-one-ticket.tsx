import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdmitOneTicketProps {
  title?: string;
  subtitle?: string;
  tags?: string[];
  ctaText?: string;
  to?: string;
  className?: string;
}

export function AdmitOneTicket({
  title = "CREATE YOUR OWN",
  subtitle = "Customise any type of print. Upload your graphic, pick a fit, print your vibe.",
  tags = ["CUSTOM", "COUPLE", "TRENDING", "FESTIVE"],
  ctaText = "START DESIGNING",
  to = "/create",
  className,
}: AdmitOneTicketProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative block w-full overflow-hidden transition-all duration-500 hover:scale-[1.01]",
        className,
      )}
    >
      {/* Outer Card Shell with Ticket Cutouts — Even taller padding & min-height without outer border */}
      <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] text-white py-16 px-8 sm:py-24 sm:px-14 lg:py-28 lg:px-20 min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] shadow-2xl overflow-hidden flex flex-col justify-center border-none">
        
        {/* Decorative Dithering & Grain Background */}
        <div
          className="absolute inset-0 opacity-12 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Ambient Radial Glow */}
        <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        {/* Ticket Left Notch Cutout */}
        <div className="absolute top-1/2 -left-5 -translate-y-1/2 h-10 w-10 rounded-full bg-background border border-black/10 z-20" />
        {/* Ticket Right Notch Cutout */}
        <div className="absolute top-1/2 -right-5 -translate-y-1/2 h-10 w-10 rounded-full bg-background border border-black/10 z-20" />

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_240px] items-center gap-8 relative z-10 my-auto">

          {/* LEFT SECTION: Ticket Header, Title, Subtitle, Tags */}
          <div className="space-y-5">
            {/* Header / Brand Badge */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-[11px] font-black tracking-[0.25em] uppercase text-white/90 rounded-sm">
                <Ticket className="h-3.5 w-3.5" /> ADMIT ONE · WEEKDAYZZ STUDIO
              </span>
              <span className="text-[10px] font-mono tracking-widest text-white/50 hidden sm:inline">
                TICKET #WZ-2026-STUDIO
              </span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                {title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/75 max-w-lg font-medium leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-bold uppercase tracking-widest border border-white/20 text-white/85 px-3 py-1.5 rounded-sm bg-white/5 group-hover:border-white/50 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CENTER: Vertical Perforated Dashed Divider (Desktop) */}
          <div className="hidden lg:flex flex-col items-center justify-center h-full px-2">
            <div className="h-44 border-r-2 border-dashed border-white/25" />
          </div>

          {/* RIGHT SECTION: Barcode & Call to Action Stub */}
          <div className="flex flex-col items-start lg:items-center justify-center gap-5 pt-6 lg:pt-0 border-t border-dashed border-white/20 lg:border-t-0">
            {/* Barcode Graphic */}
            <div className="w-full flex flex-col items-center gap-1.5 bg-white/5 border border-white/15 p-4 rounded-sm group-hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-center gap-1 h-10 w-full">
                {[3,1,4,2,1,5,2,1,3,1,4,2,1,3,2,1,4,1,2,3,1,4,2].map((width, idx) => (
                  <span
                    key={idx}
                    className="bg-white/80 h-full rounded-none"
                    style={{ width: `${width * 2.2}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/60 uppercase">
                * 2026-CUSTOM-TEE *
              </span>
            </div>

            {/* CTA Button */}
            <div className="w-full">
              <div className="w-full inline-flex items-center justify-center gap-2 bg-white text-black px-7 py-4 text-xs font-black tracking-widest uppercase hover:bg-white/90 transition-all shadow-xl group-hover:scale-105">
                <Sparkles className="h-4 w-4" />
                {ctaText}
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </Link>
  );
}
