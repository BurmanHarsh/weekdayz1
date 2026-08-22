import React from "react";

interface TShirtMockupProps {
  colorHex: string;
  side: "Front" | "Back";
  className?: string;
}

export function TShirtMockup({ colorHex, side, className = "" }: TShirtMockupProps) {
  const hex = colorHex.toLowerCase();
  const isBlack = hex === "#0a0a0a" || hex === "#121212";
  const isOffWhite = hex === "#f5f0e8" || hex === "#f3ebdd";
  const isNavy = hex === "#162238" || hex === "#1b2a4a" || hex === "#162444";

  // Lightest subtle background shade matching each t-shirt color (with clear contrast)
  const bgShade = isBlack
    ? "#F2F2F4"
    : isNavy
    ? "#EFF3F8"
    : isOffWhite
    ? "#EBEBEF" // Neutral cool light gray for sharp contrast with cream off-white shirt
    : "#FFFFFF";

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-colors duration-300 ${className}`}
      style={{ backgroundColor: bgShade }}
    >
      {isBlack ? (
        /* Real Studio Black T-Shirt Photo */
        <img
          src="/products/tee-black.jpg"
          alt="Black T-Shirt"
          className="w-full h-full object-contain p-4 pointer-events-none"
        />
      ) : isOffWhite ? (
        /* Real Studio Warm Cream Off-White T-Shirt Photo */
        <img
          src="/products/tee-white.jpg"
          alt="Off-White T-Shirt"
          className="w-full h-full object-contain p-4 pointer-events-none"
          style={{
            filter: "sepia(0.32) saturate(1.2) brightness(0.96)",
          }}
        />
      ) : isNavy ? (
        /* Real Studio Navy Blue T-Shirt Photo */
        <img
          src="/products/tee-black.jpg"
          alt="Navy Blue T-Shirt"
          className="w-full h-full object-contain p-4 pointer-events-none"
          style={{
            filter: "brightness(1.9) contrast(1.1) sepia(0.9) hue-rotate(180deg) saturate(3.5)",
          }}
        />
      ) : (
        /* Real Studio Bright White T-Shirt Photo */
        <img
          src="/products/tee-white.jpg"
          alt="White T-Shirt"
          className="w-full h-full object-contain p-4 pointer-events-none"
        />
      )}
    </div>
  );
}

export function getTShirtSvgDataUrl(colorHex: string, side: "Front" | "Back"): string {
  const isBlack = colorHex.toLowerCase() === "#0a0a0a" || colorHex.toLowerCase() === "#121212";
  if (isBlack) return "/products/tee-black.jpg";
  return "/products/tee-white.jpg";
}
