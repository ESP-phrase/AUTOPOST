"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Project } from "@/types";

export default function ProjectForm({ selected, onSelect }: { selected: Project | null; onSelect: (p: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", url: "", tagline: "", category: "", mrr: 0 });
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  }

  function resetForm() {
    setForm({ name: "", url: "", tagline: "", category: "", mrr: 0 });
    setEditing(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("Name and URL are required");
      return;
    }

    setLoading(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing } : form;
      const res = await fetch("/api/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? "Project updated" : "Project created");
        resetForm();
        fetchProjects();
        onSelect(data);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to save project");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: Project) {
    setForm({ name: p.name, url: p.url, tagline: p.tagline, category: p.category, mrr: p.mrr });
    setEditing(p.id);
    onSelect(p);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this project?")) return;
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selected?.id === id) onSelect(null as any);
    fetchProjects();
    toast.success("Project deleted");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-100">Projects</h2>

      <div className="grid grid-cols-2 gap-2">
        <input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500" placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        <input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 col-span-2" placeholder="Tagline / summary" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} />
        <input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500" placeholder="MRR ($)" type="number" value={form.mrr || ""} onChange={e => setForm({ ...form, mrr: parseInt(e.target.value) || 0 })} />
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50" onClick={handleSave} disabled={loading}>
          {editing ? "Update" : "Create Project"}
        </button>
        {editing && <button className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg" onClick={resetForm}>Cancel</button>}
      </div>

      {projects.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {projects.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${selected?.id === p.id ? "bg-blue-600/20 border border-blue-500/50" : "bg-zinc-800/50 hover:bg-zinc-800"}`} onClick={() => onSelect(p)}>
              <div>
                <div className="font-medium text-zinc-200">{p.name}</div>
                <div className="text-xs text-zinc-500">{p.tagline}</div>
              </div>
              <div className="flex gap-1">
                <button className="text-xs px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-400" onClick={(e) => { e.stopPropagation(); startEdit(p); }}>Edit</button>
                <button className="text-xs px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50 rounded text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
