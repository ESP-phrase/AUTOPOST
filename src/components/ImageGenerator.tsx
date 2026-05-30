"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ImageGenerator({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, summary: projectName, count }),
      });
      const data = await res.json();
      if (res.ok) {
        setImages(data.urls);
        toast.success(`Generated ${data.urls.length} images`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Image generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-400">AI Image Generator</h3>
      <p className="text-xs text-zinc-600">Uses OpenAI DALL-E 3</p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Count:</span>
        <select className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={count} onChange={e => setCount(parseInt(e.target.value))}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <button
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
        onClick={handleGenerate}
        disabled={loading || !projectName}
      >
        {loading ? "Generating..." : "Generate Gallery Images"}
      </button>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, i) => (
            <img key={i} src={url} alt={`Generated ${i}`} className="rounded-lg border border-zinc-800 w-full aspect-square object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
