"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { RedditSubResult } from "@/types";

export default function RedditDiscover({ projectId }: { projectId: number }) {
  const [results, setResults] = useState<RedditSubResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleDiscover() {
    setLoading(true);
    try {
      const res = await fetch("/api/reddit/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        toast.success(`Found ${data.length} subreddits`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-100">Reddit Discovery</h2>
      <p className="text-sm text-zinc-500">Find subreddits where you can promote without getting banned.</p>

      <button
        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg disabled:opacity-50"
        onClick={handleDiscover}
        disabled={loading || !projectId}
      >
        {loading ? "Searching..." : "Find Subreddits"}
      </button>

      {results.length > 0 && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-200">r/{r.name}</span>
                <span className="text-xs text-zinc-500">{r.members.toLocaleString()} members</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">{r.description.substring(0, 200)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.promoAllowed ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                  {r.promoAllowed ? "Promo OK" : "No Self-Promo"}
                </span>
                <span className="text-xs text-zinc-600">{r.bestThreadType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
