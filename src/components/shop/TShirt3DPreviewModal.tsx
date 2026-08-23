import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Pause, Play, AlertTriangle } from "lucide-react";
import { TShirt3DViewer } from "./TShirt3DViewer";
import type { TextureLayer } from "./designToTexture";

interface TShirt3DPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Customer's design layers — same type as in routes/create.tsx DesignLayer. */
  layers: TextureLayer[];
  baseColor: string;
  garmentType: string;
  /** S/M/L/XL — drives body fit proportions in the 3D viewer. */
  size?: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
}

class ThreeJSBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("3D Preview Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-card">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3D Preview Unavailable
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            WebGL 3D rendering encountered an issue on your browser or device. You can still customize your design in 2D view.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 text-xs font-bold uppercase tracking-wider"
          >
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TShirt3DPreviewModal({
  open,
  onOpenChange,
  layers,
  baseColor,
  garmentType,
  size = "L",
}: TShirt3DPreviewModalProps) {
  const [paused, setPaused] = useState(false);

  // Reset pause state when reopening
  useEffect(() => {
    if (open) setPaused(false);
  }, [open]);

  const handleReset = () => {
    window.dispatchEvent(new CustomEvent("tshirt3d:reset"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border border-border p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-foreground">
            3D Preview — {garmentType}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Your custom design fitted to a body, rotating 360°. Drag to inspect, scroll to zoom.
          </p>
        </DialogHeader>

        {/* 3D viewport — fixed height so the canvas can size itself */}
        <div className="relative w-full h-[460px] bg-gradient-to-b from-secondary/30 to-background">
          {open && (
            <ThreeJSBoundary>
              <ViewerPauser paused={paused}>
                <TShirt3DViewer
                  baseColor={baseColor}
                  garmentType={garmentType}
                  layers={layers}
                  size={size}
                />
              </ViewerPauser>
            </ThreeJSBoundary>
          )}

          {/* Floating toolbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border border-border px-1.5 py-1 flex items-center gap-1 shadow-xl z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPaused((p) => !p)}
              title={paused ? "Resume rotation" : "Pause rotation"}
              className="h-8 w-8"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <div className="h-5 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.dispatchEvent(new CustomEvent("tshirt3d:zoom", { detail: +0.4 }))}
              title="Zoom In"
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.dispatchEvent(new CustomEvent("tshirt3d:zoom", { detail: -0.4 }))}
              title="Zoom Out"
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Reset view"
              className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 sm:px-8 py-3 border-t border-border bg-card flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground font-medium">
            Base color · <span className="font-bold text-foreground">{baseColor}</span> · Size{" "}
            <span className="font-bold text-foreground">{size}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-[10px] font-bold uppercase tracking-widest"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Wraps the viewer and forwards the toolbar's pause state.
 */
function ViewerPauser({
  paused,
  children,
}: {
  paused: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("tshirt3d:paused", { detail: paused }));
  }, [paused]);
  return <>{children}</>;
}
