"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProxyList() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    fetchProxies();
  }, []);

  async function fetchProxies() {
    try {
      const res = await fetch("/api/proxy/list");
      const data = await res.json();
      setProxies(Array.isArray(data) ? data : []);
    } catch {
      setProxies([]);
    }
  }

  async function handleHealthCheck() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/proxy/health", { method: "POST" });
      const data = await res.json();
      toast.success(`Checked ${data.length} proxies`);
      fetchProxies();
    } catch {
      toast.error("Health check failed");
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch("/api/proxy/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProxies();
  }

  const alive = proxies.filter(p => p.status === "alive").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400">Proxy Pool</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{alive}/{proxies.length} alive</span>
          <button className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded" onClick={handleHealthCheck} disabled={healthLoading}>
            {healthLoading ? "Checking..." : "Health Check"}
          </button>
        </div>
      </div>

      {proxies.length === 0 ? (
        <p className="text-xs text-zinc-600">No proxies imported yet.</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {proxies.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between text-xs bg-zinc-800/50 rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${p.status === "alive" ? "bg-emerald-500" : p.status === "dead" ? "bg-red-500" : "bg-zinc-600"}`} />
                <span className="text-zinc-400">{p.protocol}://{p.host}:{p.port}</span>
              </div>
              <button className="text-red-400 hover:text-red-300" onClick={() => handleDelete(p.id)}>x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
