import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, ShoppingBag, RotateCw, Maximize2, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-store";
import { createDesign } from "@/lib/designs.functions";
import { formatPrice } from "@/lib/format";

const BASE_PRICE = 1899_00 / 100 * 100; // base tee 1899
const CUSTOM_PRINT_SURCHARGE = 20000; // ₹200 in paise/cents

const COLORS = [
  { name: "Black", hex: "#0A0A0A", image: "/products/tee-black.jpg" },
  { name: "White", hex: "#FAFAFA", image: "/products/tee-white.jpg" },
  { name: "Toxic", hex: "#C8FF00", image: "/products/tee-green.jpg" },
  { name: "Charcoal", hex: "#2A2A2A", image: "/products/tee-gray.jpg" },
];

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Creator Studio — Design Your Own Tee | Weekdayz" },
      { name: "description", content: "Upload your graphic, pick a color, drag and resize. Print your vibe with Weekdayz." },
      { property: "og:title", content: "Creator Studio — Weekdayz" },
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
  const [graphic, setGraphic] = useState<{ file: File; preview: string } | null>(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState("L");
  const [saving, setSaving] = useState(false);
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
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

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

          ctx.drawImage(
            logoImg,
            -canvasGraphicSize / 2,
            -canvasGraphicSize / 2,
            canvasGraphicSize,
            canvasGraphicSize
          );

          ctx.restore();

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to generate blob"));
          }, "image/png");
        };

        logoImg.onerror = (err) => {
          reject(new Error("Failed to load overlay graphic image"));
        };
      };

      baseImg.onerror = (err) => {
        reject(new Error("Failed to load base T-shirt image"));
      };
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

      // 1. Upload raw graphic for printing reference
      const { error: upRawErr } = await supabase.storage
        .from("user-graphics")
        .upload(rawPath, graphic.file, { upsert: false, contentType: graphic.file.type });
      if (upRawErr) throw upRawErr;

      // 2. Generate composite t-shirt preview image
      const compositeBlob = await generateCompositeImageBlob();

      // 3. Upload composite t-shirt preview
      const { error: upCompErr } = await supabase.storage
        .from("user-graphics")
        .upload(compositePath, compositeBlob, { upsert: false, contentType: "image/png" });
      if (upCompErr) throw upCompErr;

      // 4. Create a signed URL for the composite image so it's viewable by the user
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("user-graphics")
        .createSignedUrl(compositePath, 60 * 60 * 24 * 7); // 7 days
      if (signedErr) throw signedErr;
      const imageUrl = signedData.signedUrl;

      // 5. Create design in database
      const placement = { 
        scale, 
        rotate, 
        x: pos.x, 
        y: pos.y,
        raw_graphic_url: rawPath
      };
      const { id } = await createDesignFn({
        data: {
          design_file_url: compositePath,
          base_color: color.hex,
          placement_settings: placement,
        },
      });

      // 6. Add custom tee with its composite signed preview image to cart
      addItem({
        custom_design_id: id,
        title: `Custom Tee · ${color.name}`,
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">Creator Studio</span>
        <h1 className="text-display text-5xl sm:text-7xl mt-2">Design.<br />Drag. <span className="text-accent">Drop.</span></h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* CANVAS */}
        <div className="bg-card border border-border aspect-square relative overflow-hidden" ref={canvasRef}>
          <img src={color.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {graphic && (
            <motion.div
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => setPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
              style={{
                x: pos.x,
                y: pos.y,
                rotate,
                scale,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 cursor-grab active:cursor-grabbing"
            >
              <img src={graphic.preview} alt="" className="w-full h-full object-contain pointer-events-none select-none" />
            </motion.div>
          )}

          {!graphic && (
            <div
              {...getRootProps()}
              className={`absolute inset-x-0 bottom-6 mx-auto max-w-sm border-2 border-dashed p-6 text-center cursor-pointer bg-background/80 backdrop-blur ${
                isDragActive ? "border-accent" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-sm font-semibold">Upload your graphic</p>
              <p className="text-xs text-muted-foreground mt-1">PNG/JPG · max 8MB</p>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Base color</h3>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c)}
                  className={`flex items-center gap-2 px-3 py-2 border text-xs uppercase tracking-widest ${
                    color.name === c.name ? "border-accent" : "border-border"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-border" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {graphic && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Maximize2 className="h-3 w-3" /> Scale · {scale.toFixed(2)}x</h3>
                </div>
                <input type="range" min={0.3} max={2.5} step={0.05} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><RotateCw className="h-3 w-3" /> Rotate · {rotate}°</h3>
                <input type="range" min={-180} max={180} value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
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

          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {["S", "M", "L", "XL", "XXL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 py-2 text-sm font-semibold border ${size === s ? "bg-foreground text-background border-foreground" : "border-border"}`}
                >{s}</button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base tee</span>
              <span>{formatPrice(BASE_PRICE)}</span>
            </div>
            {graphic && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custom print</span>
                <span className="text-accent">+{formatPrice(CUSTOM_PRINT_SURCHARGE)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            disabled={saving || !graphic}
            onClick={handleAddToCart}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold disabled:opacity-50 hover:bg-accent/90 transition"
          >
            <ShoppingBag className="h-4 w-4" /> {saving ? "Saving…" : "Add Custom Tee to Bag"}
          </button>

          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              <Link to="/auth" className="text-accent underline">Sign in</Link> to save your design and order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
