"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  KanbanSquare,
  Layers,
  X,
  Loader2,
  Pencil,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { KanbanBoard, type BoardCard, type BoardStage } from "@/components/kanban-board";
import {
  moveDealStage,
  renameStage,
  addStage,
  createPipeline,
  renamePipeline,
  deletePipeline,
  updateDealOwner,
  bulkUpdateDealOwners,
  updateDealPipeline,
  deleteDeal,
} from "@/app/actions";
import { DealModal } from "@/components/deal-modal";
import { useToast } from "@/components/toast-context";

function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Stage = { id: string; name: string; color: string | null; order: number };
type Pipeline = { id: string; name: string; isDefault: boolean; stages: Stage[] };
type Deal = {
  id: string;
  title: string;
  value: number | null;
  currency: string | null;
  stageId: string;
  pipelineId: string;
  createdAt?: string | Date;
  owner: { id: string; name: string | null } | null;
  account: {
    name: string;
    contacts?: Array<{ id: string; name: string; title?: string | null }>;
  } | null;
  product?: { id: string; name: string } | null;
  stageHistory?: Array<{ changedAt: string | Date; toStage?: { name: string } | null }>;
};
type Account = { id: string; name: string };
type Member = { id: string; name: string | null };

export function PipelineClient({
  pipelines,
  deals,
  accounts,
  members,
}: {
  pipelines: Pipeline[];
  deals: Deal[];
  accounts: Account[];
  members: Member[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [activeId, setActiveId] = useState(pipelines[0]?.id);
  const [, startTransition] = useTransition();

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  // Edit / Rename pipeline modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pipelineToEdit, setPipelineToEdit] = useState<Pipeline | null>(null);
  const [editPipelineName, setEditPipelineName] = useState("");
  const [renamingPipeline, setRenamingPipeline] = useState(false);

  // Delete pipeline modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  const [deletingPipeline, setDeletingPipeline] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Multi-selection state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [bulkOwnerId, setBulkOwnerId] = useState<string>("");
  const [confirmBulkModalOpen, setConfirmBulkModalOpen] = useState(false);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Single card reassignment confirmation
  const [reassignCardPending, setReassignCardPending] = useState<{
    cardId: string;
    newOwnerId: string;
    dealTitle: string;
    ownerName: string;
  } | null>(null);

  const active = pipelines.find((p) => p.id === activeId) ?? pipelines[0];
  if (!active) return <p className="p-6 text-[13px] text-text-muted">No pipelines yet.</p>;

  const stages: BoardStage[] = active.stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color ?? "#16a34a",
  }));

  const activeDeals = useMemo(() => {
    return deals.filter((d) => {
      if (d.pipelineId !== active.id) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchAccount = d.account?.name?.toLowerCase().includes(q);
        const matchOwner = d.owner?.name?.toLowerCase().includes(q);
        const matchProduct = d.product?.name?.toLowerCase().includes(q);
        const matchContact = d.account?.contacts?.some((c) =>
          c.name.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchAccount && !matchOwner && !matchProduct && !matchContact) {
          return false;
        }
      }
      return true;
    });
  }, [deals, active.id, searchQuery]);

  const cards: BoardCard[] = useMemo(() => {
    return activeDeals.map((d) => {
      const contact = d.account?.contacts?.[0];

      // Build chronological stage history dates
      const dateHistory: Array<{ stageName: string; date: string }> = [];

      // 1. Initial creation
      if (d.createdAt) {
        dateHistory.push({
          stageName: "Added",
          date: formatDateShort(d.createdAt),
        });
      }

      // 2. Subsequent stage transitions
      if (d.stageHistory && Array.isArray(d.stageHistory)) {
        for (const sh of d.stageHistory) {
          const sName = sh.toStage?.name || "Stage";
          // Avoid duplicate adjacent stage names
          if (
            dateHistory.length === 0 ||
            dateHistory[dateHistory.length - 1].stageName !== sName
          ) {
            dateHistory.push({
              stageName: sName,
              date: formatDateShort(sh.changedAt),
            });
          }
        }
      }

      // Contact name as title (fallback to deal title), Company as subtitle
      const displayTitle = contact ? contact.name : d.title;
      const displaySubtitle = d.account?.name ?? "Independent Account";

      return {
        id: d.id,
        title: displayTitle,
        subtitle: displaySubtitle,
        productName: d.product?.name ?? undefined,
        owner: d.owner ? { id: d.owner.id, name: d.owner.name } : null,
        dateHistory: dateHistory.length > 0 ? dateHistory : undefined,
        meta: d.value ? `${d.currency ?? "SAR"} ${d.value.toLocaleString()}` : undefined,
        stageId: d.stageId,
        contact: contact
          ? { id: contact.id, name: contact.name, title: contact.title ?? undefined }
          : undefined,
        sectionId: d.pipelineId,
        sectionName: active.name,
        href: `/deals/${d.id}`,
      };
    });
  }, [activeDeals, active.name]);

  // Selection handlers
  function toggleSelectCard(cardId: string) {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }

  function handleSelectAll() {
    if (selectedCardIds.length === activeDeals.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(activeDeals.map((d) => d.id));
    }
  }

  function handleClearSelection() {
    setSelectedCardIds([]);
  }

  // Single card reassignment request (triggers confirmation)
  function handleRequestChangeOwner(cardId: string, newOwnerId: string) {
    const deal = deals.find((d) => d.id === cardId);
    const member = members.find((m) => m.id === newOwnerId);
    if (!deal || !member) return;

    setReassignCardPending({
      cardId,
      newOwnerId,
      dealTitle: deal.title,
      ownerName: member.name || "Selected Member",
    });
  }

  // Execute single card reassignment
  async function confirmSingleReassign() {
    if (!reassignCardPending) return;
    try {
      await updateDealOwner(reassignCardPending.cardId, reassignCardPending.newOwnerId);
      toast.success(
        `Deal "${reassignCardPending.dealTitle}" assigned to ${reassignCardPending.ownerName}!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update deal owner.");
    } finally {
      setReassignCardPending(null);
    }
  }

  // Execute bulk reassignment
  async function confirmBulkReassign() {
    if (!selectedCardIds.length || !bulkOwnerId) return;
    setIsUpdatingBulk(true);
    const member = members.find((m) => m.id === bulkOwnerId);

    try {
      await bulkUpdateDealOwners(selectedCardIds, bulkOwnerId);
      toast.success(
        `Assigned ${selectedCardIds.length} deals to ${member?.name || "new owner"}!`
      );
      setSelectedCardIds([]);
      setBulkOwnerId("");
      setConfirmBulkModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk update owners.");
    } finally {
      setIsUpdatingBulk(false);
    }
  }

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    setCreatingPipeline(true);
    try {
      const p = await createPipeline(newPipelineName.trim(), "DEAL");
      setActiveId(p.id);
      setNewPipelineName("");
      setPipelineModalOpen(false);
      toast.success(`Pipeline "${p.name}" created!`);
    } catch (err) {
      toast.error("Failed to create pipeline.");
    } finally {
      setCreatingPipeline(false);
    }
  }

  async function handleRenamePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!pipelineToEdit || !editPipelineName.trim()) return;

    setRenamingPipeline(true);
    try {
      await renamePipeline(pipelineToEdit.id, editPipelineName.trim());
      toast.success(`Pipeline renamed to "${editPipelineName.trim()}"!`);
      setEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename pipeline.");
    } finally {
      setRenamingPipeline(false);
    }
  }

  async function handleDeletePipeline() {
    if (!pipelineToDelete) return;

    setDeletingPipeline(true);
    try {
      const res = await deletePipeline(pipelineToDelete.id);
      toast.success(
        `Pipeline "${pipelineToDelete.name}" deleted. Deals moved to Main Pipeline.`
      );
      if (res.fallbackId) {
        setActiveId(res.fallbackId);
      }
      setDeleteModalOpen(false);
      setPipelineToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete pipeline.");
    } finally {
      setDeletingPipeline(false);
    }
  }

  function openEditModal(p: Pipeline, e: React.MouseEvent) {
    e.stopPropagation();
    setPipelineToEdit(p);
    setEditPipelineName(p.name);
    setEditModalOpen(true);
  }

  function openDeleteModal(p: Pipeline, e: React.MouseEvent) {
    e.stopPropagation();
    setPipelineToDelete(p);
    setDeleteModalOpen(true);
  }

  async function handleMoveDealToPipeline(cardId: string, targetPipelineId: string) {
    const deal = deals.find((d) => d.id === cardId);
    const targetPipeline = pipelines.find((p) => p.id === targetPipelineId);
    if (!deal || !targetPipeline) return;

    try {
      await updateDealPipeline(cardId, targetPipelineId);
      toast.success(`Moved deal "${deal.title}" to pipeline "${targetPipeline.name}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to move deal to pipeline.");
    }
  }

  async function handleDeleteDeal(cardId: string) {
    const deal = deals.find((d) => d.id === cardId);
    if (!deal) return;
    if (!confirm(`Are you sure you want to delete deal "${deal.title}"?`)) return;

    try {
      await deleteDeal(cardId);
      toast.success(`Deal "${deal.title}" deleted.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete deal.");
    }
  }

  return (
    <div className="flex h-full flex-col space-y-3">
      {/* Top Filter and Pipeline Switcher Bar */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {pipelines.map((p) => {
            const isSelected = active.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`group/pill relative flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-ink text-white shadow-sm"
                    : "border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                <span>{p.name}</span>

                {p.isDefault ? (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                    title="Main Default Pipeline"
                  >
                    <ShieldCheck size={10} />
                    <span>Main</span>
                  </span>
                ) : (
                  <div
                    className={`flex items-center gap-0.5 ml-1 ${
                      isSelected ? "opacity-90" : "opacity-0 group-hover/pill:opacity-100"
                    } transition-opacity`}
                  >
                    <button
                      type="button"
                      onClick={(e) => openEditModal(p, e)}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? "hover:bg-white/20 text-white"
                          : "hover:bg-slate-200 text-slate-500"
                      }`}
                      title="Rename pipeline"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openDeleteModal(p, e)}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected
                          ? "hover:bg-rose-500/30 text-rose-200 hover:text-white"
                          : "hover:bg-rose-50 text-rose-500"
                      }`}
                      title="Delete pipeline (e.g. Money2020)"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setPipelineModalOpen(true)}
            className="flex items-center gap-1 rounded-2xl border border-dashed border-border-strong px-3 py-1.5 text-[12px] font-semibold text-text-muted hover:border-indigo-500 hover:text-indigo-600 shrink-0 transition-colors"
          >
            <Plus size={13} />
            <span>New Pipeline</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Select All Toggle */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-[12px] font-semibold text-text transition-colors shrink-0"
            title={
              selectedCardIds.length === activeDeals.length
                ? "Deselect All"
                : "Select All Visible Deals"
            }
          >
            {selectedCardIds.length > 0 && selectedCardIds.length === activeDeals.length ? (
              <CheckSquare size={14} className="text-brand" />
            ) : (
              <Square size={14} className="text-text-muted" />
            )}
            <span>
              {selectedCardIds.length > 0
                ? `${selectedCardIds.length} Selected`
                : "Select All"}
            </span>
          </button>

          {/* Search bar */}
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-text-faint" />
            <input
              type="text"
              placeholder="Search deals in pipeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 py-1.5 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-ink transition-colors"
            />
          </div>

          <button
            onClick={() => setDealModalOpen(true)}
            disabled={stages.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand,#4361ee)] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 shadow-sm transition-all shrink-0 disabled:opacity-50"
          >
            <Plus size={14} />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when deals are selected */}
      {selectedCardIds.length > 0 && (
        <div className="card p-3 bg-brand/10 border-brand/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-bold text-text">
              {selectedCardIds.length} deal{selectedCardIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-[11px] font-semibold text-text-muted hover:text-text underline ml-2"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-medium text-text-muted hidden md:inline">
              Reassign to:
            </span>
            <select
              value={bulkOwnerId}
              onChange={(e) => setBulkOwnerId(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
            >
              <option value="">Choose Team Member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || "Unnamed Rep"}
                </option>
              ))}
            </select>

            <button
              disabled={!bulkOwnerId}
              onClick={() => setConfirmBulkModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                bulkOwnerId
                  ? "bg-brand text-white hover:opacity-90 active:scale-95"
                  : "bg-surface-2 text-text-muted cursor-not-allowed border border-border"
              }`}
            >
              <UserCheck size={13} />
              <span>Assign Ownership</span>
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden card p-1">
        <KanbanBoard
          initialStages={stages}
          initialCards={cards}
          selectable={true}
          selectedCardIds={selectedCardIds}
          onToggleSelectCard={toggleSelectCard}
          members={members}
          onChangeOwner={handleRequestChangeOwner}
          onMoveCard={(cardId, stageId) => {
            startTransition(async () => {
              await moveDealStage(cardId, stageId);
            });
          }}
          onRenameStage={(stageId, name) => {
            startTransition(async () => {
              await renameStage(stageId, name);
            });
          }}
          onAddStage={(name) => {
            startTransition(async () => {
              await addStage(active.id, name);
            });
          }}
          onCardClick={(cardId) => {
            router.push(`/deals/${cardId}`);
          }}
          onEditCard={(cardId) => {
            router.push(`/deals/${cardId}`);
          }}
          onMoveCardToSection={handleMoveDealToPipeline}
          onDeleteCard={handleDeleteDeal}
          sections={pipelines.map((p) => ({
            id: p.id,
            name: p.name,
            isDefault: p.isDefault,
          }))}
        />
      </div>

      {/* Deal Modal */}
      {dealModalOpen && (
        <DealModal
          open={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          defaultPipelineId={active.id}
          pipelines={pipelines}
          accounts={accounts}
          members={members}
        />
      )}

      {/* New Pipeline Modal Window */}
      {pipelineModalOpen && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Create New Pipeline</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  e.g. Money2020, LEAP 2026, Partnerships
                </p>
              </div>
              <button
                onClick={() => setPipelineModalOpen(false)}
                className="p-1.5 rounded-xl text-text-faint hover:bg-surface-2 hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Pipeline Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Money2020 Exhibition"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-xs text-text outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPipelineModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-semibold text-text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPipeline}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-ink text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {creatingPipeline && <Loader2 size={13} className="animate-spin" />}
                  <span>Create Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Rename Pipeline Modal */}
      {editModalOpen && pipelineToEdit && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">Rename Pipeline</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Update display title for this pipeline
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl text-text-faint hover:bg-surface-2 hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRenamePipeline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Pipeline Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPipelineName}
                  onChange={(e) => setEditPipelineName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-xs text-text outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-semibold text-text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renamingPipeline}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-ink text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {renamingPipeline && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Pipeline Confirmation Modal */}
      {deleteModalOpen && pipelineToDelete && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text">
                  Delete &ldquo;{pipelineToDelete.name}&rdquo;?
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  Are you sure you want to remove this campaign pipeline?
                </p>
                <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-700 leading-relaxed">
                  <strong>Safe Migration:</strong> Any open deals in &ldquo;{pipelineToDelete.name}&rdquo; will be automatically moved to the <strong>Main Sales Pipeline</strong> so you won&apos;t lose any deals or revenue data.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                disabled={deletingPipeline}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-full border border-border text-xs font-semibold text-text-muted hover:bg-surface-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPipeline}
                onClick={handleDeletePipeline}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 shadow-sm"
              >
                {deletingPipeline && <Loader2 size={13} className="animate-spin" />}
                <span>Delete Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Card Ownership Reassignment */}
      {reassignCardPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-sm w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-brand">
              <AlertCircle size={20} />
              <h3 className="text-sm font-bold text-text">Confirm Deal Ownership Change</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to assign deal{" "}
              <strong className="text-text">{reassignCardPending.dealTitle}</strong> to{" "}
              <strong className="text-brand">{reassignCardPending.ownerName}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setReassignCardPending(null)}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSingleReassign}
                className="px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-ink)",
                  color: "var(--color-ink-fg, #ffffff)",
                }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Bulk Reassignment */}
      {confirmBulkModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-brand">
              <Users size={20} />
              <h3 className="text-sm font-bold text-text">Confirm Bulk Ownership Change</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              You have selected <strong className="text-text">{selectedCardIds.length} deals</strong>.
              Are you sure you want to reassign all of them to{" "}
              <strong className="text-brand">
                {members.find((m) => m.id === bulkOwnerId)?.name || "selected rep"}
              </strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                disabled={isUpdatingBulk}
                onClick={() => setConfirmBulkModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingBulk}
                onClick={confirmBulkReassign}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-ink)",
                  color: "var(--color-ink-fg, #ffffff)",
                }}
              >
                {isUpdatingBulk ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
