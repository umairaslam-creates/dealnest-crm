"use client";

import { useState, useTransition } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import {
  addStage,
  deleteStage,
  renameStage,
  createPipeline,
  renamePipeline,
  deletePipeline,
} from "@/app/actions";
import { useToast } from "@/components/toast-context";

type Stage = { id: string; name: string; color: string | null; order: number };
type Pipeline = {
  id: string;
  name: string;
  type: "LEAD" | "DEAL";
  isDefault?: boolean;
  stages: Stage[];
};

function StageRow({ stage }: { stage: Stage }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2">
      <span className="h-2 w-2 rounded-full" style={{ background: stage.color ?? "#6b6d72" }} />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            setEditing(false);
            startTransition(() => renameStage(stage.id, name));
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="flex-1 rounded border border-border-strong px-1.5 py-0.5 text-[13px] outline-none"
        />
      ) : (
        <span className="flex-1 text-[13px] text-text">{stage.name}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="rounded p-1 text-text-faint hover:bg-surface-2 hover:text-text-muted"
        title="Rename stage"
      >
        {editing ? <Check size={12} /> : <Pencil size={12} />}
      </button>
      <button
        type="button"
        onClick={() => startTransition(() => deleteStage(stage.id))}
        className="rounded p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
        title="Delete stage"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [pName, setPName] = useState(pipeline.name);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleRenamePipeline() {
    if (!pName.trim()) {
      setPName(pipeline.name);
      setEditingName(false);
      return;
    }
    setEditingName(false);
    startTransition(async () => {
      try {
        await renamePipeline(pipeline.id, pName.trim());
        toast.success(`Pipeline renamed to "${pName.trim()}"`);
      } catch (err: any) {
        toast.error(err.message || "Failed to rename pipeline.");
        setPName(pipeline.name);
      }
    });
  }

  async function handleDeletePipeline() {
    setDeleting(true);
    try {
      await deletePipeline(pipeline.id);
      toast.success(`Pipeline "${pipeline.name}" deleted. Any associated records were moved to the Main Pipeline.`);
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete pipeline.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="card p-4 flex flex-col justify-between">
        <div>
          {/* Card Header with Title & Action Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3 mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    autoFocus
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenamePipeline();
                      if (e.key === "Escape") {
                        setPName(pipeline.name);
                        setEditingName(false);
                      }
                    }}
                    onBlur={handleRenamePipeline}
                    className="flex-1 rounded-lg border border-indigo-500 bg-surface px-2 py-1 text-[13.5px] font-medium text-text outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleRenamePipeline}
                    className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    <Check size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[14px] font-bold text-text truncate">
                    {pipeline.name}
                  </p>
                  <span className="text-[11px] font-semibold text-text-faint shrink-0">
                    ({pipeline.type})
                  </span>

                  {pipeline.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shrink-0">
                      <ShieldCheck size={11} className="text-emerald-600" />
                      Main Default
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingName(true)}
                        className="p-1 rounded-md text-text-faint hover:text-text hover:bg-surface-2 transition-colors"
                        title="Rename pipeline"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="p-1 rounded-md text-text-faint hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete custom pipeline"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-accent hover:bg-accent-soft shrink-0 transition-colors"
            >
              <Plus size={13} /> Add stage
            </button>
          </div>

          {/* Stages List */}
          <div className="space-y-1.5">
            {pipeline.stages.map((s) => (
              <StageRow key={s.id} stage={s} />
            ))}
            {adding && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border-strong px-2.5 py-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim()) {
                      startTransition(() => addStage(pipeline.id, newName.trim()));
                      setNewName("");
                      setAdding(false);
                    }
                  }}
                  placeholder="New stage name, press Enter"
                  className="flex-1 rounded border border-border-strong px-1.5 py-0.5 text-[13px] outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text">
                  Delete Pipeline: &ldquo;{pipeline.name}&rdquo;?
                </h3>
                <p className="mt-2 text-xs text-text-muted leading-relaxed">
                  Are you sure you want to delete this campaign pipeline?
                </p>
                <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-700 leading-relaxed">
                  <strong>Safe Migration Guarantee:</strong> Any open deals or records currently in this pipeline will be automatically reassigned to the <strong>Main Default Pipeline</strong>, so no data will be lost.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePipeline}
                className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                <span>Delete Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PipelineSettingsClient({ pipelines }: { pipelines: Pipeline[] }) {
  const [, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [pipelineName, setPipelineName] = useState("");
  const [pipelineType, setPipelineType] = useState<"DEAL" | "LEAD">("DEAL");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!pipelineName.trim()) return;
    startTransition(() => {
      createPipeline(pipelineName.trim(), pipelineType);
    });
    setPipelineName("");
    setModalOpen(false);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pipelines.map((p) => (
          <PipelineCard key={p.id} pipeline={p} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 py-3 text-[13px] font-semibold text-text-muted hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
      >
        <Plus size={15} />
        <span>New pipeline for an event or campaign (e.g. Money2020, LEAP 2026)</span>
      </button>

      {/* New Pipeline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-text">Create New Pipeline</h2>
            <p className="text-xs text-text-muted mt-1">
              Set up a structured stage flow for specialized campaign deals or incoming leads.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Pipeline Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Money2020, LEAP 2026, Enterprise Retail"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-xs text-text outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Pipeline Purpose
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPipelineType("DEAL")}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      pipelineType === "DEAL"
                        ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                        : "border-border bg-surface-2 hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-xs font-bold text-text">Deal Pipeline</span>
                    <span className="block text-[11px] text-text-muted mt-0.5">Revenue &amp; contracts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPipelineType("LEAD")}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      pipelineType === "LEAD"
                        ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600"
                        : "border-border bg-surface-2 hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-xs font-bold text-text">Lead Pipeline</span>
                    <span className="block text-[11px] text-text-muted mt-0.5">Inbound intake flow</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-5 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm transition-all"
                >
                  Create Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
