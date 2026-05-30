"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Asset, AssetType } from "@/types";

const PLATFORM_SIZES = {
  producthunt_logo: { w: 240, h: 240 },
  producthunt_gallery: { w: 1270, h: 760 },
  indiehackers_logo: { w: 200, h: 200 },
  reddit_hero: { w: 1200, h: 628 },
  x_header: { w: 1500, h: 500 },
};

export default function AssetUploader({ projectId, onUpload }: { projectId: number; onUpload: (a: Asset) => void }) {
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("producthunt_gallery");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function resizeImage(file: File, targetW: number, targetH: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        const scale = Math.min(targetW / img.width, targetH / img.height);
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, targetW, targetH);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const preset = PLATFORM_SIZES[selectedPreset as keyof typeof PLATFORM_SIZES];
        const resized = await resizeImage(file, preset.w, preset.h);
        const formData = new FormData();
        formData.append("file", resized, file.name.replace(/\.[^.]+$/, ".png"));

        const res = await fetch("/api/assets/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (res.ok) {
          const assetRes = await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              type: selectedPreset.includes("logo") ? "logo" : "screenshot" as AssetType,
              blobUrl: data.url,
              filename: data.filename,
              width: preset.w,
              height: preset.h,
            }),
          });
          const asset = await assetRes.json();
          onUpload(asset);
          toast.success("Uploaded!");
        } else {
          toast.error(data.error || "Upload failed");
        }
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-400">Upload Assets</h3>

      <select
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200"
        value={selectedPreset}
        onChange={e => setSelectedPreset(e.target.value)}
      >
        {Object.entries(PLATFORM_SIZES).map(([key, size]) => (
          <option key={key} value={key}>{key.replace(/_/g, " ")} ({size.w}x{size.h})</option>
        ))}
      </select>

      <label className="block cursor-pointer">
        <div className="px-4 py-8 border-2 border-dashed border-zinc-700 rounded-xl text-center text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition-colors">
          {uploading ? "Uploading..." : "Click to upload screenshots / logo"}
        </div>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
