import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, ShoppingBag, RotateCw, Maximize2, Trash2, ChevronDown, ChevronUp, Box } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-store";
import { createDesign } from "@/lib/designs.functions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE_PRICE = 1899_00 / 100 * 100; // base tee 1899
const CUSTOM_PRINT_SURCHARGE = 20000; // ₹200 in paise/cents

const COLORS = [
  { name: "Black", hex: "#0A0A0A", image: "/products/tee-black.jpg" },
  { name: "White", hex: "#FAFAFA", image: "/products/tee-white.jpg" },
  { name: "Off White", hex: "#F5F0E8", image: "/products/tee-white.jpg" },
  { name: "Navy", hex: "#1B2A4A", image: "/products/tee-gray.jpg" },
  { name: "Brown", hex: "#6B4423", image: "/products/tee-gray.jpg" },
];

const GARMENT_TYPES = [
  "Oversized Tees",
  "Baby Tees",
  "Polo Tees",
  "Regular Fit",
  "Hoodies",
  "Sweatshirts",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const PRINT_COSTS = [
  { label: "Front Chest Print (Small)", price: 9900 },
  { label: "Front Full Print (A3)", price: 19900 },
  { label: "Back Full Print (A3)", price: 19900 },
  { label: "Sleeve Print", price: 5900 },
];

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Creator Studio — Design Your Own Tee | WEEKDAYZZ" },
      { name: "description", content: "Upload your graphic, pick a color, drag and resize. Print your vibe with WEEKDAYZZ." },
      { property: "og:title", content: "Creator Studio — WEEKDAYZZ" },
      { property: "og:description", content: "Design your own custom tee. Drag, rotate, scale, print." },
    ],
  }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const createDesignFn = useServerFn(createDesign);

  const [color, setColor] = useState(COLORS[0]);
  const [garment, setGarment] = useState(GARMENT_TYPES[0]);
  const [printSide, setPrintSide] = useState<"Front" | "Back">("Front");
  const [graphic, setGraphic] = useState<{ file: File; preview: string } | null>(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState("L");
  const [saving, setSaving] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [preview3D, setPreview3D] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onDrop = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Max file size is 8MB");
      return;
    }
    if (graphic?.preview) URL.revokeObjectURL(graphic.preview);
    setGraphic({ file: f, preview: URL.createObjectURL(f) });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
  });

  useEffect(() => () => { if (graphic?.preview) URL.revokeObjectURL(graphic.preview); }, [graphic]);

  const total = BASE_PRICE + (graphic ? CUSTOM_PRINT_SURCHARGE : 0);

  const generateCompositeImageBlob = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Could not get canvas context")); return; }

      canvas.width = 600;
      canvas.height = 600;

      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.src = color.image;

      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, 600, 600);

        if (!graphic) {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to generate blob"));
          }, "image/png");
          return;
        }

        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = graphic.preview;

        logoImg.onload = () => {
          ctx.save();
          const container = canvasRef.current;
          const containerWidth = container?.clientWidth || 400;
          const containerHeight = container?.clientHeight || 400;
          const scaleX = 600 / containerWidth;
          const scaleY = 600 / containerHeight;
          const centerX = 300 + pos.x * scaleX;
          const centerY = 300 + pos.y * scaleY;
          ctx.translate(centerX, centerY);
          ctx.rotate((rotate * Math.PI) / 180);
          const domGraphicSize = 176;
          const canvasGraphicSize = domGraphicSize * scaleX * scale;
          ctx.drawImage(logoImg, -canvasGraphicSize / 2, -canvasGraphicSize / 2, canvasGraphicSize, canvasGraphicSize);
          ctx.restore();
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to generate blob"));
          }, "image/png");
        };

        logoImg.onerror = () => reject(new Error("Failed to load overlay graphic image"));
      };

      baseImg.onerror = () => reject(new Error("Failed to load base T-shirt image"));
    });
  };

  async function handleAddToCart() {
    if (!user) {
      toast.error("Sign in to save your design");
      navigate({ to: "/auth" });
      return;
    }
    if (!graphic) {
      toast.error("Upload a graphic first");
      return;
    }
    setSaving(true);
    try {
      const ext = graphic.file.name.split(".").pop() ?? "png";
      const rawPath = `${user.id}/raw_${crypto.randomUUID()}.${ext}`;
      const compositePath = `${user.id}/composite_${crypto.randomUUID()}.png`;

      const { error: upRawErr } = await supabase.storage
        .from("user-graphics")
        .upload(rawPath, graphic.file, { upsert: false, contentType: graphic.file.type });
      if (upRawErr) throw upRawErr;

      const compositeBlob = await generateCompositeImageBlob();
      const { error: upCompErr } = await supabase.storage
        .from("user-graphics")
        .upload(compositePath, compositeBlob, { upsert: false, contentType: "image/png" });
      if (upCompErr) throw upCompErr;

      const { data: signedData, error: signedErr } = await supabase.storage
        .from("user-graphics")
        .createSignedUrl(compositePath, 60 * 60 * 24 * 7);
      if (signedErr) throw signedErr;
      const imageUrl = signedData.signedUrl;

      const placement = { scale, rotate, x: pos.x, y: pos.y, raw_graphic_url: rawPath };
      const { id } = await createDesignFn({
        data: {
          design_file_url: compositePath,
          base_color: color.hex,
          placement_settings: placement,
        },
      });

      addItem({
        custom_design_id: id,
        title: `Custom ${garment} · ${color.name}`,
        image: imageUrl,
        size,
        unit_price_cents: total,
      });
      toast.success("Custom tee added to bag");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save design");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full min-h-screen pb-28">
      {/* Page Header */}
      <div className="border-b border-border bg-background px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">WEEKDAYZZ · Creator Studio</span>
            <h1 className="text-display text-3xl sm:text-4xl font-black mt-1">Create Your Own</h1>
            <p className="text-sm text-muted-foreground mt-1">Customise any type of print</p>
          </div>
          {/* 3D Preview toggle (UI-only) */}
          <button
            onClick={() => setPreview3D((v) => !v)}
            className={cn(
              "flex items-center gap-2 border px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all",
              preview3D
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground hover:border-foreground",
            )}
          >
            <Box className="h-4 w-4" />
            {preview3D ? "Flat View" : "3D Preview"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">

          {/* ── CANVAS ── */}
          <div className="space-y-3">
            {/* Print Side Toggle */}
            <div className="flex gap-0 border border-border w-fit">
              {(["Front", "Back"] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setPrintSide(side)}
                  className={cn(
                    "px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all",
                    printSide === side
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {side}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div
              className="relative bg-card border border-border overflow-hidden"
              style={{ aspectRatio: "3/4" }}
              ref={canvasRef}
            >
              <img src={color.image} alt="" className="absolute inset-0 w-full h-full object-cover" />

              {graphic && (
                <motion.div
                  drag
                  dragMomentum={false}
                  onDragEnd={(_, info) => setPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
                  style={{ x: pos.x, y: pos.y, rotate, scale }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 cursor-grab active:cursor-grabbing"
                >
                  <img src={graphic.preview} alt="" className="w-full h-full object-contain pointer-events-none select-none" />
                </motion.div>
              )}

              {/* Upload Overlay */}
              <div
                {...getRootProps()}
                className={cn(
                  "absolute inset-x-4 sm:inset-x-12 bottom-8 border-2 border-dashed p-6 text-center cursor-pointer bg-background/85 backdrop-blur-sm transition-all",
                  isDragActive ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/50",
                  graphic && "hidden",
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 mx-auto mb-2 text-foreground" />
                <p className="text-sm font-bold">Upload your Image</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  For best use, remove background<br />to improve Graphic.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">PNG/JPG · max 8MB</p>
              </div>

              {/* Print side label */}
              <div className="absolute top-3 left-3 bg-foreground/80 text-background text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                {printSide} Print
              </div>
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="space-y-5">
            {/* Garment Type */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">Garment Type</label>
              <select
                value={garment}
                onChange={(e) => setGarment(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
              >
                {GARMENT_TYPES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Color Swatches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Color</span>
                <span className="text-xs font-semibold">{color.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c)}
                    title={c.name}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      color.name === c.name ? "border-foreground scale-110 shadow-md" : "border-border hover:border-foreground/50",
                    )}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size Guide + Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Size</span>
                <button className="text-[10px] font-bold uppercase tracking-widest text-foreground underline">Size Chart</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "px-3 py-2 text-xs font-bold border transition-all",
                      size === s
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground/50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale / Rotate (only when graphic is uploaded) */}
            {graphic && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                      <Maximize2 className="h-3 w-3" /> Scale · {scale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range" min={0.3} max={2.5} step={0.05} value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-[var(--color-foreground)]"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5 mb-2">
                    <RotateCw className="h-3 w-3" /> Rotate · {rotate}°
                  </span>
                  <input
                    type="range" min={-180} max={180} value={rotate}
                    onChange={(e) => setRotate(Number(e.target.value))}
                    className="w-full accent-[var(--color-foreground)]"
                  />
                </div>
                <button
                  onClick={() => {
                    if (graphic?.preview) URL.revokeObjectURL(graphic.preview);
                    setGraphic(null);
                    setScale(1); setRotate(0); setPos({ x: 0, y: 0 });
                  }}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-destructive hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Remove graphic
                </button>
              </>
            )}

            {/* Print Costing Accordion */}
            <div className="border border-border">
              <button
                onClick={() => setCostOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                <span>Print Costing</span>
                {costOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {costOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {PRINT_COSTS.map((p) => (
                    <div key={p.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">{p.label}</span>
                      <span className="text-xs font-bold">{formatPrice(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price summary */}
            <div className="bg-secondary/50 border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base {garment}</span>
                <span className="font-semibold">{formatPrice(BASE_PRICE)}</span>
              </div>
              {graphic && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Printing Cost</span>
                  <span className="font-semibold">+{formatPrice(CUSTOM_PRINT_SURCHARGE)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-black text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground text-center">
                <Link to="/auth" className="text-foreground underline">Sign in</Link> to save your design and order.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY FOOTER CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 shadow-2xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Base {formatPrice(BASE_PRICE)} {graphic ? `+ Print ${formatPrice(CUSTOM_PRINT_SURCHARGE)}` : ""}
            </span>
            <span className="font-black text-lg">{formatPrice(total)}</span>
          </div>
          <button
            disabled={saving || !graphic}
            onClick={handleAddToCart}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-xs uppercase tracking-widest font-bold disabled:opacity-40 hover:opacity-85 transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            {saving ? "Saving…" : "Add custom tee to BAG"}
          </button>
        </div>
      </div>
    </div>
  );
}
