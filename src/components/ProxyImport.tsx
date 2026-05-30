"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ProxyImport({ onImport }: { onImport: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    const lines = text.split("\n").filter(Boolean).map(l => l.trim());
    const proxies = lines.map(line => {
      const parts = line.replace(/^(http|https|socks4|socks5):\/\//, "").split(":");
      let protocol = "http";
      if (line.startsWith("https://")) protocol = "https";
      else if (line.startsWith("socks4://")) protocol = "socks4";
      else if (line.startsWith("socks5://")) protocol = "socks5";

      if (parts.length >= 4) {
        return { host: parts[0], port: parseInt(parts[1]), protocol: protocol as any, username: parts[2], password: parts[3] };
      }
      if (parts.length >= 2) {
        return { host: parts[0], port: parseInt(parts[1]), protocol: protocol as any };
      }
      return null;
    }).filter(Boolean) as any[];

    if (!proxies.length) {
      toast.error("No valid proxies found. Format: host:port or host:port:user:pass");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxies }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.count} proxies`);
        setText("");
        onImport();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to import proxies");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
      <h3 className="text-sm font-semibold text-zinc-400 mb-2">Import Proxies</h3>
      <textarea
        className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 font-mono placeholder-zinc-500"
        placeholder="host:port&#10;host:port:user:pass&#10;socks5://host:port:user:pass"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50"
        onClick={handleImport}
        disabled={loading || !text.trim()}
      >
        {loading ? "Importing..." : "Import"}
      </button>
    </div>
  );
}
