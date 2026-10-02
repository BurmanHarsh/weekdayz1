import React, { useEffect, useState } from "react";
import {
  fetchLocalMockupColors,
  saveLocalMockupColors,
  getMockupSettingsServer,
  saveMockupSettingsServer,
  MockupColor,
  DEFAULT_MOCKUP_COLORS,
} from "@/lib/mockups";
import {
  fetchLocalStudioConfig,
  saveLocalStudioConfig,
  getStudioConfigServer,
  saveStudioConfigServer,
  CustomStudioConfig,
  GarmentCatalogItem,
  StudioRates,
  DEFAULT_STUDIO_CONFIG,
  DEFAULT_STUDIO_RATES,
  DEFAULT_CATALOGS,
} from "@/lib/studio-config";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  Image as ImageIcon,
  DollarSign,
  Shirt,
  Tag,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Compress a File to a WebP Blob (falls back to JPEG). Used before Supabase storage uploads. */
function compressFileToBlob(
  file: File,
  maxDim = 1400,
  quality = 0.82,
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({ blob: file, ext: file.name.split(".").pop() || "jpg", contentType: file.type });
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve({ blob, ext: "webp", contentType: "image/webp" });
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob && jpegBlob.size < file.size) {
                    resolve({ blob: jpegBlob, ext: "jpg", contentType: "image/jpeg" });
                  } else {
                    resolve({ blob: file, ext: file.name.split(".").pop() || "jpg", contentType: file.type });
                  }
                },
                "image/jpeg",
                quality,
              );
            }
          },
          "image/webp",
          quality,
        );
      } catch {
        resolve({ blob: file, ext: file.name.split(".").pop() || "jpg", contentType: file.type });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    img.src = objectUrl;
  });
}

