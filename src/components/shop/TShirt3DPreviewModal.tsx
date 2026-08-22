import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface TShirt3DPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frontCompositeUrl?: string;
  backCompositeUrl?: string;
  baseColor: string;
  garmentType: string;
}

export function TShirt3DPreviewModal({
  open,
  onOpenChange,
  frontCompositeUrl,
  backCompositeUrl,
  baseColor,
  garmentType,
}: TShirt3DPreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const frontImgRef = useRef<HTMLImageElement | null>(null);
  const backImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    let loadedCount = 0;
    const totalToLoad = (frontCompositeUrl ? 1 : 0) + (backCompositeUrl ? 1 : 0);
    if (totalToLoad === 0) {
      setImagesLoaded(true);
      return;
    }

    if (frontCompositeUrl) {
      const fImg = new Image();
      fImg.crossOrigin = "anonymous";
      fImg.src = frontCompositeUrl;
      fImg.onload = () => {
        frontImgRef.current = fImg;
        loadedCount++;
        if (loadedCount >= totalToLoad) setImagesLoaded(true);
      };
    }
    if (backCompositeUrl) {
      const bImg = new Image();
      bImg.crossOrigin = "anonymous";
      bImg.src = backCompositeUrl;
      bImg.onload = () => {
        backImgRef.current = bImg;
        loadedCount++;
        if (loadedCount >= totalToLoad) setImagesLoaded(true);
      };
    }
  }, [open, frontCompositeUrl, backCompositeUrl]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Save state
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);

    // Calculate rotation angle & active side (front vs back based on rotationY)
    const normalizedY = ((rotationY % 360) + 360) % 360;
    const isFrontSide = normalizedY <= 90 || normalizedY >= 270;
    const scaleX = Math.cos((normalizedY * Math.PI) / 180);

    ctx.scale(scaleX, 1);

    // Draw shirt silhouette base
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-120, -180);
    ctx.lineTo(-70, -220);
    ctx.quadraticCurveTo(0, -200, 70, -220);
    ctx.lineTo(120, -180);
    ctx.lineTo(180, -110);
    ctx.lineTo(135, -70);
    ctx.lineTo(110, -110);
    ctx.lineTo(110, 200);
    ctx.lineTo(-110, 200);
    ctx.lineTo(-110, -110);
    ctx.lineTo(-135, -70);
    ctx.lineTo(-180, -110);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#00000022";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw shadow gradient
    const shadowGrad = ctx.createLinearGradient(-120, 0, 120, 0);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.15)");
    shadowGrad.addColorStop(0.5, "rgba(255,255,255,0.05)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // Draw neck collar outline
    ctx.beginPath();
    ctx.ellipse(0, -210, 35, 12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw custom composite design texture on front or back
    const activeImg = isFrontSide ? frontImgRef.current : backImgRef.current;
    if (activeImg) {
      ctx.globalAlpha = 0.95;
      ctx.drawImage(activeImg, -100, -160, 200, 320);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isFrontSide ? "FRONT VIEW" : "BACK VIEW", 0, 0);
    }

    ctx.restore();
  }, [open, rotationY, rotationX, zoom, imagesLoaded, baseColor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotationY((prev) => prev + deltaX * 0.8);
    setRotationX((prev) => Math.max(-30, Math.min(30, prev + deltaY * 0.5)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border border-border p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-foreground">
            3D Interactive Preview — {garmentType}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Click and drag to rotate 360°. Scroll or use buttons to zoom.
          </p>
        </DialogHeader>

        {/* 3D Canvas viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative my-2 w-full h-[400px] bg-secondary/30 border border-border flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
        >
          <canvas ref={canvasRef} width={500} height={500} className="w-full h-full object-contain" />

          {/* Floating Orbit Toolbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur border border-border p-1.5 flex items-center gap-2 shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1.5 hover:bg-secondary text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1.5 hover:bg-secondary text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => setRotationY((r) => r + 180)}
              className="p-1.5 hover:bg-secondary text-foreground transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              title="Flip Front / Back"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Flip Side
            </button>
            <button
              onClick={() => {
                setRotationY(0);
                setRotationX(0);
                setZoom(1);
              }}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-secondary text-muted-foreground transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="absolute top-3 left-3 bg-foreground/80 text-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
            {(((rotationY % 360) + 360) % 360 <= 90 || ((rotationY % 360) + 360) % 360 >= 270) ? "Front View" : "Back View"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
