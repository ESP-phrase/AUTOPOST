"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Content, Asset } from "@/types";
import { CHANNEL_CONFIG } from "@/types";
import AssetUploader from "./AssetUploader";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

const PH_ASSETS = [
  { id: "logo", label: "Logo (240x240)", preset: "producthunt_logo" },
  { id: "gallery1", label: "Screenshot 1 (1270x760)", preset: "producthunt_gallery" },
  { id: "gallery2", label: "Screenshot 2 (1270x760)", preset: "producthunt_gallery" },
  { id: "gallery3", label: "Screenshot 3 (1270x760)", preset: "producthunt_gallery" },
  { id: "gallery4", label: "Screenshot 4 (1270x760)", preset: "producthunt_gallery" },
];

export default function PHLaunch({ projectId }: { projectId: number }) {
  const [taglineContent, setTaglineContent] = useState<Content | null>(null);
  const [descContent, setDescContent] = useState<Content | null>(null);
  const [commentContent, setCommentContent] = useState<Content | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<string>("hype");

  useEffect(() => { loadContent(); loadAssets(); }, [projectId]);

  async function loadContent() {
    try {
      const res = await fetch(`/api/content?projectId=${projectId}&channel=producthunt`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setTaglineContent(data.find((c: Content) => c.format === "tagline") || null);
      setDescContent(data.find((c: Content) => c.format === "description") || null);
      setCommentContent(data.find((c: Content) => c.format === "first_comment") || null);
    } catch {}
  }

  async function loadAssets() {
    try {
      const res = await fetch(`/api/assets?projectId=${projectId}`);
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function generateOne(format: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, channel: "producthunt", format, tone }),
      });
      const data = await res.json();
      if (res.ok) {
        if (format === "tagline") setTaglineContent(data);
        if (format === "description") setDescContent(data);
        if (format === "first_comment") setCommentContent(data);
        toast.success("Generated!");
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function generateAll() {
    setGenerating(true);
    try {
      for (const fmt of ["tagline", "description", "first_comment"]) {
        await generateOne(fmt);
      }
      toast.success("All PH content generated!");
    } catch {
      toast.error("Some content failed");
    } finally {
      setGenerating(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  const tagline = taglineContent?.body || "";
  const description = descContent?.body || "";
  const firstComment = commentContent?.body || "";

  const assetCounts: Record<string, number> = {};
  for (const a of assets) assetCounts[a.type] = (assetCounts[a.type] || 0) + 1;

  const checklist: ChecklistItem[] = [
    { id: "tagline", label: "Tagline (60 chars)", done: tagline.length > 0 },
    { id: "description", label: "Description (260 chars)", done: description.length > 0 },
    { id: "first_comment", label: "Maker's First Comment", done: firstComment.length > 0 },
    { id: "logo", label: "Logo (240x240)", done: (assetCounts.logo || 0) >= 1 },
    { id: "gallery", label: "Gallery (3+ screenshots)", done: (assetCounts.screenshot || 0) >= 3 },
    { id: "topics", label: "Choose topics (up to 3)", done: false },
    { id: "makers", label: "Add co-makers", done: false },
    { id: "links", label: "Website + social links", done: false },
    { id: "launch_day", label: "Pick launch date", done: false },
  ];

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Product Hunt Launch</h2>
        <span className="text-sm text-zinc-500">{doneCount}/{checklist.length} ready</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {checklist.map(item => (
          <div key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${item.done ? "bg-emerald-900/20 border-emerald-800 text-emerald-400" : "bg-zinc-900/50 border-zinc-800 text-zinc-500"}`}>
            <span className={item.done ? "text-emerald-400" : "text-zinc-700"}>{item.done ? "\u2713" : "\u25CB"}</span>
            {item.label}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Tone:</span>
        {["hype", "casual", "technical", "storyteller"].map(t => (
          <button key={t} className={`text-xs px-2 py-0.5 rounded capitalize ${tone === t ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`} onClick={() => setTone(t)}>{t}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50" onClick={() => generateOne("tagline")} disabled={generating}>Gen Tagline</button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50" onClick={() => generateOne("description")} disabled={generating}>Gen Desc</button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50" onClick={() => generateOne("first_comment")} disabled={generating}>Gen Comment</button>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50" onClick={generateAll} disabled={generating}>{generating ? "Generating..." : "Generate All"}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {tagline && (
            <Card label={`Tagline (${tagline.length}/60)`} onCopy={() => copy(tagline)}>
              <p className="text-lg font-semibold text-zinc-200">{tagline}</p>
            </Card>
          )}
          {description && (
            <Card label={`Description (${description.length}/260)`} onCopy={() => copy(description)}>
              <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
            </Card>
          )}
          {firstComment && (
            <Card label={`First Comment (${firstComment.length})`} onCopy={() => copy(firstComment)}>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{firstComment}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <AssetUploader projectId={projectId} onUpload={() => loadAssets()} />
          {assets.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {assets.map(a => (
                <div key={a.id} className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                  <img src={a.blobUrl} alt={a.filename} className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-1 left-1 text-[10px] bg-black/80 text-zinc-400 px-1.5 py-0.5 rounded">{a.width}x{a.height}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-400 mb-1">Launch Day Steps</h3>
        <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
          <li>Schedule your launch 2-3 weeks in advance at <strong>producthunt.com/launch</strong></li>
          <li>Recruit supporters to upvote in the first hour</li>
          <li>Post your first comment immediately after launch</li>
          <li>Share on X, LinkedIn, Slack communities on launch day</li>
          <li>Reply to every comment within 24 hours</li>
          <li>Send a post-launch email to your list on day 2</li>
        </ol>
        <p className="text-xs text-zinc-500 mt-2">PH ranks by velocity. First hour upvotes matter most.</p>
      </div>
    </div>
  );
}

function Card({ label, children, onCopy }: { label: string; children: React.ReactNode; onCopy?: () => void }) {
  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        {onCopy && (
          <button className="text-xs px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded" onClick={onCopy}>Copy</button>
        )}
      </div>
      {children}
    </div>
  );
}