export default function MockupsAndColorsSection() {
  const [subTab, setSubTab] = useState<"catalogs" | "rates" | "colors">("catalogs");

  // Studio Config (Catalogs & Rates)
  const [studioConfig, setStudioConfig] = useState<CustomStudioConfig>(() => fetchLocalStudioConfig());
  const [ratesForm, setRatesForm] = useState<StudioRates>(() => fetchLocalStudioConfig().rates);
  const [savingRates, setSavingRates] = useState(false);

  // Catalog Edit / Create state
  const [editingCatalog, setEditingCatalog] = useState<GarmentCatalogItem | null>(null);
  const [isNewCatalog, setIsNewCatalog] = useState(false);
  const [uploadingCatalogImg, setUploadingCatalogImg] = useState(false);

  // Mockup Colors state
  const [colors, setColors] = useState<MockupColor[]>([]);
  const [editingColor, setEditingColor] = useState<MockupColor | null>(null);
  const [isNewColor, setIsNewColor] = useState(false);
  const [uploadingSide, setUploadingSide] = useState<"front" | "back" | "sleeve" | null>(null);

  // Server functions
  const getStudioConfigServerFn = useServerFn(getStudioConfigServer);
  const saveStudioConfigServerFn = useServerFn(saveStudioConfigServer);
  const getMockupSettingsServerFn = useServerFn(getMockupSettingsServer);
  const saveMockupSettingsServerFn = useServerFn(saveMockupSettingsServer);

  // Initial load
  useEffect(() => {
    // Load studio config
    setStudioConfig(fetchLocalStudioConfig());
    setRatesForm(fetchLocalStudioConfig().rates);
    getStudioConfigServerFn()
      .then((data) => {
        if (data && data.catalogs && data.catalogs.length > 0) {
          setStudioConfig(data);
          setRatesForm(data.rates);
          saveLocalStudioConfig(data);
        }
      })
      .catch(() => {});

    // Load colors
    setColors(fetchLocalMockupColors());
    getMockupSettingsServerFn()
      .then((serverData) => {
        if (serverData && serverData.length > 0) {
          setColors(serverData);
          saveLocalMockupColors(serverData);
        }
      })
      .catch(() => {});
  }, []);

  // Persist Studio Config
  const persistStudioConfig = async (nextConfig: CustomStudioConfig) => {
    setStudioConfig(nextConfig);
    setRatesForm(nextConfig.rates);
    saveLocalStudioConfig(nextConfig);
    try {
      await saveStudioConfigServerFn({ data: nextConfig });
      toast.success("Studio catalogs & rates updated successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Saved locally; server sync pending.");
    }
  };

  // Persist Colors
  const persistColors = async (next: MockupColor[]) => {
    setColors(next);
    saveLocalMockupColors(next);
    try {
      await saveMockupSettingsServerFn({ data: next });
      toast.success("Mockup & color settings updated!");
    } catch (e: any) {
      toast.error(e?.message || "Saved locally; server sync pending.");
    }
  };

  // ── RATES HANDLERS ──
  const handleSaveRates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingRates(true);
    try {
      const nextConfig: CustomStudioConfig = {
        ...studioConfig,
        rates: { ...ratesForm },
      };
      await persistStudioConfig(nextConfig);
    } finally {
      setSavingRates(false);
    }
  };

  const handleResetRates = async () => {
    if (confirm("Reset studio rates back to system defaults?")) {
      setRatesForm(DEFAULT_STUDIO_RATES);
      await persistStudioConfig({
        ...studioConfig,
        rates: DEFAULT_STUDIO_RATES,
      });
      toast.success("Rates reset to default.");
    }
  };

  // ── CATALOG HANDLERS ──
  const handleUploadCatalogImage = async (file: File) => {
    if (!editingCatalog) return;
    setUploadingCatalogImg(true);
    try {
      let blob: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";
      let contentType = file.type;
      try {
        const compressed = await compressFileToBlob(file);
        blob = compressed.blob;
        ext = compressed.ext;
        contentType = compressed.contentType;
      } catch (e) {
        console.warn("Compression fallback:", e);
      }

      const filePath = `catalogs/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, blob, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setEditingCatalog({
        ...editingCatalog,
        image: publicUrlData.publicUrl,
      });
      toast.success("Catalog photo uploaded!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingCatalogImg(false);
    }
  };

  const handleSaveCatalog = async () => {
    if (!editingCatalog) return;
    if (!editingCatalog.name.trim()) {
      toast.error("Please enter a catalog name.");
      return;
    }
    if (!editingCatalog.basePrice || editingCatalog.basePrice <= 0) {
      toast.error("Please enter a valid base price.");
      return;
    }

    let nextCatalogs: GarmentCatalogItem[];
    if (isNewCatalog) {
      nextCatalogs = [editingCatalog, ...studioConfig.catalogs];
    } else {
      nextCatalogs = studioConfig.catalogs.map((c) =>
        c.id === editingCatalog.id ? editingCatalog : c,
      );
    }

    await persistStudioConfig({
      ...studioConfig,
      catalogs: nextCatalogs,
    });
    setEditingCatalog(null);
  };

  const handleDeleteCatalog = async (id: string) => {
    if (!confirm("Are you sure you want to remove this T-shirt catalog?")) return;
    const nextCatalogs = studioConfig.catalogs.filter((c) => c.id !== id);
    await persistStudioConfig({
      ...studioConfig,
      catalogs: nextCatalogs,
    });
    toast.success("Catalog removed.");
  };

  const handleToggleCatalogActive = async (id: string) => {
    const nextCatalogs = studioConfig.catalogs.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c,
    );
    await persistStudioConfig({
      ...studioConfig,
      catalogs: nextCatalogs,
    });
  };

  const handleResetCatalogs = async () => {
    if (confirm("Reset all T-shirt catalogs back to system defaults?")) {
      await persistStudioConfig({
        ...studioConfig,
        catalogs: DEFAULT_CATALOGS,
      });
      toast.success("Catalogs reset to defaults.");
    }
  };

  // ── COLOR MOCKUPS HANDLERS ──
  const handleUploadMockup = async (file: File, side: "front" | "back" | "sleeve") => {
    if (!editingColor) return;
    setUploadingSide(side);
    try {
      let blob: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";
      let contentType = file.type;
      try {
        const compressed = await compressFileToBlob(file);
        blob = compressed.blob;
        ext = compressed.ext;
        contentType = compressed.contentType;
      } catch (e) {
        console.warn("Compression fallback:", e);
      }

      const filePath = `mockups/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, blob, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const field =
        side === "front" ? "frontMockup" : side === "back" ? "backMockup" : "sleeveMockup";

      setEditingColor({
        ...editingColor,
        [field]: publicUrlData.publicUrl,
      });
      toast.success(`${side.toUpperCase()} mockup uploaded!`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to upload mockup image.");
    } finally {
      setUploadingSide(null);
    }
  };

  const handleSaveColor = async () => {
    if (!editingColor) return;
    if (!editingColor.name.trim()) {
      toast.error("Color name is required");
      return;
    }

    let next: MockupColor[];
    if (isNewColor) {
      next = [...colors, editingColor];
    } else {
      next = colors.map((c) => (c.id === editingColor.id ? editingColor : c));
    }
    await persistColors(next);
    setEditingColor(null);
  };

  const handleDeleteColor = async (id: string) => {
    if (colors.length <= 1) {
      toast.error("You must keep at least 1 color available.");
      return;
    }
    if (!confirm("Are you sure you want to delete this color?")) return;
    const next = colors.filter((c) => c.id !== id);
    await persistColors(next);
    toast.success("Color removed");
  };

  const handleToggleColorActive = async (id: string) => {
    const next = colors.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    await persistColors(next);
  };

  const handleResetColorDefaults = async () => {
    if (confirm("Reset all mockup colors back to system defaults?")) {
      await persistColors(DEFAULT_MOCKUP_COLORS);
      toast.success("Reset to default colors.");
    }
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
            Custom Product Studio
          </span>
          <h2 className="text-display text-3xl sm:text-4xl font-black mt-1">
            "Create Your Own" Studio Config
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage T-shirt catalogs and upload multi-angle mockup images.
          </p>
        </div>

        {/* Studio Subtab Navigator */}
        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: "catalogs", label: "🏷️ T-Shirt Catalogs", count: studioConfig.catalogs.length },
            { id: "colors", label: "🎨 Mockups & Colors", count: colors.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5",
                subTab === t.id
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                  subTab === t.id ? "bg-background text-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: T-SHIRT CATALOGS ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === "catalogs" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 border border-border p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                T-Shirt &amp; Garment Catalogs ({studioConfig.catalogs.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload new styles, set base prices, and configure available sizes for the custom design studio.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCatalogs}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-secondary rounded-lg transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
              </button>

              <button
                onClick={() => {
                  setIsNewCatalog(true);
                  setEditingCatalog({
                    id: "cat-" + crypto.randomUUID().slice(0, 8),
                    name: "",
                    category: "T-Shirts",
                    basePrice: studioConfig.rates.defaultBasePrice || 189900,
                    image: "/products/tee-black.jpg",
                    description: "240 GSM 100% Combed Terry Cotton. Premium streetwear boxy fit.",
                    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
                    isActive: true,
                    badge: "New Drop",
                  });
                }}
                className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-black uppercase tracking-wider hover:opacity-90 rounded-lg transition-opacity shadow-md"
              >
                <Plus className="h-4 w-4" /> Upload New T-Shirt Catalog
              </button>
            </div>
          </div>

          {/* Catalogs Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioConfig.catalogs.map((catalog) => (
              <div
                key={catalog.id}
                className={cn(
                  "bg-card border rounded-2xl overflow-hidden p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between",
                  catalog.isActive
                    ? "border-border hover:border-foreground/40"
                    : "border-dashed border-border/60 opacity-60",
                )}
              >
                <div className="space-y-4">
                  {/* Top: Image Preview & Badge */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary/30 border border-border p-2 flex items-center justify-center">
                    {catalog.image ? (
                      <img
                        src={catalog.image}
                        alt={catalog.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}

                    {catalog.badge && (
                      <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        {catalog.badge}
                      </span>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border">
                      <button
                        onClick={() => handleToggleCatalogActive(catalog.id)}
                        title={catalog.isActive ? "Deactivate" : "Activate"}
                        className="p-1 hover:text-foreground text-muted-foreground"
                      >
                        {catalog.isActive ? (
                          <Eye className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsNewCatalog(false);
                          setEditingCatalog({ ...catalog });
                        }}
                        title="Edit Catalog"
                        className="p-1 hover:text-foreground text-muted-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCatalog(catalog.id)}
                        title="Delete Catalog"
                        className="p-1 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Price Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black uppercase tracking-wider text-foreground">
                        {catalog.name}
                      </h4>
                      <span className="text-sm font-black text-accent">
                        {formatPrice(catalog.basePrice)}
                      </span>
                    </div>
                    {catalog.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {catalog.category}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {catalog.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {catalog.description}
                    </p>
                  )}

                  {/* Sizes */}
                  <div className="pt-2 border-t border-border flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mr-1">
                      Sizes:
                    </span>
                    {catalog.sizes && catalog.sizes.length > 0 ? (
                      catalog.sizes.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-mono font-bold rounded"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">None specified</span>
                    )}
                  </div>
                </div>


              </div>
            ))}
          </div>

          {/* ── MODAL: EDIT / CREATE T-SHIRT CATALOG ── */}
          {editingCatalog && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-black">
                      {isNewCatalog ? "Upload New T-Shirt Catalog" : "Edit T-Shirt Catalog"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure the garment style name, base rate, photo catalog, and available sizing.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-secondary px-2.5 py-1 rounded">
                    {formatPrice(editingCatalog.basePrice)}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Photo Upload Zone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                      Catalog Cover Photo / Mockup *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-secondary/20 p-2 flex items-center justify-center relative overflow-hidden group">
                        {editingCatalog.image ? (
                          <img
                            src={editingCatalog.image}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                            <span className="text-xs text-muted-foreground font-semibold">
                              No image selected
                            </span>
                          </div>
                        )}

                        {uploadingCatalogImg && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-white font-bold">
                            Uploading image to server…
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="cursor-pointer flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-opacity shadow w-full">
                          <Upload className="h-4 w-4" />
                          <span>{uploadingCatalogImg ? "Uploading…" : "Upload T-Shirt Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadCatalogImage(f);
                            }}
                          />
                        </label>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                            Or Image URL / Path:
                          </label>
                          <input
                            type="text"
                            placeholder="/products/tee-black.jpg or https://..."
                            value={editingCatalog.image}
                            onChange={(e) =>
                              setEditingCatalog({ ...editingCatalog, image: e.target.value })
                            }
                            className="w-full border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-foreground rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Name and Base Price */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Catalog Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acid Wash Boxy Tee"
                        value={editingCatalog.name}
                        onChange={(e) =>
                          setEditingCatalog({ ...editingCatalog, name: e.target.value })
                        }
                        className="w-full border border-border bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Base Rate (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="1"
                          placeholder="1899"
                          value={Math.round(editingCatalog.basePrice / 100)}
                          onChange={(e) =>
                            setEditingCatalog({
                              ...editingCatalog,
                              basePrice: (parseInt(e.target.value) || 0) * 100,
                            })
                          }
                          className="w-full pl-7 pr-3 py-2.5 border border-border bg-background text-xs font-bold outline-none focus:border-foreground rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category & Badge */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Category
                      </label>
                      <select
                        value={editingCatalog.category || "T-Shirts"}
                        onChange={(e) =>
                          setEditingCatalog({ ...editingCatalog, category: e.target.value })
                        }
                        className="w-full border border-border bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-foreground rounded-lg"
                      >
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Polos">Polos</option>
                        <option value="Hoodies">Hoodies</option>
                        <option value="Sweatshirts">Sweatshirts</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Badge (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bestseller, 240 GSM"
                        value={editingCatalog.badge || ""}
                        onChange={(e) =>
                          setEditingCatalog({ ...editingCatalog, badge: e.target.value })
                        }
                        className="w-full border border-border bg-background px-3 py-2.5 text-xs font-semibold outline-none focus:border-foreground rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Description / Fabric details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Fabric &amp; Fitting Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 240 GSM 100% Combed Terry Cotton. Drop shoulder boxy streetwear fit."
                      value={editingCatalog.description || ""}
                      onChange={(e) =>
                        setEditingCatalog({ ...editingCatalog, description: e.target.value })
                      }
                      className="w-full border border-border bg-background p-3 text-xs outline-none focus:border-foreground rounded-lg"
                    />
                  </div>

                  {/* Available Sizes selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                      Available Sizes for this Catalog
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SIZES.map((sz) => {
                        const isSelected = editingCatalog.sizes?.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              const current = editingCatalog.sizes || [];
                              const updated = isSelected
                                ? current.filter((s) => s !== sz)
                                : [...current, sz];
                              setEditingCatalog({ ...editingCatalog, sizes: updated });
                            }}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold border rounded-lg transition-all",
                              isSelected
                                ? "bg-foreground text-background border-foreground shadow"
                                : "bg-background border-border text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Switch */}
                  <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={editingCatalog.isActive}
                      onChange={(e) =>
                        setEditingCatalog({ ...editingCatalog, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-foreground"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Active (Visible to customers in the Studio)
                    </span>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingCatalog(null)}
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-border hover:bg-secondary rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCatalog}
                    className="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-foreground text-background hover:opacity-90 rounded-lg transition-opacity shadow-lg"
                  >
                    Save Catalog
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: MOCKUP COLORS & ANGLES ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {subTab === "colors" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 border border-border p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Mockup Colors &amp; Multi-Angle Images ({colors.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Dynamically add colors and upload Front, Back, and Side Sleeve mockups for the "Create Your Own" studio.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetColorDefaults}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-secondary rounded-lg transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Defaults
              </button>
              <button
                onClick={() => {
                  setIsNewColor(true);
                  setEditingColor({
                    id: "color-" + crypto.randomUUID().slice(0, 8),
                    name: "",
                    hex: "#333333",
                    frontMockup: "/products/tee-black.jpg",
                    backMockup: "/products/tee-black.jpg",
                    sleeveMockup: "/products/tee-black.jpg",
                    isActive: true,
                  });
                }}
                className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-black uppercase tracking-wider hover:opacity-90 rounded-lg transition-opacity shadow-md"
              >
                <Plus className="h-4 w-4" /> Add New Color
              </button>
            </div>
          </div>

          {/* Colors Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {colors.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition-all relative",
                  c.isActive
                    ? "border-border hover:border-foreground/40"
                    : "border-dashed border-border/60 opacity-65",
                )}
              >
                {/* Header: Color Swatch + Name + Hex */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full border-2 border-border shadow-inner flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">{c.name}</h3>
                      <span className="text-xs text-muted-foreground font-mono">{c.hex}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleColorActive(c.id)}
                      title={c.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {c.isActive ? (
                        <Eye className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsNewColor(false);
                        setEditingColor({ ...c });
                      }}
                      title="Edit Mockups & Color"
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteColor(c.id)}
                      title="Delete Color"
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Mockup Previews for Front, Back, Sleeve */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  {[
                    { label: "Front", src: c.frontMockup },
                    { label: "Back", src: c.backMockup },
                    { label: "Sleeve", src: c.sleeveMockup },
                  ].map((m) => (
                    <div key={m.label} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30 p-1 flex items-center justify-center">
                        {m.src ? (
                          <img
                            src={m.src}
                            alt={m.label}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── EDIT / CREATE COLOR MODAL ── */}
          {editingColor && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-xl font-black">
                      {isNewColor ? "Add New Garment Color" : "Edit Color & Mockups"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure color name, hex code, and view images for Front, Back, and Side Sleeve.
                    </p>
                  </div>
                  <div
                    className="h-8 w-8 rounded-full border-2 border-border shadow"
                    style={{ backgroundColor: editingColor.hex }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Color Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Forest Green"
                      value={editingColor.name}
                      onChange={(e) =>
                        setEditingColor({ ...editingColor, name: e.target.value })
                      }
                      className="w-full border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-foreground rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      HEX Value *
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={editingColor.hex}
                        onChange={(e) =>
                          setEditingColor({ ...editingColor, hex: e.target.value })
                        }
                        className="h-9 w-10 border border-border rounded cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#111111"
                        value={editingColor.hex}
                        onChange={(e) =>
                          setEditingColor({ ...editingColor, hex: e.target.value })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-xs font-mono font-semibold outline-none focus:border-foreground rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Mockup Uploads */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Mockup Coverage: 3 Angles
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(["front", "back", "sleeve"] as const).map((side) => {
                      const currentSrc =
                        side === "front"
                          ? editingColor.frontMockup
                          : side === "back"
                          ? editingColor.backMockup
                          : editingColor.sleeveMockup;

                      return (
                        <div
                          key={side}
                          className="border border-border p-3 rounded-xl bg-background text-center space-y-2"
                        >
                          <div className="text-xs font-black uppercase tracking-wider text-foreground">
                            {side === "sleeve" ? "Side Sleeve" : `${side.toUpperCase()} View`}
                          </div>

                          <div className="aspect-square w-full rounded-lg bg-secondary/40 border border-border overflow-hidden flex items-center justify-center relative group">
                            {currentSrc ? (
                              <img
                                src={currentSrc}
                                alt={side}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                            {uploadingSide === side && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                                Uploading…
                              </div>
                            )}
                          </div>

                          <label className="cursor-pointer inline-flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors w-full justify-center">
                            <Upload className="h-3 w-3" />
                            <span>Upload {side}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadMockup(file, side);
                              }}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingColor(null)}
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-border hover:bg-secondary rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveColor}
                    className="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-foreground text-background hover:opacity-90 rounded-lg transition-opacity shadow-lg"
                  >
                    Save Color &amp; Mockups
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
