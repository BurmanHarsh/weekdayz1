import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  ShoppingBag,
  RotateCw,
  Maximize2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Box,
  Type,
  Image as ImageIcon,
  Plus,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart-store";
import { createDesign, getDesignById } from "@/lib/designs.functions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SizeChartModal } from "@/components/shop/SizeChartModal";
import { TShirt3DPreviewModal } from "@/components/shop/TShirt3DPreviewModal";
import { TShirtMockup, getTShirtSvgDataUrl } from "@/components/shop/TShirtMockup";

const BASE_PRICE = 1899_00 / 100 * 100; // base tee 1899
const CUSTOM_PRINT_SURCHARGE = 20000; // ₹200 in paise/cents

export const COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy Blue", hex: "#162238" },
  { name: "Black", hex: "#121212" },
  { name: "Off White", hex: "#F3EBDD" },
];

export const GARMENT_TYPES = [
  "Oversized Tees",
  "Baby Tees",
  "Polo Tees",
  "Regular Fit",
  "Hoodies",
  "Sweatshirts",
];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const FONTS = [
  { label: "Sans Bold", value: "Inter, sans-serif" },
  { label: "Streetwear Gothic", value: "'Space Grotesk', sans-serif" },
  { label: "Impact Display", value: "Impact, sans-serif" },
  { label: "Classic Serif", value: "Georgia, serif" },
  { label: "Monospace Code", value: "Courier New, monospace" },
];

const TEXT_COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3333",
  "#FFD700",
  "#00E5FF",
  "#A855F7",
  "#22C55E",
];

export interface DesignLayer {
  id: string;
  type: "image" | "text";
  side: "Front" | "Back";
  // Image specific
  file?: File;
  previewUrl: string;
  rawPath?: string;
  // Text specific
  text?: string;
  fontFamily?: string;
  fillColor?: string;
  // Transform
  x: number;
  y: number;
  scale: number;
  rotate: number;
  zIndex: number;
}

