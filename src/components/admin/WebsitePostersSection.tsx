import { useEffect, useState } from "react";
import {
  fetchWebsitePosters,
  saveWebsitePosters,
  getWebsitePostersServer,
  saveWebsitePostersServer,
  WebsitePoster,
} from "@/lib/posters";
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
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Resize a base64 data URL down to fit within `maxDim` on its longest side,
 * re-encoded as JPEG with the given quality. Returns the original if the
 * browser can't decode it (e.g. HEIC without support).
 */
function compressDataUrl(dataUrl: string, maxDim = 1280, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function WebsitePostersSection() {
  const [posters, setPosters] = useState<WebsitePoster[]>([]);
  const [editingPoster, setEditingPoster] = useState<WebsitePoster | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const qc = useQueryClient();
  const getPostersServerFn = useServerFn(getWebsitePostersServer);
  const savePostersServerFn = useServerFn(saveWebsitePostersServer);
  const uploadImageServerFn = useServerFn(uploadProductImage);

  useEffect(() => {
    setPosters(fetchWebsitePosters());
    // Also fetch from server to get latest synced version across all devices
    getPostersServerFn()
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setPosters(serverData);
          saveWebsitePosters(serverData);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAll = async (newPosters: WebsitePoster[]) => {
    setPosters(newPosters);
    saveWebsitePosters(newPosters);
    try {
      await savePostersServerFn({ data: newPosters });
      qc.invalidateQueries({ queryKey: ["website-posters"] });
    } catch (e) {
      console.warn("Server save error:", e);
    }
    toast.success("Website posters updated & synced across all devices!");
  };

  const handleToggleActive = (id: string) => {
    const updated = posters.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p));
    handleSaveAll(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this poster?")) return;
    const updated = posters.filter((p) => p.id !== id);
    handleSaveAll(updated);
    toast.success("Poster deleted");
  };

  const handleDeleteAll = () => {
    if (confirm("Are you sure you want to delete ALL website posters? This action cannot be undone.")) {
      handleSaveAll([]);
      toast.success("Deleted all website posters!");
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= posters.length) return;
    const updated = [...posters];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    handleSaveAll(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoster) return;
    if (!editingPoster.title || !editingPoster.img) {
      toast.error("Title and poster image are required");
      return;
    }

    if (isNew) {
      handleSaveAll([...posters, editingPoster]);
    } else {
      handleSaveAll(posters.map((p) => (p.id === editingPoster.id ? editingPoster : p)));
    }
    setEditingPoster(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !editingPoster) return;
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
            filename: file.name,
            contentType: file.type || "image/jpeg",
          },
        });
        if (res?.url) {
          uploadedUrl = res.url;
        }
      } catch (e) {
        console.warn("Server upload exception, falling back to local compressed base64:", e);
      }

      if (!uploadedUrl) {
        uploadedUrl = await compressDataUrl(base64, 1280, 0.78);
      }

      setEditingPoster((prev) => (prev ? { ...prev, img: uploadedUrl } : prev));
      toast.success("Uploaded poster image!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload poster image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent" />
            Website Hero Posters & Banners
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Change the main homepage slideshow posters, upload custom campaign graphics, and edit promotional banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {posters.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete All Posters
            </button>
          )}
          <button
            onClick={() => {
              setIsNew(true);
              setEditingPoster({
                id: `poster-${crypto.randomUUID()}`,
                img: "",
                kicker: "NEW CAMPAIGN",
                title: "NEW HERO BANNER",
                sub: "Discover the latest collection drop.",
                badge: "LIMITED EDITION",
                to: "/shop",
                cta: "EXPLORE NOW",
                is_active: true,
              });
            }}
            className="px-4 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add New Poster
          </button>
        </div>
      </div>

      {/* Posters Grid */}
      {posters.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center bg-card space-y-4">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="text-lg font-black uppercase tracking-wider text-foreground">No Active Website Posters</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You have cleared all website posters. The homepage will display the fallback store hero banner until you upload a custom poster.
          </p>
          <button
            onClick={() => {
              setIsNew(true);
              setEditingPoster({
                id: `poster-${crypto.randomUUID()}`,
                img: "",
                kicker: "NEW CAMPAIGN",
                title: "NEW HERO BANNER",
                sub: "Discover the latest collection drop.",
                badge: "LIMITED EDITION",
                to: "/shop",
                cta: "EXPLORE NOW",
                is_active: true,
              });
            }}
            className="px-4 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add First Poster
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posters.map((poster, index) => (
            <div
              key={poster.id}
              className={cn(
                "border bg-card overflow-hidden transition-all flex flex-col justify-between",
                poster.is_active ? "border-border shadow-sm" : "border-border/50 opacity-60 bg-secondary/20",
              )}
            >
              {/* Poster Image Preview */}
              <div className="relative h-56 bg-muted overflow-hidden">
                <img
                  src={poster.img}
                  alt={poster.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 shadow",
                      poster.is_active ? "bg-foreground text-background" : "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {poster.is_active ? "Active" : "Hidden"}
                  </span>
                  {poster.badge && (
                    <span className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 shadow">
                      {poster.badge}
                    </span>
                  )}
                </div>

                {/* Quick Order Actions */}
                <div className="absolute top-3 right-3 flex gap-1 bg-background/90 border border-border p-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    className="p-1 hover:bg-secondary disabled:opacity-30"
                    title="Move Left/Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={index === posters.length - 1}
                    onClick={() => handleMove(index, "down")}
                    className="p-1 hover:bg-secondary disabled:opacity-30"
                    title="Move Right/Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Poster Info */}
              <div className="p-4 space-y-2 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent block">
                  {poster.kicker}
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide truncate">{poster.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{poster.sub}</p>
                <div className="pt-2 text-[11px] font-semibold text-muted-foreground flex justify-between">
                  <span>CTA: <strong className="text-foreground">{poster.cta}</strong></span>
                  <span>Target: <strong className="text-foreground">{poster.to}</strong></span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="border-t border-border p-3 bg-secondary/30 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(poster.id)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {poster.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {poster.is_active ? "Hide" : "Publish"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsNew(false);
                      setEditingPoster({ ...poster });
                    }}
                    className="px-3 py-1.5 text-xs font-bold border border-border bg-background hover:bg-secondary flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(poster.id)}
                    className="p-1.5 text-destructive hover:bg-destructive/10"
                    title="Delete Poster"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingPoster && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black uppercase tracking-wider border-b border-border pb-3">
              {isNew ? "Add Website Hero Poster" : "Edit Poster Configuration"}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Image Upload Area */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                  Poster Banner Image
                </label>
                <div className="flex gap-3 items-center">
                  {editingPoster.img && (
                    <img
                      src={editingPoster.img}
                      alt="Preview"
                      className="w-24 h-24 object-cover border border-border flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload below..."
                      value={editingPoster.img}
                      onChange={(e) => setEditingPoster({ ...editingPoster, img: e.target.value })}
                      className="w-full border border-border bg-background px-3 py-2 text-xs font-mono outline-none"
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold cursor-pointer disabled:opacity-50">
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? "Uploading..." : "Upload Local Image"}
                      <input
                        type="file"
                        accept="image/*, .png, .jpg, .jpeg, .webp, .heic, .heif, .avif"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Title & Kicker */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Banner Main Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPoster.title}
                    onChange={(e) => setEditingPoster({ ...editingPoster, title: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Kicker Subtitle Header
                  </label>
                  <input
                    type="text"
                    value={editingPoster.kicker}
                    onChange={(e) => setEditingPoster({ ...editingPoster, kicker: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Sub-description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                  Poster Sub-description Text
                </label>
                <textarea
                  rows={2}
                  value={editingPoster.sub}
                  onChange={(e) => setEditingPoster({ ...editingPoster, sub: e.target.value })}
                  className="w-full border border-border bg-background p-2 text-xs font-medium outline-none"
                />
              </div>

              {/* Promo Badge & CTA */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Promo Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FLAT 20% OFF"
                    value={editingPoster.badge || ""}
                    onChange={(e) => setEditingPoster({ ...editingPoster, badge: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={editingPoster.cta}
                    onChange={(e) => setEditingPoster({ ...editingPoster, cta: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    Target Route Path
                  </label>
                  <input
                    type="text"
                    value={editingPoster.to}
                    onChange={(e) => setEditingPoster({ ...editingPoster, to: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPoster(null)}
                  className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-wider hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90"
                >
                  Save Poster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
