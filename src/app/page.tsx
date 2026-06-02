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
import PHLaunch from "@/components/PHLaunch";
import type { Project, Asset } from "@/types";

type Tab = "launch" | "projects" | "content" | "reddit" | "x" | "assets" | "images" | "proxies";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "launch", label: "Launch", icon: "L" },
  { key: "projects", label: "Projects", icon: "P" },
  { key: "content", label: "AI Content", icon: "A" },
  { key: "reddit", label: "Reddit", icon: "R" },
  { key: "x", label: "X Queue", icon: "X" },
  { key: "assets", label: "Assets", icon: "F" },
  { key: "images", label: "Images", icon: "I" },
  { key: "proxies", label: "Proxies", icon: "N" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-zinc-600">{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("launch");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dbStatus, setDbStatus] = useState<"connecting" | "ready" | "error">("connecting");

  useEffect(() => {
    setupDb();
  }, []);

  async function setupDb() {
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      if (res.ok) {
        setDbStatus("ready");
        toast.success("Database connected");
      } else {
        setDbStatus("error");
        toast.error("Database setup failed — check DATABASE_URL");
      }
    } catch {
      setDbStatus("error");
      toast.error("Cannot reach database — check DATABASE_URL");
    }
  }

  async function fetchAssets() {
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/assets?projectId=" + selectedProject.id);
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch {
      setAssets([]);
    }
  }

  useEffect(() => {
    if (selectedProject && tab === "assets") fetchAssets();
  }, [selectedProject, tab]);

  return (
    <div className="flex flex-col flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Launch Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Product Hunt · Indie Hackers · Reddit · X</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${dbStatus === "ready" ? "bg-emerald-500" : dbStatus === "error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"}`} />
          {selectedProject && (
            <div className="text-right bg-zinc-800/50 rounded-lg px-3 py-1.5">
              <div className="text-sm font-medium text-zinc-300">{selectedProject.name}</div>
              <div className="text-xs text-zinc-600">{selectedProject.category || "No category"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-zinc-900/80 rounded-xl p-1 overflow-x-auto border border-zinc-800/50">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap transition-all ${tab === t.key ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {dbStatus === "error" && (
        <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-xl text-sm text-red-400">
          Database connection failed. Check DATABASE_URL in .env.local and restart the dev server.
        </div>
      )}

      {tab === "launch" && (
        selectedProject
          ? <PHLaunch projectId={selectedProject.id} />
          : <EmptyState message="Create or select a project to start your Product Hunt launch" />
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
        selectedProject
          ? <ContentGenerator projectId={selectedProject.id} />
          : <EmptyState message="Create or select a project to start generating AI content" />
      )}

      {tab === "reddit" && (
        selectedProject
          ? <RedditDiscover projectId={selectedProject.id} />
          : <EmptyState message="Select a project to discover relevant subreddits" />
      )}

      {tab === "x" && <XScheduler />}

      {tab === "assets" && (
        selectedProject ? (
          <div className="space-y-6">
            <AssetUploader projectId={selectedProject.id} onUpload={(a: Asset) => setAssets(prev => [...prev, a])} />
            {assets.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {assets.map(a => (
                  <div key={a.id} className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                    <img src={a.blobUrl} alt={a.filename} className="w-full aspect-video object-cover" />
                    <div className="absolute bottom-1 left-1 text-[10px] bg-black/80 text-zinc-400 px-1.5 py-0.5 rounded">{a.width}x{a.height}</div>
                    <button
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] bg-red-900/80 text-red-300 px-1.5 py-0.5 rounded transition-opacity"
                      onClick={async () => {
                        await fetch("/api/assets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
                        setAssets(prev => prev.filter(x => x.id !== a.id));
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="Select a project to upload screenshots and logos" />
        )
      )}

      {tab === "images" && (
        selectedProject
          ? <ImageGenerator projectId={selectedProject.id} projectName={selectedProject.name} />
          : <EmptyState message="Select a project to generate AI images for it" />
      )}

      {tab === "proxies" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProxyImport onImport={() => {}} />
          <ProxyList />
        </div>
      )}
    </div>
  );
}