const PRINT_COSTS = [
  { label: "Front Chest Print (Small)", price: 9900 },
  { label: "Front Full Print (A3)", price: 19900 },
  { label: "Back Full Print (A3)", price: 19900 },
  { label: "Sleeve Print", price: 5900 },
];

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    designId: (search.designId as string) || undefined,
    cartKey: (search.cartKey as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Design Your Own Tee | WEEKDAYZZ" },
      { name: "description", content: "Upload graphics, add custom text, switch front/back sides. Print your vibe with WEEKDAYZZ." },
      { property: "og:title", content: "Create Your Own — WEEKDAYZZ" },
      { property: "og:description", content: "Design your own custom tee. Drag, rotate, scale, print." },
    ],
  }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { designId, cartKey } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const updateCartItem = useCart((s) => s.updateItem);
  const cartItems = useCart((s) => s.items);

  const createDesignFn = useServerFn(createDesign);
  const getDesignByIdFn = useServerFn(getDesignById);

  const [color, setColor] = useState(COLORS[0]);
  const [garment, setGarment] = useState(GARMENT_TYPES[0]);
  const [size, setSize] = useState("L");
  const [printSide, setPrintSide] = useState<"Front" | "Back">("Front");

  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Text Tool inputs
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [newText, setNewText] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [selectedTextColor, setSelectedTextColor] = useState("#FFFFFF");

  const [saving, setSaving] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [preview3D, setPreview3D] = useState(false);

  const [frontCompositeBlobUrl, setFrontCompositeBlobUrl] = useState<string | undefined>();
  const [backCompositeBlobUrl, setBackCompositeBlobUrl] = useState<string | undefined>();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load existing design for re-editing if designId or cartKey is provided
  useEffect(() => {
    async function loadSavedDesign() {
      if (cartKey) {
        const item = cartItems.find((i) => i.key === cartKey);
        if (item && item.designConfig) {
          if (item.color) {
            const foundColor = COLORS.find((c) => c.name.toLowerCase() === item.color?.toLowerCase());
            if (foundColor) setColor(foundColor);
          }
          if (item.size) setSize(item.size);
          if (item.designConfig.layers) setLayers(item.designConfig.layers);
          return;
        }
      }

      if (designId && user) {
        setLoadingDesign(true);
        try {
          const row = await getDesignByIdFn({ data: { id: designId } });
          if (row) {
            const settings = row.placement_settings as any;
            if (settings) {
              if (settings.garment) setGarment(settings.garment);
              if (settings.size) setSize(settings.size);
              if (settings.colorName) {
                const c = COLORS.find((col) => col.name === settings.colorName);
                if (c) setColor(c);
              }
              if (Array.isArray(settings.layers)) {
                setLayers(settings.layers);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load saved design", e);
        } finally {
          setLoadingDesign(false);
        }
      }
    }
    loadSavedDesign();
  }, [designId, cartKey, user]);

  const sideLayers = layers.filter((l) => l.side === printSide);
  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  // File Upload Dropzone
  const onDrop = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Max file size is 8MB");
      return;
    }
    const previewUrl = URL.createObjectURL(f);
    const newLayer: DesignLayer = {
      id: crypto.randomUUID(),
      type: "image",
      side: printSide,
      file: f,
      previewUrl,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      zIndex: layers.length + 1,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success(`Image added to ${printSide} print`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: true,
  });

  const handleAddTextLayer = () => {
    if (!newText.trim()) {
      toast.error("Please enter text first");
      return;
    }
    const newLayer: DesignLayer = {
      id: crypto.randomUUID(),
      type: "text",
      side: printSide,
      previewUrl: "",
      text: newText.trim(),
      fontFamily: selectedFont,
      fillColor: selectedTextColor,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      zIndex: layers.length + 1,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setNewText("");
    toast.success(`Text added to ${printSide} print`);
  };

  const updateActiveLayer = (updates: Partial<DesignLayer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    );
  };

  const removeActiveLayer = () => {
    if (!selectedLayerId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
  };

  const hasGraphics = layers.length > 0;
  const total = BASE_PRICE + (hasGraphics ? CUSTOM_PRINT_SURCHARGE : 0);

  // Generate Composite Canvas Image Blob for a specific side (Front / Back)
  const generateSideCompositeBlob = async (side: "Front" | "Back"): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = 800;
      canvas.height = 800;

      // Draw base color backdrop
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 800, 800);

      // Draw T-shirt texture mockup image
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.src = getTShirtSvgDataUrl(color.hex, side);

      baseImg.onload = async () => {
        ctx.drawImage(baseImg, 0, 0, 800, 800);

        const targetSideLayers = layers.filter((l) => l.side === side);
        if (targetSideLayers.length === 0) {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to generate blob"));
          }, "image/png");
          return;
        }

        // Render each layer onto canvas
        for (const layer of targetSideLayers) {
          ctx.save();
          const centerX = 400 + layer.x * 1.5;
          const centerY = 400 + layer.y * 1.5;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotate * Math.PI) / 180);

          if (layer.type === "image" && layer.previewUrl) {
            await new Promise<void>((resImage) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = layer.previewUrl;
              img.onload = () => {
                const baseSize = 200 * layer.scale;
                ctx.drawImage(img, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
                resImage();
              };
              img.onerror = () => resImage();
            });
          } else if (layer.type === "text" && layer.text) {
            const fontSize = Math.round(28 * layer.scale);
            ctx.font = `bold ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
            ctx.fillStyle = layer.fillColor || "#FFFFFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(layer.text, 0, 0);
          }
          ctx.restore();
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate blob"));
        }, "image/png");
      };

      baseImg.onerror = () => reject(new Error("Failed to load base T-shirt mockup"));
    });
  };

  async function handleAddToCart() {
    if (!user) {
      toast.error("Sign in to save your custom design");
      navigate({ to: "/auth" });
      return;
    }
    if (layers.length === 0) {
      toast.error("Add at least one image or text layer first");
      return;
    }

    setSaving(true);
    try {
      // Generate front composite
      const frontBlob = await generateSideCompositeBlob("Front");
      const frontBlobUrl = URL.createObjectURL(frontBlob);
      setFrontCompositeBlobUrl(frontBlobUrl);

      const compositePath = `${user.id}/composite_${crypto.randomUUID()}.png`;

      const { error: upCompErr } = await supabase.storage
        .from("user-graphics")
        .upload(compositePath, frontBlob, { upsert: false, contentType: "image/png" });
      if (upCompErr) throw upCompErr;

      const { data: signedData, error: signedErr } = await supabase.storage
        .from("user-graphics")
        .createSignedUrl(compositePath, 60 * 60 * 24 * 7);
      if (signedErr) throw signedErr;
      const imageUrl = signedData.signedUrl;

      // Upload raw layer images
      const serializedLayers = await Promise.all(
        layers.map(async (layer) => {
          if (layer.type === "image" && layer.file) {
            const ext = layer.file.name.split(".").pop() ?? "png";
            const rawPath = `${user.id}/raw_${crypto.randomUUID()}.${ext}`;
            await supabase.storage
              .from("user-graphics")
              .upload(rawPath, layer.file, { upsert: false, contentType: layer.file.type });
            return { ...layer, file: undefined, rawPath };
          }
          return { ...layer, file: undefined };
        }),
      );

      const placementSettings = {
        garment,
        size,
        colorName: color.name,
        colorHex: color.hex,
        layers: serializedLayers,
      };

      const { id } = await createDesignFn({
        data: {
          design_file_url: compositePath,
          base_color: color.hex,
          placement_settings: placementSettings,
        },
      });

      if (cartKey) {
        // Update existing cart item
        updateCartItem(cartKey, {
          title: `Custom ${garment} · ${color.name}`,
          image: imageUrl,
          size,
          color: color.name,
          unit_price_cents: total,
          custom_design_id: id,
          designConfig: placementSettings,
        });
        toast.success("Updated custom design in BAG!");
      } else {
        // Add new cart item
        addItem({
          custom_design_id: id,
          title: `Custom ${garment} · ${color.name}`,
          image: imageUrl,
          size,
          color: color.name,
          unit_price_cents: total,
          designConfig: placementSettings,
        });
        toast.success("Custom tee added to BAG!");
      }

      navigate({ to: "/cart" });
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
            <h1 className="text-display text-3xl sm:text-4xl font-black">Create Your Own</h1>
            <p className="text-sm text-muted-foreground mt-1">Customise any type of print — Front & Back</p>
          </div>

          {/* 3D Preview Toggle */}
          <button
            onClick={() => setPreview3D(true)}
            className="flex items-center gap-2 border border-border bg-background hover:border-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Box className="h-4 w-4" />
            3D Preview
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── STICKY CANVAS COLUMN ── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Front / Back Side Switcher */}
            <div className="flex justify-between items-center bg-card border border-border p-1.5">
              <div className="flex gap-1">
                {(["Front", "Back"] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => {
                      setPrintSide(side);
                      setSelectedLayerId(null);
                    }}
                    className={cn(
                      "px-6 py-2 text-xs font-black uppercase tracking-widest transition-all",
                      printSide === side
                        ? "bg-foreground text-background"
                        : "bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {side} Side
                  </button>
                ))}
              </div>

              {/* Quick layer count indicator */}
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pr-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {sideLayers.length} {sideLayers.length === 1 ? "Element" : "Elements"}
              </div>
            </div>

            {/* Canvas Outer Preview Box */}
            <div
              ref={canvasRef}
              className="relative border border-border overflow-hidden select-none"
              style={{ aspectRatio: "3/4" }}
              onClick={() => setSelectedLayerId(null)}
            >
              {/* Straight Upright T-Shirt Mockup */}
              <TShirtMockup colorHex={color.hex} side={printSide} className="absolute inset-0 p-4" />

              {/* Side badge */}
              <div className="absolute top-3 left-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-2.5 py-1 z-10 shadow-md">
                {printSide} View
              </div>

              {/* Render Side Layers */}
              {sideLayers.map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <motion.div
                    key={layer.id}
                    drag
                    dragMomentum={false}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                    onDragEnd={(_, info) => {
                      setLayers((prev) =>
                        prev.map((l) =>
                          l.id === layer.id
                            ? { ...l, x: l.x + info.offset.x, y: l.y + info.offset.y }
                            : l,
                        ),
                      );
                    }}
                    style={{
                      x: layer.x,
                      y: layer.y,
                      rotate: layer.rotate,
                      scale: layer.scale,
                      zIndex: layer.zIndex,
                    }}
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing border-2 transition-colors",
                      isSelected ? "border-foreground ring-2 ring-foreground/20 bg-foreground/5" : "border-transparent hover:border-foreground/30",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                  >
                    {layer.type === "image" ? (
                      <img
                        src={layer.previewUrl}
                        alt=""
                        className="w-40 h-40 object-contain pointer-events-none"
                      />
                    ) : (
                      <div
                        className="text-center font-bold px-2 py-1 pointer-events-none whitespace-nowrap"
                        style={{
                          fontFamily: layer.fontFamily,
                          color: layer.fillColor,
                          fontSize: "24px",
                        }}
                      >
                        {layer.text}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Empty state hint */}
              {sideLayers.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                  <div className="bg-background/85 backdrop-blur border border-border p-4 max-w-xs shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                      No graphics on {printSide} side
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Upload an image or add text from the panel to position your design.
                    </p>
                  </div>
                </div>
              )}

              {/* Direct Floating Toolbar over Canvas when a Layer is Selected */}
              {activeLayer && (
                <div className="absolute top-3 right-3 bg-background/95 backdrop-blur border border-border p-1 flex items-center gap-1 shadow-xl z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActiveLayer({ scale: Math.min(2.5, activeLayer.scale + 0.1) });
                    }}
                    title="Scale Up"
                    className="p-2 hover:bg-secondary text-foreground"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActiveLayer({ scale: Math.max(0.3, activeLayer.scale - 0.1) });
                    }}
                    title="Scale Down"
                    className="p-2 hover:bg-secondary text-foreground"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActiveLayer({ rotate: (activeLayer.rotate + 45) % 360 });
                    }}
                    title="Rotate 45°"
                    className="p-2 hover:bg-secondary text-foreground"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeActiveLayer();
                    }}
                    title="Delete Element"
                    className="p-2 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT CONTROLS PANEL ── */}
          <div className="space-y-6">

            {/* Add Content Tabs: Image vs Text */}
            <div className="border border-border bg-card p-4 space-y-4">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("image")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all",
                    activeTab === "image"
                      ? "border-foreground text-foreground font-black"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ImageIcon className="h-4 w-4" /> Upload Image
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all",
                    activeTab === "text"
                      ? "border-foreground text-foreground font-black"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Type className="h-4 w-4" /> Add Text
                </button>
              </div>

              {/* Tab 1: Upload Image */}
              {activeTab === "image" && (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed p-6 text-center cursor-pointer transition-all bg-background",
                    isDragActive ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/50",
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-6 w-6 mx-auto mb-2 text-foreground" />
                  <p className="text-xs font-bold uppercase tracking-wider">Drop or Select Images</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Add multiple graphics to Front or Back. PNG / JPG max 8MB.
                  </p>
                </div>
              )}

              {/* Tab 2: Custom Text Tool */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter custom slogan or phrase..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-foreground font-medium"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                        Font Style
                      </label>
                      <select
                        value={selectedFont}
                        onChange={(e) => setSelectedFont(e.target.value)}
                        className="w-full border border-border bg-background p-2 text-xs font-semibold outline-none"
                      >
                        {FONTS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                        Color
                      </label>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedTextColor(c)}
                            className={cn(
                              "h-5 w-5 rounded-full border transition-all",
                              selectedTextColor === c ? "scale-125 border-foreground shadow" : "border-border",
                            )}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddTextLayer}
                    className="w-full bg-foreground text-background py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" /> Add Text to {printSide}
                  </button>
                </div>
              )}
            </div>

            {/* Active Layer Fine-Tuning Transform Panel */}
            {activeLayer && (
              <div className="border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Transforming Selected {activeLayer.type}
                  </span>
                  <button
                    onClick={removeActiveLayer}
                    className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>

                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span><Maximize2 className="h-3 w-3 inline mr-1" /> Scale</span>
                    <span>{activeLayer.scale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    value={activeLayer.scale}
                    onChange={(e) => updateActiveLayer({ scale: Number(e.target.value) })}
                    className="w-full accent-foreground cursor-pointer"
                  />
                </div>

                {/* Rotation Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span><RotateCw className="h-3 w-3 inline mr-1" /> Rotation</span>
                    <span>{activeLayer.rotate}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={5}
                    value={activeLayer.rotate}
                    onChange={(e) => updateActiveLayer({ rotate: Number(e.target.value) })}
                    className="w-full accent-foreground cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Garment Selection */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
                Garment Type
              </label>
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

            {/* Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Color</span>
                <span className="text-xs font-semibold">{color.name}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c)}
                    title={c.name}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                      color.name === c.name ? "border-foreground scale-110 shadow-md ring-2 ring-foreground/20" : "border-border hover:border-foreground/50",
                    )}
                    style={{ background: c.hex }}
                  >
                    {color.name === c.name && (
                      <Check className={cn("h-4 w-4", c.hex === "#FAFAFA" || c.hex === "#F5F0E8" || c.hex === "#D4C4B5" ? "text-black" : "text-white")} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector + Size Chart Modal Button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Size</span>
                <button
                  onClick={() => setSizeChartOpen(true)}
                  className="text-[10px] font-bold uppercase tracking-widest text-foreground underline hover:opacity-80"
                >
                  Size Chart
                </button>
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
                        : "border-border hover:border-foreground/50 bg-background",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Cost Breakdown Accordion */}
            <div className="border border-border">
              <button
                onClick={() => setCostOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                <span>Print Cost Breakdown</span>
                {costOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {costOpen && (
                <div className="border-t border-border divide-y divide-border bg-card">
                  {PRINT_COSTS.map((p) => (
                    <div key={p.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">{p.label}</span>
                      <span className="text-xs font-bold">{formatPrice(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Summary Box */}
            <div className="bg-secondary/50 border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base {garment}</span>
                <span className="font-semibold">{formatPrice(BASE_PRICE)}</span>
              </div>
              {hasGraphics && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custom Printing</span>
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
                <Link to="/auth" className="text-foreground underline font-bold">Sign in</Link> to save your custom tee.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY FOOTER CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 shadow-2xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              Base {formatPrice(BASE_PRICE)} {hasGraphics ? `+ Print ${formatPrice(CUSTOM_PRINT_SURCHARGE)}` : ""}
            </span>
            <span className="font-black text-lg">{formatPrice(total)}</span>
          </div>

          <button
            disabled={saving || layers.length === 0}
            onClick={handleAddToCart}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 text-xs uppercase tracking-widest font-bold disabled:opacity-40 hover:opacity-85 transition-all shadow-lg"
          >
            <ShoppingBag className="h-4 w-4" />
            {saving ? "Saving Custom Design…" : cartKey ? "Update Custom Tee in BAG" : "Add Custom Tee to BAG"}
          </button>
        </div>
      </div>

      {/* Modals */}
      <SizeChartModal
        open={sizeChartOpen}
        onOpenChange={setSizeChartOpen}
        defaultGarment={garment}
      />

      <TShirt3DPreviewModal
        open={preview3D}
        onOpenChange={setPreview3D}
        frontCompositeUrl={frontCompositeBlobUrl}
        backCompositeUrl={backCompositeBlobUrl}
        baseColor={color.hex}
        garmentType={garment}
      />
    </div>
  );
}
