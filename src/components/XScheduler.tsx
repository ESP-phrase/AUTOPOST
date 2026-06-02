"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Schedule } from "@/types";

export default function XScheduler() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    try {
      const res = await fetch("/api/x/schedule");
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      setSchedules([]);
    }
  }

  async function handleDelete(id: number) {
    await fetch("/api/x/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSchedules();
    toast.success("Removed");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-100">X Post Queue</h2>
      <p className="text-sm text-zinc-500">Scheduled tweets. Posting is randomized with 45-90 minute gaps to avoid spam flags.</p>

      <div className="text-xs text-zinc-600 space-y-1">
        <p>Max 12 tweets/day · 2 threads/day · Warm-up: 3/day first 48h</p>
        <p>Duplicate prevention · Proxy rotation per post · Randomized timing</p>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-zinc-600">No scheduled posts. Generate X content first, then schedule from the content card.</p>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between border border-zinc-800 rounded-lg bg-zinc-900/50 px-3 py-2">
              <div>
                <span className="text-xs text-zinc-400">Content #{s.contentId}</span>
                <span className="text-xs text-zinc-600 ml-2">{new Date(s.scheduledAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "posted" ? "bg-emerald-900/50 text-emerald-400" : s.status === "failed" ? "bg-red-900/50 text-red-400" : "bg-zinc-800 text-zinc-500"}`}>{s.status}</span>
                <button className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(s.id)}>x</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
