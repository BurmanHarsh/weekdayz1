import React from "react";

export type MockupViewSide = "Front" | "Back" | "Sleeve";

interface TShirtMockupProps {
  colorHex: string;
  side: MockupViewSide;
  customMockupUrl?: string;
  className?: string;
}

export function TShirtMockup({
  colorHex,
  side,
  customMockupUrl,
  className = "",
}: TShirtMockupProps) {
  const hex = colorHex.toLowerCase();
  const isBlack = hex === "#0a0a0a" || hex === "#121212" || hex === "#111111" || hex === "#000000";
  const isOffWhite = hex === "#f5f0e8" || hex === "#f3ebdd" || hex === "#efe6d5";
  const isNavy = hex === "#162238" || hex === "#1b2a4a" || hex === "#162444" || hex === "#0f2042";

  // Lightest subtle background shade matching each t-shirt color (with clear contrast)
  const bgShade = isBlack
    ? "#F2F2F4"
    : isNavy
    ? "#EFF3F8"
    : isOffWhite
    ? "#EBEBEF"
    : "#FFFFFF";

  // If custom uploaded mockup URL is provided for this side, render it directly
  if (customMockupUrl) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-colors duration-300 ${className}`}
        style={{ backgroundColor: bgShade }}
      >
        <img
          src={customMockupUrl}
          alt={`${side} View Mockup`}
          className="w-full h-full object-contain p-4 pointer-events-none"
        />
      </div>
    );
  }

  // Side Sleeve Mockup View
  if (side === "Sleeve") {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-colors duration-300 ${className}`}
        style={{ backgroundColor: bgShade }}
      >
        <div className="relative w-full max-w-[340px] aspect-[3/4] flex items-center justify-center p-4">
          {/* Studio sleeve profile vector with fabric shading */}
          <svg
            viewBox="0 0 300 400"
            className="w-full h-full filter drop-shadow-xl select-none pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shoulder to sleeve body */}
            <path
              d="M110 30 C150 25, 230 45, 260 85 C275 105, 280 160, 275 220 C270 270, 260 310, 250 330 C245 340, 205 345, 175 345 C145 345, 125 330, 115 305 C105 280, 95 230, 90 170 C85 110, 90 50, 110 30 Z"
              fill={isBlack ? "#161616" : isNavy ? "#142340" : isOffWhite ? "#EFE8DC" : "#F8F8FA"}
              stroke={isBlack ? "#262626" : isNavy ? "#223555" : isOffWhite ? "#DCD2C0" : "#E2E2E6"}
              strokeWidth="2.5"
            />

            {/* Sleeve Hem Ribbing / Cuff */}
            <path
              d="M115 305 C140 325, 220 340, 250 330 C252 342, 240 355, 220 358 C180 362, 130 350, 112 320 Z"
              fill={isBlack ? "#0F0F0F" : isNavy ? "#0D192C" : isOffWhite ? "#E3DACB" : "#EEEEF2"}
              stroke={isBlack ? "#222222" : isNavy ? "#1A2B47" : isOffWhite ? "#D0C4B0" : "#D4D4DA"}
              strokeWidth="1.5"
            />

            {/* Shoulder Seam Arc */}
            <path
              d="M110 30 C130 70, 145 130, 150 180"
              stroke={isBlack ? "#2A2A2A" : isNavy ? "#24375A" : isOffWhite ? "#DDD2BE" : "#E4E4EB"}
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Subtle Lighting highlight & fabric fold depth */}
            <path
              d="M140 60 C180 80, 240 120, 250 200 C255 240, 245 280, 240 310"
              stroke={isBlack ? "#2C2C2C" : isNavy ? "#2E4775" : isOffWhite ? "#FFFFFF" : "#FFFFFF"}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={isBlack || isNavy ? "0.15" : "0.4"}
            />

            {/* Sleeve print zone guide */}
            <rect
              x="145"
              y="150"
              width="90"
              height="110"
              rx="8"
              fill="none"
              stroke={isBlack || isNavy ? "#FFFFFF" : "#000000"}
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.25"
            />
            <text
              x="190"
              y="210"
              textAnchor="middle"
              fill={isBlack || isNavy ? "#FFFFFF" : "#000000"}
              opacity="0.35"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="1"
            >
              SLEEVE PRINT ZONE
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // Front & Back Views
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-colors duration-300 ${className}`}
      style={{ backgroundColor: bgShade }}
    >
      {isBlack ? (
        <img
          src="/products/tee-black.jpg"
          alt={`${side} View Black T-Shirt`}
          className="w-full h-full object-contain p-4 pointer-events-none"
        />
      ) : isOffWhite ? (
        <img
          src="/products/tee-white.jpg"
          alt={`${side} View Off-White T-Shirt`}
          className="w-full h-full object-contain p-4 pointer-events-none"
          style={{
            filter: "sepia(0.32) saturate(1.2) brightness(0.96)",
          }}
        />
      ) : isNavy ? (
        <img
          src="/products/tee-black.jpg"
          alt={`${side} View Navy Blue T-Shirt`}
          className="w-full h-full object-contain p-4 pointer-events-none"
          style={{
            filter: "brightness(1.9) contrast(1.1) sepia(0.9) hue-rotate(180deg) saturate(3.5)",
          }}
        />
      ) : (
        <img
          src="/products/tee-white.jpg"
          alt={`${side} View White T-Shirt`}
          className="w-full h-full object-contain p-4 pointer-events-none"
        />
      )}

      {/* Back View Neckline overlay indicator when viewing Back */}
      {side === "Back" && (
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-28 h-7 border-b-2 border-dashed border-black/15 pointer-events-none rounded-b-full" />
      )}
    </div>
  );
}

export function getTShirtSvgDataUrl(
  colorHex: string,
  side: MockupViewSide,
  customMockupUrl?: string,
): string {
  if (customMockupUrl) return customMockupUrl;
  const isBlack = colorHex.toLowerCase() === "#0a0a0a" || colorHex.toLowerCase() === "#121212" || colorHex.toLowerCase() === "#111111";
  if (isBlack) return "/products/tee-black.jpg";
  return "/products/tee-white.jpg";
}
