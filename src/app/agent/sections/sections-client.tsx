"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Layers3, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

type Stage = {
  id: string;
  name: string;
  order: number;
  color: string | null;
};

type Section = {
  id: string;
  name: string;
  isDefault: boolean;
  leadCount: number;
  stages: Stage[];
};

type Message = { type: "success" | "error"; text: string } | null;

export function AgentSectionsClient() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [newStageBySection, setNewStageBySection] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Message>(null);

  async function refreshSections() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/sections");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load sections.");
      setSections(data.sections ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not load sections." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSections();
  }, []);

  async function createSection() {
    const name = newSectionName.trim();
    if (!name) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agent/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create section.");
      setNewSectionName("");
      setMessage({ type: "success", text: `Created section "${name}".` });
      await refreshSections();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not create section." });
    } finally {
      setLoading(false);
    }
  }

  async function addStage(section: Section) {
    const name = (newStageBySection[section.id] ?? "").trim();
    if (!name) return;
    setActingId(section.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/agent/sections/${section.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add stage.");
      setNewStageBySection((prev) => ({ ...prev, [section.id]: "" }));
      setMessage({
        type: "success",
        text: data.alreadyExists ? `"${name}" already exists in ${section.name}.` : `Added "${name}" to ${section.name}.`,
      });
      await refreshSections();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not add stage." });
    } finally {
      setActingId(null);
    }
  }

  async function deleteEmptySection(section: Section) {
    setActingId(section.id);
    setMessage(null);
    try {
      const dryRun = await fetch(`/api/agent/sections/${section.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });
      const dryRunData = await dryRun.json();
      if (!dryRun.ok) throw new Error(dryRunData.error || "Could not validate section deletion.");
      if (dryRunData.previous?.leadCount > 0) {
        throw new Error(`"${section.name}" has ${dryRunData.previous.leadCount} lead(s). Move them first before deleting.`);
      }

      const res = await fetch(`/api/agent/sections/${section.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete section.");
      setMessage({ type: "success", text: `Deleted empty section "${section.name}".` });
      await refreshSections();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not delete section." });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card border border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Layers3 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Agent Section Control</h2>
              <p className="mt-1 max-w-2xl text-xs text-text-muted">
                Manage lead sections and stages without dragging cards or opening the heavy board.
              </p>
            </div>
          </div>
          <button
            onClick={refreshSections}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text hover:bg-surface-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="card border border-border p-4">
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={newSectionName}
            onChange={(event) => setNewSectionName(event.target.value)}
            placeholder="New lead section name, e.g. Money 20/20 Follow-up Batch"
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
          />
          <button
            onClick={createSection}
            disabled={loading || !newSectionName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            <Plus size={15} />
            Create Section
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <div key={section.id} className="card border border-border p-4">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-text">{section.name}</h3>
                  {section.isDefault && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                      Main
                    </span>
                  )}
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-text-muted">
                    {section.leadCount} leads
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-text-faint">ID: {section.id}</p>
              </div>
              {!section.isDefault && section.leadCount === 0 && (
                <button
                  onClick={() => deleteEmptySection(section)}
                  disabled={actingId === section.id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-60"
                >
                  {actingId === section.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete Empty
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {section.stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color ?? "#64748b" }} />
                    <span className="text-sm font-semibold text-text">{stage.name}</span>
                  </div>
                  <span className="text-[11px] text-text-faint">Order {stage.order}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                value={newStageBySection[section.id] ?? ""}
                onChange={(event) => setNewStageBySection((prev) => ({ ...prev, [section.id]: event.target.value }))}
                placeholder="Add stage, e.g. Follow-up 2"
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
              />
              <button
                onClick={() => addStage(section)}
                disabled={actingId === section.id || !(newStageBySection[section.id] ?? "").trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-text hover:bg-surface-2 disabled:opacity-60"
              >
                {actingId === section.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Stage
              </button>
            </div>

            {section.leadCount > 0 && !section.isDefault && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Delete is hidden while this section has leads. Move or review them first.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
