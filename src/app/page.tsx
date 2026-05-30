"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProjectForm from "@/components/ProjectForm";
import ProxyImport from "@/components/ProxyImport";
import ProxyList from "@/components/ProxyList";
import AssetUploader from "@/components/AssetUploader";
import ContentGenerator from "@/components/ContentGenerator";
import RedditDiscover from "@/components/RedditDiscover";
import XScheduler from "@/components/XScheduler";
import ImageGenerator from "@/components/ImageGenerator";
import type { Project, Asset } from "@/types";

type Tab = "projects" | "content" | "reddit" | "x" | "assets" | "images" | "proxies";

const TABS: { key: Tab; label: string }[] = [
  { key: "projects", label: "Projects" },
  { key: "content", label: "AI Content" },
  { key: "reddit", label: "Reddit" },
  { key: "x", label: "X Queue" },
  { key: "assets", label: "Assets" },
  { key: "images", label: "Images" },
  { key: "proxies", label: "Proxies" },
];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    setupDb();
  }, []);

  async function setupDb() {
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDbReady(true);
        toast.success("Database ready");
      }
    } catch {
      toast.error("Database setup failed. Check DATABASE_URL.");
    }
  }

  async function fetchAssets() {
    if (!selectedProject) return;
    const res = await fetch("/api/assets?projectId=" + selectedProject.id);
    const data = await res.json();
    setAssets(data);
  }

  useEffect(() => {
    if (selectedProject && tab === "assets") fetchAssets();
  }, [selectedProject, tab]);

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">SaaS Launch Dashboard</h1>
          <p className="text-sm text-zinc-500">Product Hunt · Indie Hackers · Reddit · X</p>
        </div>
        {selectedProject && (
          <div className="text-right">
            <div className="text-sm font-medium text-zinc-300">{selectedProject.name}</div>
            <div className="text-xs text-zinc-600">{selectedProject.category}</div>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!dbReady && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-xl text-sm text-yellow-400">
          Setting up database... If this hangs, check your DATABASE_URL in .env.local
        </div>
      )}

      {tab === "projects" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectForm selected={selectedProject} onSelect={(p: Project) => setSelectedProject(p)} />
          <div className="space-y-6">
            <ProxyImport onImport={() => {}} />
            <ProxyList />
          </div>
        </div>
      )}

      {tab === "content" && (
        selectedProject ? (
          <ContentGenerator projectId={selectedProject.id} />
        ) : (
          <p className="text-sm text-zinc-600">Select a project first.</p>
        )
      )}

      {tab === "reddit" && (
        selectedProject ? (
          <RedditDiscover projectId={selectedProject.id} />
        ) : (
          <p className="text-sm text-zinc-600">Select a project first.</p>
        )
      )}

      {tab === "x" && <XScheduler />}

      {tab === "assets" && (
        selectedProject ? (
          <div className="space-y-6">
            <AssetUploader projectId={selectedProject.id} onUpload={(a: Asset) => setAssets(prev => [...prev, a])} />
            {assets.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {assets.map(a => (
                  <div key={a.id} className="relative group">
                    <img src={a.blobUrl} alt={a.filename} className="rounded-lg border border-zinc-800 w-full aspect-video object-cover" />
                    <div className="absolute bottom-1 left-1 text-xs bg-black/80 text-zinc-300 px-1 rounded">{a.width}x{a.height}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Select a project first.</p>
        )
      )}

      {tab === "images" && (
        <ImageGenerator projectId={selectedProject?.id || 0} projectName={selectedProject?.name || ""} />
      )}

      {tab === "proxies" && (
        <div className="space-y-6">
          <ProxyImport onImport={() => {}} />
          <ProxyList />
        </div>
      )}
    </div>
  );
}
