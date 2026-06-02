"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Channel, ContentTone, ContentFormat, Content } from "@/types";
import { CHANNEL_CONFIG } from "@/types";
import ContentCard from "./ContentCard";

export default function ContentGenerator({ projectId }: { projectId: number }) {
  const [channel, setChannel] = useState<Channel>("producthunt");
  const [format, setFormat] = useState<ContentFormat>("tagline");
  const [tone, setTone] = useState<ContentTone>("casual");
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (projectId) {
      fetch("/api/content?projectId=" + projectId)
        .then(r => r.json())
        .then(data => setContents(Array.isArray(data) ? data : []))
        .catch(() => setContents([]));
    }
  }, [projectId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, channel, format, tone }),
      });
      const data = await res.json();
      if (res.ok) {
        setContents(prev => [...prev, data]);
        toast.success("Content generated!");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true);
    try {
      const res = await fetch("/api/ai/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated ${data.pieces} pieces!${data.errors?.length ? ` (${data.errors.length} failed)` : ""}`);
        const fresh = await fetch("/api/content?projectId=" + projectId).then(r => r.json());
        setContents(Array.isArray(fresh) ? fresh : []);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Generate all failed");
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch("/api/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContents(prev => prev.filter(c => c.id !== id));
  }

  async function handleEdit(id: number, body: string) {
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, body, status: "draft" }),
    });
  }

  const formats = CHANNEL_CONFIG[channel]?.formats || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-100">AI Content Generator</h2>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${channel === key ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            onClick={() => { setChannel(key as Channel); setFormat(cfg.formats[0].value); }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {formats.map(f => (
          <button
            key={f.value}
            className={`px-2 py-0.5 text-xs rounded ${format === f.value ? "bg-zinc-200 text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            onClick={() => setFormat(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["hype", "casual", "technical", "storyteller"] as ContentTone[]).map(t => (
          <button
            key={t}
            className={`px-3 py-1 text-xs rounded-lg capitalize ${tone === t ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            onClick={() => setTone(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2"
          onClick={handleGenerate}
          disabled={generating || !projectId}
        >
          {generating ? "Generating..." : "Generate One"}
        </button>
        <button
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2"
          onClick={handleGenerateAll}
          disabled={generatingAll || !projectId}
        >
          {generatingAll ? "Generating All..." : "Generate All"}
        </button>
      </div>

      {contents.length > 0 && (
        <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto">
          {contents.map(c => (
            <ContentCard key={c.id} content={c} onDelete={handleDelete} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
