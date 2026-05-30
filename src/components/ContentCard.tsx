"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Content } from "@/types";
import { CHANNEL_CONFIG } from "@/types";

export default function ContentCard({ content, onDelete, onEdit }: { content: Content; onDelete: (id: number) => void; onEdit: (id: number, body: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(content.body);
  const [posting, setPosting] = useState(false);

  const cfg = CHANNEL_CONFIG[content.channel as keyof typeof CHANNEL_CONFIG];
  const fmt = cfg?.formats.find(f => f.value === content.format);

  async function handleCopy() {
    await navigator.clipboard.writeText(content.body);
    toast.success("Copied!");
  }

  async function handlePostToX() {
    if (content.channel !== "x") return;
    setPosting(true);
    try {
      const res = await fetch("/api/x/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Posted! ${data.posted?.length || 0} tweets`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Post failed");
    } finally {
      setPosting(false);
    }
  }

  function handleSaveEdit() {
    onEdit(content.id, body);
    setEditing(false);
    toast.success("Saved");
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-400">{cfg?.label || content.channel}</span>
        <span>·</span>
        <span>{fmt?.label || content.format}</span>
        <span>·</span>
        <span className="capitalize">{content.tone}</span>
        {fmt?.maxChars && <span className="ml-auto text-zinc-600">{body.length}/{fmt.maxChars}</span>}
      </div>

      {editing ? (
        <textarea
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 font-mono min-h-[120px]"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      ) : (
        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{content.body}</pre>
      )}

      <div className="flex gap-1 flex-wrap">
        {editing ? (
          <>
            <button className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded" onClick={handleSaveEdit}>Save</button>
            <button className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded" onClick={() => { setBody(content.body); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <>
            <button className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded" onClick={handleCopy}>Copy</button>
            <button className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded" onClick={() => setEditing(true)}>Edit</button>
            {content.channel === "x" && (
              <button className="text-xs px-2 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded" onClick={handlePostToX} disabled={posting}>{posting ? "Posting..." : "Post to X"}</button>
            )}
            <button className="text-xs px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded ml-auto" onClick={() => onDelete(content.id)}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
