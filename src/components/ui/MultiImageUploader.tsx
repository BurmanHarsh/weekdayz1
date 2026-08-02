import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file?: File;
  preview: string;
  status: "uploading" | "done" | "error";
  publicUrl?: string;
}

interface MultiImageUploaderProps {
  onUrlsChange: (urls: string[]) => void;
  initialUrls?: string[];
  maxFiles?: number;
}

export function MultiImageUploader({
  onUrlsChange,
  initialUrls = [],
  maxFiles = 8,
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(() =>
    initialUrls.map((url) => ({
      id: crypto.randomUUID(),
      preview: url,
      status: "done" as const,
      publicUrl: url,
    }))
  );

  const notifyChange = useCallback(
    (imgs: UploadedImage[]) => {
      const urls = imgs
        .filter((i) => i.status === "done" && i.publicUrl)
        .map((i) => i.publicUrl!);
      onUrlsChange(urls);
    },
    [onUrlsChange]
  );

  const uploadFile = useCallback(
    async (img: UploadedImage) => {
      if (!img.file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const ext = img.file!.name.split(".").pop() ?? "jpg";
          const path = `products/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, img.file!, { upsert: false, contentType: img.file!.type });

          if (!error) {
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
            const publicUrl = urlData.publicUrl;
            setImages((prev) => {
              const next = prev.map((i) =>
                i.id === img.id
                  ? { ...i, status: "done" as const, publicUrl, preview: publicUrl }
                  : i
              );
              notifyChange(next);
              return next;
            });
            return;
          }
        } catch (_) {}

        // Fallback: use base64 data URL if Supabase storage is unconfigured or blocked by RLS
        setImages((prev) => {
          const next = prev.map((i) =>
            i.id === img.id
              ? { ...i, status: "done" as const, publicUrl: base64Data, preview: base64Data }
              : i
          );
          notifyChange(next);
          return next;
        });
      };
      reader.readAsDataURL(img.file);
    },
    [notifyChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImgs: UploadedImage[] = acceptedFiles.slice(0, maxFiles - images.length).map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        status: "uploading" as const,
      }));
      setImages((prev) => [...prev, ...newImgs]);
      newImgs.forEach((img) => uploadFile(img));
    },
    [images.length, maxFiles, uploadFile]
  );

  const remove = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.preview && img.file) URL.revokeObjectURL(img.preview);
      const next = prev.filter((i) => i.id !== id);
      notifyChange(next);
      return next;
    });
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      copy.unshift(chosen);
      notifyChange(copy);
      return copy;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    multiple: true,
    disabled: images.length >= maxFiles,
  });

  return (
    <div className="space-y-3">
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-5 w-5 mx-auto mb-2 text-accent" />
          <p className="text-sm font-semibold">
            {isDragActive ? "Drop images here" : "Drag & drop or click to upload photos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Amazon / Flipkart style gallery · Max 8 photos (PNG/JPG/WEBP)
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AnimatePresence>
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square border border-border bg-black/40 overflow-hidden group"
              >
                <img src={img.preview || img.publicUrl} alt="" className="w-full h-full object-contain p-1" />

                {/* Cover Photo Badge */}
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-accent text-accent-foreground text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 shadow">
                    Primary Cover
                  </span>
                )}

                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-white">Uploading…</span>
                  </div>
                )}

                {img.status === "done" && idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="absolute top-1.5 left-1.5 bg-background/90 text-foreground text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Make Cover
                  </button>
                )}

                {img.status === "done" && (
                  <div className="absolute top-1.5 right-7">
                    <CheckCircle className="h-4 w-4 text-emerald-400 drop-shadow" />
                  </div>
                )}

                {img.status === "error" && (
                  <div className="absolute inset-0 bg-destructive/40 flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">Error</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="absolute top-1 right-1 p-1 bg-black/70 text-white hover:bg-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
