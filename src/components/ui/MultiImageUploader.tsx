import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "done" | "error";
  publicUrl?: string;
}

interface MultiImageUploaderProps {
  onUrlsChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function MultiImageUploader({ onUrlsChange, maxFiles = 10 }: MultiImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const uploadFile = useCallback(
    async (img: UploadedImage) => {
      const ext = img.file.name.split(".").pop() ?? "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, img.file, { upsert: false, contentType: img.file.type });
      if (error) {
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, status: "error" as const } : i))
        );
        toast.error(`Failed to upload ${img.file.name}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setImages((prev) => {
        const next = prev.map((i) =>
          i.id === img.id ? { ...i, status: "done" as const, publicUrl } : i
        );
        onUrlsChange(next.filter((i) => i.status === "done" && i.publicUrl).map((i) => i.publicUrl!));
        return next;
      });
    },
    [onUrlsChange]
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
      if (img?.preview) URL.revokeObjectURL(img.preview);
      const next = prev.filter((i) => i.id !== id);
      onUrlsChange(next.filter((i) => i.status === "done" && i.publicUrl).map((i) => i.publicUrl!));
      return next;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: true,
    disabled: images.length >= maxFiles,
  });

  return (
    <div className="space-y-3">
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-5 w-5 mx-auto mb-2 text-accent" />
          <p className="text-sm font-semibold">
            {isDragActive ? "Drop images here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG/JPG · max 10MB each · up to {maxFiles} images</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <AnimatePresence>
            {images.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square border border-border overflow-hidden group"
              >
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
                {img.status === "done" && (
                  <div className="absolute top-1.5 left-1.5">
                    <CheckCircle className="h-4 w-4 text-accent drop-shadow" />
                  </div>
                )}
                {img.status === "error" && (
                  <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">Error</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="absolute top-1 right-1 p-0.5 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
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
