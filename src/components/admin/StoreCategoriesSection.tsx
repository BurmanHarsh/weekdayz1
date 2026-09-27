import { useEffect, useState } from "react";
import {
  fetchLocalCategories,
  saveLocalCategories,
  getStoreCategoriesServer,
  saveStoreCategoriesServer,
  StoreCategory,
  DEFAULT_CATEGORIES,
} from "@/lib/categories";
import { uploadProductImage } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
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
  ArrowUp,
  ArrowDown,
  Layers,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StoreCategoriesSection() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [editingCat, setEditingCat] = useState<StoreCategory | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const qc = useQueryClient();
  const getCategoriesServerFn = useServerFn(getStoreCategoriesServer);
  const saveCategoriesServerFn = useServerFn(saveStoreCategoriesServer);
  const uploadImageServerFn = useServerFn(uploadProductImage);

  useEffect(() => {
    setCategories(fetchLocalCategories());
    getCategoriesServerFn()
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setCategories(serverData);
          saveLocalCategories(serverData);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAll = async (updated: StoreCategory[]) => {
    setCategories(updated);
    saveLocalCategories(updated);
    setSaving(true);
    try {
      const res = await saveCategoriesServerFn({ data: updated });
      if (res && !res.ok) {
        toast.warning("Saved locally, but server sync reported: " + (res.error || "failed"));
      } else {
        toast.success("Categories updated & synced to live store!");
      }
      qc.invalidateQueries({ queryKey: ["store-categories"] });
    } catch (e: any) {
      toast.warning("Saved to local browser. Server sync issue: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    );
    handleSaveAll(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleSaveAll(updated);
  };

  const handleDelete = (id: string) => {
    if (categories.length <= 1) {
      toast.error("You must have at least one category");
      return;
    }
    const updated = categories.filter((c) => c.id !== id);
    handleSaveAll(updated);
    toast.success("Category removed");
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all categories to original defaults?")) {
      handleSaveAll(DEFAULT_CATEGORIES);
      toast.info("Reset categories to default");
    }
  };

  const handleEditInlineLabel = (id: string, newLabel: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, label: newLabel } : c))
    );
  };

  const handleCommitInlineLabel = () => {
    handleSaveAll(categories);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !editingCat) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let uploadedUrl = "";
      try {
        const res = await uploadImageServerFn({
          data: {
            base64,
            filename: `category-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
            contentType: file.type || "image/png",
          },
        });
        if (res?.url) uploadedUrl = res.url;
      } catch (err) {
        console.warn("Server upload failed, using local Data URL fallback:", err);
      }

      setEditingCat((prev) => (prev ? { ...prev, img: uploadedUrl || base64 } : null));
      toast.success("Image selected!");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    if (!editingCat.label.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (isNew) {
      handleSaveAll([...categories, editingCat]);
    } else {
      handleSaveAll(categories.map((c) => (c.id === editingCat.id ? editingCat : c)));
    }
    setEditingCat(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight">Browse by Category Circles</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Control the categories shown on the homepage under "BROWSE BY CATEGORY". You can rename category titles, change images, reorder them, or toggle visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Defaults
          </button>
          <button
            onClick={() => {
              setIsNew(true);
              setEditingCat({
                id: `cat-${Date.now()}`,
                label: "New Category",
                img: DEFAULT_CATEGORIES[0].img,
                to: "/shop",
                is_active: true,
              });
            }}
            className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-wider font-bold shadow hover:bg-accent/90 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className={cn(
              "border bg-card p-4 transition-all relative flex flex-col justify-between",
              cat.is_active ? "border-border" : "border-border/50 opacity-60 bg-muted/20"
            )}
          >
            {/* Top row controls */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 hover:bg-secondary disabled:opacity-30 rounded text-muted-foreground"
                  title="Move left/up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === categories.length - 1}
                  className="p-1 hover:bg-secondary disabled:opacity-30 rounded text-muted-foreground"
                  title="Move right/down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(cat.id)}
                  className="p-1 hover:bg-secondary rounded text-muted-foreground"
                  title={cat.is_active ? "Hide on homepage" : "Show on homepage"}
                >
                  {cat.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Category circle preview & title */}
            <div className="flex flex-col items-center text-center my-2">
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-border/80 shadow-md bg-muted/40 mb-3 group cursor-pointer"
                onClick={() => {
                  setIsNew(false);
                  setEditingCat({ ...cat });
                }}
                title="Click to edit image & settings"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold uppercase">
                  Edit
                </div>
              </div>

              {/* Inline editable label */}
              <div className="w-full">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={cat.label}
                  onChange={(e) => handleEditInlineLabel(cat.id, e.target.value)}
                  onBlur={handleCommitInlineLabel}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full border border-border bg-background px-2.5 py-1.5 text-xs text-center font-black uppercase tracking-wider outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div className="text-[11px] text-muted-foreground font-mono mt-1.5 truncate max-w-full">
                {cat.to}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditingCat({ ...cat });
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-foreground hover:text-accent transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Full Edit
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4">
              {isNew ? "Add Category" : `Edit Category: ${editingCat.label}`}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                  Category Name (Display Text) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.label}
                  onChange={(e) => setEditingCat({ ...editingCat, label: e.target.value })}
                  placeholder="e.g. TEES, OVERSIZED, HOODIES..."
                  className="w-full border border-border bg-background px-3 py-2 text-sm font-bold uppercase outline-none focus:border-foreground"
                />
              </div>

              {/* Circle Image Preview + Upload */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                  Circle Image *
                </label>
                <div className="flex items-center gap-4 border border-border p-3 bg-background">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-border shadow-inner shrink-0 bg-muted/30">
                    {editingCat.img ? (
                      <img src={editingCat.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">None</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-secondary cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? "Uploading…" : "Upload New Image"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Square / transparent PNG recommended for clean circle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Destination URL */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                  Destination Link
                </label>
                <input
                  type="text"
                  value={editingCat.to}
                  onChange={(e) => setEditingCat({ ...editingCat, to: e.target.value })}
                  placeholder="/shop or /collections/couple"
                  className="w-full border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-foreground"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={editingCat.is_active}
                  onChange={(e) => setEditingCat({ ...editingCat, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="cat-active" className="text-xs font-semibold cursor-pointer">
                  Show this category on homepage
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-accent text-accent-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider shadow hover:bg-accent/90 transition-all"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
