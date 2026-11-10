"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  Building,
  CheckSquare,
  Square,
  UserCheck,
  AlertCircle,
  X,
  ShieldCheck,
  Loader2,
  Tag,
  FolderPlus,
  Pencil,
  Trash2,
  Filter,
  Check,
  Palette,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { KanbanBoard, type BoardCard, type BoardStage } from "@/components/kanban-board";
import {
  moveLeadStage,
  renameStage,
  addStage,
  updateLeadOwner,
  bulkUpdateLeadOwners,
  createPipeline,
  renamePipeline,
  deletePipeline,
  updateLeadTags,
  bulkUpdateLeadTags,
  updateLeadPipeline,
  bulkUpdateLeadPipeline,
  deleteLead,
  reorderStages,
} from "@/app/actions";
import { ImportLeadsButton } from "./import-leads-button";
import { ConvertLeadModal } from "./convert-lead-modal";
import { LeadModal, LeadEntity } from "./lead-modal";
import { LeadDetailDrawer } from "./lead-detail-drawer";
import { useToast } from "@/components/toast-context";

type Stage = { id: string; name: string; color: string | null; order: number };
type Pipeline = { id: string; name: string; isDefault?: boolean; stages: Stage[] };
type DealPipeline = { id: string; name: string; stages: { id: string; name: string }[] };

export type CustomLabel = {
  id: string;
  name: string;
  color: string;
};

const DEFAULT_LABELS: CustomLabel[] = [
  { id: "hot", name: "Hot", color: "#ef4444" },
  { id: "warm", name: "Warm", color: "#f59e0b" },
  { id: "cold", name: "Cold", color: "#3b82f6" },
  { id: "inbound", name: "Inbound", color: "#10b981" },
  { id: "outbound", name: "Outbound", color: "#8b5cf6" },
  { id: "vip", name: "VIP", color: "#ec4899" },
];

const PRESET_LABEL_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function summarizeText(value?: string | null, fallback = "") {
  const cleaned = (value || "")
    .replace(/\s+/g, " ")
    .replace(/^AI Copilot moved lead/i, "Moved lead")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 110 ? `${cleaned.slice(0, 107)}...` : cleaned;
}

function activityTypeLabel(type?: string | null) {
  const label = (type || "NOTE").toLowerCase();
  if (label === "meeting") return "meeting";
  if (label === "call") return "call";
  if (label === "email") return "email";
  return "note";
}

function normalizeStageName(name?: string | null) {
  const normalized = (name || "Unassigned").trim().toLowerCase().replace(/\s+/g, " ");
  if (["new", "new contact", "new contacts"].includes(normalized)) return "new contact";
  if (["meeting", "meetings", "meeting scheduled", "meetings scheduled"].includes(normalized)) {
    return "meeting scheduled";
  }
  return normalized;
}

function displayStageName(name?: string | null) {
  const normalized = normalizeStageName(name);
  if (normalized === "new contact") return "New Contact";
  if (normalized === "meeting scheduled") return "Meeting Scheduled";
  return name?.trim() || "Unassigned";
}

function aggregateStageId(name?: string | null) {
  return `all-stage:${normalizeStageName(name)}`;
}

export function LeadsClient({
  pipelines = [],
  leads = [],
  dealPipelines = [],
  members = [],
  accounts = [],
}: {
  pipelines: Pipeline[];
  leads: any[];
  dealPipelines: DealPipeline[];
  members?: { id: string; name: string | null }[];
  accounts?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [, startTransition] = useTransition();

  // Section / Campaign switcher state
  // "ALL" shows all leads across all pipelines; or string pipeline.id
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    if (typeof window === "undefined") return "ALL";
    const sectionFromUrl = new URLSearchParams(window.location.search).get("section");
    if (sectionFromUrl) return sectionFromUrl;
    try {
      return localStorage.getItem("dealnest_active_lead_section") || "ALL";
    } catch {
      return "ALL";
    }
  });

  function switchSection(sectionId: string) {
    setActiveSectionId(sectionId);
    setSelectedCardIds([]);
    try {
      localStorage.setItem("dealnest_active_lead_section", sectionId);
      const nextUrl = sectionId === "ALL" ? "/leads" : `/leads?section=${encodeURIComponent(sectionId)}`;
      window.history.replaceState(null, "", nextUrl);
    } catch {}
  }

  // Section creation modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  // Section rename modal
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [sectionToRename, setSectionToRename] = useState<Pipeline | null>(null);
  const [renameSectionName, setRenameSectionName] = useState("");
  const [renamingSection, setRenamingSection] = useState(false);

  // Section delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Pipeline | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // Custom Labels system (persisted in localStorage)
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");

  // Load custom labels from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mytm_custom_lead_labels");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomLabels(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse custom labels from localStorage", e);
    }
  }, []);

  useEffect(() => {
    const sectionFromUrl = searchParams.get("section");
    let sectionToUse = sectionFromUrl || "";
    try {
      sectionToUse ||= localStorage.getItem("dealnest_active_lead_section") || "";
    } catch {}

    if (sectionToUse && sectionToUse !== "ALL" && pipelines.some((p) => p.id === sectionToUse)) {
      setActiveSectionId(sectionToUse);
    }
  }, [pipelines, searchParams]);

  function saveCustomLabels(updated: CustomLabel[]) {
    setCustomLabels(updated);
    try {
      localStorage.setItem("mytm_custom_lead_labels", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom labels", e);
    }
  }

  // Merged available labels (Defaults + Custom, deduplicated by name)
  const allAvailableLabels = useMemo(() => {
    const list = [...DEFAULT_LABELS];
    for (const cl of customLabels) {
      if (!list.some((l) => l.name.toLowerCase() === cl.name.toLowerCase())) {
        list.push(cl);
      }
    }
    return list;
  }, [customLabels]);

  // Modals & Drawer state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadEntity | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [convertingLead, setConvertingLead] = useState<{ id: string; name: string } | null>(null);

  // Multi-selection state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [bulkOwnerId, setBulkOwnerId] = useState<string>("");
  const [bulkSectionId, setBulkSectionId] = useState<string>("");
  const [bulkLabelToAdd, setBulkLabelToAdd] = useState<string>("");
  const [confirmBulkModalOpen, setConfirmBulkModalOpen] = useState(false);
  const [confirmBulkSectionModalOpen, setConfirmBulkSectionModalOpen] = useState(false);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Single card reassignment confirmation
  const [reassignCardPending, setReassignCardPending] = useState<{
    cardId: string;
    newOwnerId: string;
    leadName: string;
    ownerName: string;
  } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>("ALL");
  const [scoreFilter, setScoreFilter] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");

  // Fallback active pipeline for stage definitions
  const defaultPipeline = useMemo(() => {
    return pipelines.find((p) => p.isDefault) || pipelines[0] || null;
  }, [pipelines]);

  const activePipeline = useMemo(() => {
    if (activeSectionId === "ALL") {
      return defaultPipeline;
    }
    return pipelines.find((p) => p.id === activeSectionId) || defaultPipeline;
  }, [activeSectionId, pipelines, defaultPipeline]);

  if (!defaultPipeline) {
    return <p className="p-4 text-[13px] text-text-muted">No lead pipeline set up yet.</p>;
  }

  // Stages displayed on the Kanban board
  const boardStages: BoardStage[] = useMemo(() => {
    if (activeSectionId === "ALL") {
      const stageMap = new Map<string, BoardStage & { order: number }>();

      for (const pipeline of pipelines) {
        for (const stage of pipeline.stages) {
          const key = normalizeStageName(stage.name);
          const existing = stageMap.get(key);
          if (!existing || stage.order < existing.order) {
            stageMap.set(key, {
              id: aggregateStageId(stage.name),
              name: displayStageName(stage.name),
              color: stage.color ?? existing?.color ?? "#6b6d72",
              order: stage.order,
            });
          }
        }
      }

      return Array.from(stageMap.values())
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map(({ order, ...stage }) => stage);
    }

    const p = activePipeline || defaultPipeline;
    if (!p) return [];
    return p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color ?? "#6b6d72",
    }));
  }, [activePipeline, defaultPipeline, activeSectionId, pipelines]);

  // Selected lead for detail drawer
  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l.id === selectedLeadId) ?? null;
  }, [leads, selectedLeadId]);

  // Filtered leads based on active section and filter criteria
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Section filter
      if (activeSectionId !== "ALL") {
        if (l.pipelineId !== activeSectionId) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.contactName?.toLowerCase().includes(q);
        const matchTitle = l.title?.toLowerCase().includes(q);
        const matchCompany = l.company?.toLowerCase().includes(q);
        const matchWebsite = l.website?.toLowerCase().includes(q);
        const matchSource = l.source?.toLowerCase().includes(q);
        const matchOwner = l.owner?.name?.toLowerCase().includes(q);
        const matchProduct = l.productInterest?.toLowerCase().includes(q);
        const matchCity = l.city?.toLowerCase().includes(q);
        const matchTags = l.tags?.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchTitle &&
          !matchCompany &&
          !matchWebsite &&
          !matchSource &&
          !matchOwner &&
          !matchProduct &&
          !matchCity &&
          !matchTags
        ) {
          return false;
        }
      }

      // 3. Label / Tag filter
      if (selectedLabelFilter !== "ALL") {
        let hasLabel = false;
        if (l.tags) {
          try {
            const parsed = JSON.parse(l.tags);
            if (Array.isArray(parsed) && parsed.includes(selectedLabelFilter)) {
              hasLabel = true;
            }
          } catch {}
        }
        // Also check if label corresponds to temperature score
        if (!hasLabel && l.score?.toLowerCase() === selectedLabelFilter.toLowerCase()) {
          hasLabel = true;
        }
        if (!hasLabel) return false;
      }

      // 4. Score filter
      if (scoreFilter !== "ALL" && l.score !== scoreFilter) {
        return false;
      }

      // 5. Owner filter
      if (ownerFilter !== "ALL") {
        if (ownerFilter === "UNASSIGNED") {
          if (l.ownerId) return false;
        } else if (l.ownerId !== ownerFilter) {
          return false;
        }
      }

      return Boolean(l.stageId);
    });
  }, [leads, activeSectionId, searchQuery, selectedLabelFilter, scoreFilter, ownerFilter]);

  // Build BoardCards with custom labels and history timestamps
  const cards: BoardCard[] = useMemo(() => {
    const firstStageId = boardStages[0]?.id || "";
    const stageIdSet = new Set(boardStages.map((s) => s.id));

    return filteredLeads.map((l) => {
      // Build stage history timestamps
      const dateHistory: Array<{ stageName: string; date: string }> = [];
      if (l.createdAt) {
        dateHistory.push({
          stageName: "Added",
          date: formatDateShort(l.createdAt),
        });
      }
      if (l.stageHistory && Array.isArray(l.stageHistory)) {
        const orderedStageHistory = [...l.stageHistory].sort(
          (a: any, b: any) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
        );
        for (const sh of orderedStageHistory) {
          const sName = sh.toStage?.name || "Stage";
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

      // Map tags to colorful badges
      const cardTags: Array<{ label: string; color?: string }> = [];
      if (l.tags) {
        try {
          const parsed = JSON.parse(l.tags);
          if (Array.isArray(parsed)) {
            for (const tagStr of parsed) {
              const matched = allAvailableLabels.find(
                (al) => al.name.toLowerCase() === String(tagStr).toLowerCase()
              );
              cardTags.push({
                label: String(tagStr),
                color: matched?.color || "#6366f1",
              });
            }
          }
        } catch {}
      }

      let effectiveStageId = l.stageId!;
      if (activeSectionId === "ALL") {
        effectiveStageId = aggregateStageId(l.stage?.name);
      } else if (!stageIdSet.has(effectiveStageId)) {
        const matchingByName = boardStages.find(
          (bs) => normalizeStageName(bs.name) === normalizeStageName(l.stage?.name)
        );
        effectiveStageId = matchingByName?.id || firstStageId;
      }

      const latestActivity = Array.isArray(l.activities) ? l.activities[0] : null;
      const nextTask = Array.isArray(l.tasks)
        ? l.tasks.find((task: any) => !task.done) || null
        : null;

      return {
        id: l.id,
        title: l.contactName,
        subtitle:
          l.title && l.company
            ? `${l.title} • ${l.company}`
            : l.title || l.company || "Individual Lead",
        stageId: effectiveStageId,
        companyName: l.company || l.account?.name || null,
        roleTitle: l.title || null,
        productName: l.productInterest || undefined,
        lastInteraction: latestActivity
          ? {
              type: activityTypeLabel(latestActivity.type),
              date: formatDateShort(latestActivity.occurredAt),
              summary: summarizeText(latestActivity.notes, "Interaction logged."),
            }
          : null,
        nextStep: nextTask
          ? {
              title: summarizeText(nextTask.title, "Follow up"),
              dueDate: nextTask.dueDate ? formatDateShort(nextTask.dueDate) : null,
            }
          : null,
        owner: l.owner ? { id: l.owner.id, name: l.owner.name } : null,
        dateHistory: dateHistory.length > 0 ? dateHistory : undefined,
        tags: cardTags.length > 0 ? cardTags : undefined,
        score: l.score?.toLowerCase() || null,
        source: l.source || null,
        sectionId: l.pipelineId,
        sectionName: l.pipeline?.name || pipelines.find((p) => p.id === l.pipelineId)?.name || null,
        meta: l.phone || l.email || undefined,
        tag: l.source
          ? { label: l.source, tone: (l.score as any) ?? "neutral" }
          : undefined,
        href: `/leads/${l.id}?fromSection=${encodeURIComponent(activeSectionId)}`,
        actionLabel: dealPipelines.length > 0 ? "Move to Pipeline" : undefined,
      };
    });
  }, [filteredLeads, boardStages, allAvailableLabels, dealPipelines.length, pipelines, activeSectionId]);

  // Selection handlers
  function toggleSelectCard(cardId: string) {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }

  function handleSelectAll() {
    if (selectedCardIds.length === filteredLeads.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(filteredLeads.map((l) => l.id));
    }
  }

  function handleClearSelection() {
    setSelectedCardIds([]);
  }

  // Single card reassignment request
  function handleRequestChangeOwner(cardId: string, newOwnerId: string) {
    const lead = leads.find((l) => l.id === cardId);
    const member = members.find((m) => m.id === newOwnerId);
    if (!lead || !member) return;

    setReassignCardPending({
      cardId,
      newOwnerId,
      leadName: lead.contactName,
      ownerName: member.name || "Selected Member",
    });
  }

  async function confirmSingleReassign() {
    if (!reassignCardPending) return;
    try {
      await updateLeadOwner(reassignCardPending.cardId, reassignCardPending.newOwnerId);
      toast.success(
        `Lead "${reassignCardPending.leadName}" assigned to ${reassignCardPending.ownerName}!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead owner.");
    } finally {
      setReassignCardPending(null);
    }
  }

  // Bulk Reassignment of Owners
  async function confirmBulkReassign() {
    if (!selectedCardIds.length || !bulkOwnerId) return;
    setIsUpdatingBulk(true);
    const member = members.find((m) => m.id === bulkOwnerId);

    try {
      await bulkUpdateLeadOwners(selectedCardIds, bulkOwnerId);
      toast.success(
        `Assigned ${selectedCardIds.length} leads to ${member?.name || "new owner"}!`
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

  // Bulk Section / Campaign Reassignment
  async function confirmBulkSectionReassign() {
    if (!selectedCardIds.length || !bulkSectionId) return;
    setIsUpdatingBulk(true);
    const targetPipeline = pipelines.find((p) => p.id === bulkSectionId);

    try {
      await bulkUpdateLeadPipeline(selectedCardIds, bulkSectionId);
      toast.success(
        `Moved ${selectedCardIds.length} leads to section "${targetPipeline?.name || "Section"}"!`
      );
      setSelectedCardIds([]);
      setBulkSectionId("");
      setConfirmBulkSectionModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to move leads to section.");
    } finally {
      setIsUpdatingBulk(false);
    }
  }

  // Bulk Label Application
  async function handleBulkApplyLabel() {
    if (!selectedCardIds.length || !bulkLabelToAdd) return;
    setIsUpdatingBulk(true);
    try {
      await bulkUpdateLeadTags(selectedCardIds, [bulkLabelToAdd]);
      toast.success(`Tagged ${selectedCardIds.length} leads with "${bulkLabelToAdd}"!`);
      setSelectedCardIds([]);
      setBulkLabelToAdd("");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply labels.");
    } finally {
      setIsUpdatingBulk(false);
    }
  }

  // Section Management Handlers
  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setCreatingSection(true);
    try {
      const created = await createPipeline(newSectionName.trim(), "LEAD");
      toast.success(`Lead section "${created.name}" created!`);
      setNewSectionName("");
      setSectionModalOpen(false);
      setActiveSectionId(created.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create section.");
    } finally {
      setCreatingSection(false);
    }
  }

  async function handleRenameSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionToRename || !renameSectionName.trim()) return;

    setRenamingSection(true);
    try {
      await renamePipeline(sectionToRename.id, renameSectionName.trim());
      toast.success(`Section renamed to "${renameSectionName.trim()}"!`);
      setRenameModalOpen(false);
      setSectionToRename(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename section.");
    } finally {
      setRenamingSection(false);
    }
  }

  async function handleDeleteSection() {
    if (!sectionToDelete) return;

    setDeletingSection(true);
    try {
      const res = await deletePipeline(sectionToDelete.id);
      toast.success(`Section "${sectionToDelete.name}" deleted. Leads reassigned.`);
      if (res.fallbackId) {
        setActiveSectionId(res.fallbackId);
      } else {
        setActiveSectionId("ALL");
      }
      setDeleteModalOpen(false);
      setSectionToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete section.");
    } finally {
      setDeletingSection(false);
    }
  }

  // Custom Label Management Handlers
  function handleAddCustomLabel(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      toast.error("Label name cannot be empty.");
      return;
    }
    if (allAvailableLabels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Label "${trimmed}" already exists.`);
      return;
    }

    const newLabel: CustomLabel = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      color: newLabelColor,
    };
    const updated = [...customLabels, newLabel];
    saveCustomLabels(updated);
    setNewLabelName("");
    toast.success(`Created label "${trimmed}"!`);
  }

  function handleDeleteCustomLabel(labelId: string) {
    const updated = customLabels.filter((l) => l.id !== labelId);
    saveCustomLabels(updated);
    toast.success("Custom label removed.");
  }

  function handleOpenAddLead() {
    setEditingLead(null);
    setLeadModalOpen(true);
  }

  function handleEditLead(lead: any) {
    setEditingLead({
      id: lead.id,
      contactName: lead.contactName,
      title: lead.title,
      company: lead.company,
      website: lead.website,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      productInterest: lead.productInterest,
      region: lead.region,
      city: lead.city,
      value: lead.value,
      score: lead.score,
      stageId: lead.stageId,
      ownerId: lead.ownerId,
      pipelineId: lead.pipelineId,
      tags: lead.tags,
    });
    setLeadModalOpen(true);
  }

  const selectedMemberName = members.find((m) => m.id === bulkOwnerId)?.name || "selected rep";
  const selectedSectionName = pipelines.find((p) => p.id === bulkSectionId)?.name || "selected section";

  async function handleMoveSingleLeadToSection(cardId: string, targetSectionId: string) {
    const lead = leads.find((l) => l.id === cardId);
    const targetSection = pipelines.find((p) => p.id === targetSectionId);
    if (!lead || !targetSection) return;

    try {
      await updateLeadPipeline(cardId, targetSectionId);
      toast.success(`Moved "${lead.contactName}" to section "${targetSection.name}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to move lead to section.");
    }
  }

  async function handleDeleteSingleLead(cardId: string) {
    const lead = leads.find((l) => l.id === cardId);
    if (!lead) return;
    if (!confirm(`Are you sure you want to delete lead "${lead.contactName}"?`)) return;

    try {
      await deleteLead(cardId);
      toast.success(`Lead "${lead.contactName}" deleted.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lead.");
    }
  }

  function handleMoveLeadOnBoard(cardId: string, targetStageId: string) {
    if (activeSectionId !== "ALL") {
      startTransition(() => moveLeadStage(cardId, targetStageId));
      return;
    }

    const lead = leads.find((l) => l.id === cardId);
    const targetStage = boardStages.find((stage) => stage.id === targetStageId);
    const pipeline = pipelines.find((p) => p.id === lead?.pipelineId);
    const matchingStage = pipeline?.stages.find(
      (stage) => normalizeStageName(stage.name) === normalizeStageName(targetStage?.name)
    );

    if (!lead || !targetStage || !matchingStage) {
      toast.error("That stage does not exist in this lead's own section. Open the section to adjust its stages.");
      return;
    }

    startTransition(() => moveLeadStage(cardId, matchingStage.id));
  }

  async function handleToggleLeadTag(cardId: string, tagName: string) {
    const lead = leads.find((l) => l.id === cardId);
    if (!lead) return;

    let currentTags: string[] = [];
    try {
      if (lead.tags) currentTags = JSON.parse(lead.tags);
    } catch {}

    const updatedTags = currentTags.includes(tagName)
      ? currentTags.filter((t) => t !== tagName)
      : [...currentTags, tagName];

    try {
      await updateLeadTags(cardId, updatedTags);
      toast.success(`Updated tags for "${lead.contactName}".`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update tags.");
    }
  }

  return (
    <div className="flex h-full flex-col space-y-3">
      {/* 1. Top Section / Campaign Switcher Ribbon */}
      <div className="card p-2.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0 border border-border">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-bold text-text-faint uppercase tracking-wider pl-1 mr-1 flex items-center gap-1">
            <Layers size={13} className="text-brand" />
            <span>Sections:</span>
          </span>

          {/* "All Leads" Tab */}
          <button
            data-testid="section-tab-all"
            onClick={() => switchSection("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSectionId === "ALL"
                ? "bg-ink text-white shadow-sm"
                : "border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
            style={
              activeSectionId === "ALL"
                ? {
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }
                : undefined
            }
          >
            <span>All Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold ${
                activeSectionId === "ALL" ? "bg-white/20 text-white" : "bg-surface-2 text-text-muted"
              }`}
            >
              {leads.length}
            </span>
          </button>

          {/* Individual Section Tabs */}
          {pipelines.map((p) => {
            const isSelected = activeSectionId === p.id;
            const count = leads.filter((l) => l.pipelineId === p.id).length;
            return (
              <div
                data-testid={`section-tab-${p.id}`}
                key={p.id}
                onClick={() => switchSection(p.id)}
                className={`group/section relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-ink text-white shadow-sm"
                    : "border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: "var(--color-ink)",
                        color: "var(--color-ink-fg, #ffffff)",
                      }
                    : undefined
                }
              >
                <span>{p.name}</span>

                {p.isDefault && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.2 text-[9.5px] font-bold uppercase tracking-wider ${
                      isSelected ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                    title="Default Inbound Section"
                  >
                    <ShieldCheck size={10} />
                    <span>Main</span>
                  </span>
                )}

                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold ${
                    isSelected ? "bg-white/20 text-white" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  {count}
                </span>

                {/* Edit & Delete actions for non-default sections */}
                {!p.isDefault && (
                  <div className="flex items-center gap-0.5 ml-1 opacity-60 hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToRename(p);
                        setRenameSectionName(p.name);
                        setRenameModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-white/20 hover:text-white transition-colors"
                      title="Rename section"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSectionToDelete(p);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-rose-500/30 hover:text-rose-300 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* + Add Section / Campaign Button */}
          <button
            onClick={() => setSectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-border-strong hover:border-brand bg-surface hover:bg-brand/5 text-xs font-semibold text-text-muted hover:text-brand transition-all"
            title="Create a new lead campaign/section (e.g. Money 20/20, LEAP 2026)"
          >
            <FolderPlus size={13} />
            <span>+ Add Section / Campaign</span>
          </button>
        </div>

        {/* Quick Label Manager Trigger */}
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={() => setLabelManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-xs font-bold text-text transition-colors shrink-0"
          >
            <Tag size={13} className="text-brand" />
            <span>Custom Labels</span>
            {customLabels.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-brand" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Filter & Action Bar */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 border border-border">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Select All Toggle */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-[12px] font-semibold text-text transition-colors"
            title={
              selectedCardIds.length === filteredLeads.length
                ? "Deselect All"
                : "Select All Visible Leads"
            }
          >
            {selectedCardIds.length > 0 && selectedCardIds.length === filteredLeads.length ? (
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
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-2.5 text-text-faint" />
            <input
              data-testid="lead-search-input"
              type="text"
              placeholder="Search leads, company, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 py-1.5 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Filter by Label */}
          <div className="flex items-center gap-1">
            <select
              value={selectedLabelFilter}
              onChange={(e) => setSelectedLabelFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-semibold text-text outline-none focus:border-brand"
            >
              <option value="ALL">All Labels</option>
              {allAvailableLabels.map((lbl) => (
                <option key={lbl.id || lbl.name} value={lbl.name}>
                  🏷️ {lbl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature / Score filter */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-medium text-text outline-none focus:border-brand"
          >
            <option value="ALL">All Scores</option>
            <option value="hot">🔥 Hot Leads</option>
            <option value="warm">⚡ Warm Leads</option>
            <option value="cold">❄️ Cold Leads</option>
          </select>

          {/* Owner filter */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-medium text-text outline-none focus:border-brand hidden lg:inline-block"
          >
            <option value="ALL">All Owners</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || "Unnamed Rep"}
              </option>
            ))}
          </select>
        </div>

        {/* Right side actions: Import & Add Lead */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <ImportLeadsButton
            currentPipelineId={activePipeline.id}
            pipelines={pipelines}
            members={members}
            initialStages={boardStages.map((s) => ({ id: s.id, name: s.name }))}
          />

          <button
            onClick={handleOpenAddLead}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold shadow-md transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-ink)",
              color: "var(--color-ink-fg, #ffffff)",
            }}
          >
            <Plus size={14} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 3. Floating Bulk Action Ribbon (Multi-Selection) */}
      {selectedCardIds.length > 0 && (
        <div className="card p-3 bg-brand/10 border-brand/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-bold text-text">
              {selectedCardIds.length} lead{selectedCardIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-[11px] font-semibold text-text-muted hover:text-text underline ml-2"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 1. Bulk Reassign Owner */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkOwnerId}
                onChange={(e) => setBulkOwnerId(e.target.value)}
                className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="">Assign Owner...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || "Unnamed Rep"}
                  </option>
                ))}
              </select>
              <button
                disabled={!bulkOwnerId || isUpdatingBulk}
                onClick={() => setConfirmBulkModalOpen(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  bulkOwnerId
                    ? "bg-brand text-white hover:bg-brand-hover active:scale-[0.98]"
                    : "bg-surface-2 text-text-faint cursor-not-allowed border border-border"
                }`}
                style={
                  bulkOwnerId
                    ? {
                        backgroundColor: "var(--color-brand)",
                        color: "var(--color-ink-fg, #ffffff)",
                      }
                    : undefined
                }
              >
                <UserCheck size={13} />
                <span>Assign</span>
              </button>
            </div>

            {/* 2. Bulk Move to Section / Campaign */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/80">
              <select
                value={bulkSectionId}
                onChange={(e) => setBulkSectionId(e.target.value)}
                className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="">Move to Section...</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!bulkSectionId || isUpdatingBulk}
                onClick={() => setConfirmBulkSectionModalOpen(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  bulkSectionId
                    ? "bg-brand text-white hover:bg-brand-hover active:scale-[0.98]"
                    : "bg-surface-2 text-text-faint cursor-not-allowed border border-border"
                }`}
                style={
                  bulkSectionId
                    ? {
                        backgroundColor: "var(--color-brand)",
                        color: "var(--color-ink-fg, #ffffff)",
                      }
                    : undefined
                }
              >
                <FolderPlus size={13} />
                <span>Move</span>
              </button>
            </div>

            {/* 3. Bulk Add Label */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/80">
              <select
                value={bulkLabelToAdd}
                onChange={(e) => setBulkLabelToAdd(e.target.value)}
                className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="">Add Label...</option>
                {allAvailableLabels.map((lbl) => (
                  <option key={lbl.id || lbl.name} value={lbl.name}>
                    🏷️ {lbl.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!bulkLabelToAdd || isUpdatingBulk}
                onClick={handleBulkApplyLabel}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                  bulkLabelToAdd
                    ? "bg-brand text-white hover:bg-brand-hover active:scale-[0.98]"
                    : "bg-surface-2 text-text-faint cursor-not-allowed border border-border"
                }`}
                style={
                  bulkLabelToAdd
                    ? {
                        backgroundColor: "var(--color-brand)",
                        color: "var(--color-ink-fg, #ffffff)",
                      }
                    : undefined
                }
              >
                <Tag size={13} />
                <span>Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Kanban Board */}
      <div className="flex-1 overflow-hidden card p-1 border border-border">
        <KanbanBoard
          initialStages={boardStages}
          initialCards={cards}
          selectable={true}
          selectedCardIds={selectedCardIds}
          onToggleSelectCard={toggleSelectCard}
          members={members}
          onChangeOwner={handleRequestChangeOwner}
          onMoveCard={handleMoveLeadOnBoard}
          onRenameStage={(stageId, name) =>
            activeSectionId === "ALL"
              ? toast.info("Open a specific section to rename its stages.")
              : startTransition(() => renameStage(stageId, name))
          }
          onAddStage={
            activeSectionId === "ALL"
              ? undefined
              : (name) => startTransition(() => addStage(activePipeline.id, name))
          }
          onReorderStages={
            activeSectionId === "ALL"
              ? undefined
              : (stageIds) =>
                  startTransition(async () => {
                    try {
                      await reorderStages(stageIds);
                      toast.success("Stage order saved.");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to reorder stages.");
                      router.refresh();
                    }
                  })
          }
          onCardClick={(cardId) => {
            router.push(`/leads/${cardId}?fromSection=${encodeURIComponent(activeSectionId)}`);
          }}
          onCardAction={(cardId) => {
            const lead = leads.find((l) => l.id === cardId);
            if (lead) setConvertingLead({ id: lead.id, name: lead.contactName });
          }}
          onEditCard={(cardId) => {
            const lead = leads.find((l) => l.id === cardId);
            if (lead) handleEditLead(lead);
          }}
          onMoveCardToSection={handleMoveSingleLeadToSection}
          onDeleteCard={handleDeleteSingleLead}
          onToggleCardTag={handleToggleLeadTag}
          sections={pipelines.map((p) => ({
            id: p.id,
            name: p.name,
            isDefault: p.isDefault,
          }))}
          availableLabels={allAvailableLabels}
        />
      </div>

      {/* Modal: Create Lead Section / Campaign */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand">
                <FolderPlus size={20} />
                <h3 className="text-sm font-bold text-text">Create Lead Section / Campaign</h3>
              </div>
              <button
                onClick={() => setSectionModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Add a custom section to organize leads by campaign, event, or source (e.g. "Money 20/20", "LEAP 2026", "Webinar Series").
            </p>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Money 20/20"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSection || !newSectionName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  {creatingSection && <Loader2 size={13} className="animate-spin" />}
                  <span>Create Section</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Lead Section */}
      {renameModalOpen && sectionToRename && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand">
                <Pencil size={18} />
                <h3 className="text-sm font-bold text-text">Rename Section</h3>
              </div>
              <button
                onClick={() => setRenameModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRenameSection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameSectionName}
                  onChange={(e) => setRenameSectionName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renamingSection || !renameSectionName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  {renamingSection && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Lead Section */}
      {deleteModalOpen && sectionToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle size={20} />
              <h3 className="text-sm font-bold text-text">Delete Lead Section</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to delete section{" "}
              <strong className="text-text font-bold">"{sectionToDelete.name}"</strong>? All leads in this section will be safely moved to your Main Inbound section.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                disabled={deletingSection}
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deletingSection}
                onClick={handleDeleteSection}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-[0.98]"
              >
                {deletingSection && <Loader2 size={13} className="animate-spin" />}
                <span>Delete Section</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Custom Label Manager */}
      {labelManagerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-brand">
                <Tag size={18} />
                <h3 className="text-sm font-bold text-text">Manage Custom Labels</h3>
              </div>
              <button
                onClick={() => setLabelManagerOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            {/* Create New Label Form */}
            <form onSubmit={handleAddCustomLabel} className="space-y-3 pt-1">
              <p className="text-xs font-semibold text-text">Create New Label:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Label name (e.g. Enterprise, Hot Lead, LEAP 2026)"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text outline-none focus:border-brand"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                  title="Choose custom color"
                />
              </div>

              {/* Preset color swatches */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-text-faint font-medium">Palette:</span>
                {PRESET_LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLabelColor(c)}
                    className={`h-5 w-5 rounded-full transition-transform ${
                      newLabelColor === c ? "scale-125 ring-2 ring-brand ring-offset-1" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Preview badge */}
              {newLabelName.trim() && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-text-muted">Preview:</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold border shadow-xs"
                    style={{
                      backgroundColor: `${newLabelColor}20`,
                      borderColor: `${newLabelColor}60`,
                      color: newLabelColor,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: newLabelColor }}
                    />
                    <span>{newLabelName.trim()}</span>
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!newLabelName.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  <Plus size={13} />
                  <span>Add Label</span>
                </button>
              </div>
            </form>

            {/* List of existing labels */}
            <div className="border-t border-border pt-3 space-y-2 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-text">Available Labels:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allAvailableLabels.map((lbl) => {
                  const isCustom = customLabels.some((cl) => cl.id === lbl.id);
                  return (
                    <div
                      key={lbl.id || lbl.name}
                      className="flex items-center justify-between p-2 rounded-xl border border-border bg-surface-2/60"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border"
                          style={{
                            backgroundColor: `${lbl.color}20`,
                            borderColor: `${lbl.color}50`,
                            color: lbl.color,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span>{lbl.name}</span>
                        </span>
                        {!isCustom && (
                          <span className="text-[10px] text-text-faint italic font-medium">
                            System
                          </span>
                        )}
                      </div>

                      {isCustom && (
                        <button
                          onClick={() => handleDeleteCustomLabel(lbl.id)}
                          className="p-1 rounded text-text-faint hover:text-rose-500 transition-colors"
                          title="Delete custom label"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setLabelManagerOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Lead */}
      {leadModalOpen && (
        <LeadModal
          open={leadModalOpen}
          onClose={() => setLeadModalOpen(false)}
          leadToEdit={editingLead}
          pipelineId={activePipeline.id}
          stages={boardStages.map((s) => ({ id: s.id, name: s.name }))}
          members={members}
          pipelines={pipelines.map((p) => ({ id: p.id, name: p.name }))}
          availableLabels={allAvailableLabels}
        />
      )}

      {/* Drawer: Lead Details */}
      {selectedLead && (
        <LeadDetailDrawer
          open={Boolean(selectedLead)}
          onClose={() => setSelectedLeadId(null)}
          lead={selectedLead}
          stages={boardStages.map((s) => ({ id: s.id, name: s.name }))}
          members={members}
          onEdit={(lead) => {
            setSelectedLeadId(null);
            handleEditLead(lead);
          }}
          onConvert={(lead) => {
            setSelectedLeadId(null);
            setConvertingLead({ id: lead.id, name: lead.contactName });
          }}
        />
      )}

      {/* Modal: Convert Lead to Deal */}
      {convertingLead && dealPipelines.length > 0 && (
        <ConvertLeadModal
          leadId={convertingLead.id}
          leadName={convertingLead.name}
          dealPipelines={dealPipelines}
          onClose={() => setConvertingLead(null)}
        />
      )}

      {/* Modal: Confirm Single Lead Reassignment */}
      {reassignCardPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-sm w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-brand">
              <UserCheck size={20} />
              <h3 className="text-sm font-bold text-text">Confirm Lead Ownership</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to assign lead{" "}
              <strong className="text-text">{reassignCardPending.leadName}</strong> to{" "}
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

      {/* Modal: Confirm Bulk Owner Reassignment */}
      {confirmBulkModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-brand">
              <Users size={20} />
              <h3 className="text-sm font-bold text-text">Confirm Bulk Ownership Change</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              You have selected <strong className="text-text">{selectedCardIds.length} leads</strong>.
              Are you sure you want to reassign all of them to{" "}
              <strong className="text-brand">{selectedMemberName}</strong>?
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

      {/* Modal: Confirm Bulk Move to Section */}
      {confirmBulkSectionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card max-w-md w-full p-5 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-2.5 text-brand">
              <FolderPlus size={20} />
              <h3 className="text-sm font-bold text-text">Confirm Section Move</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              You have selected <strong className="text-text">{selectedCardIds.length} leads</strong>.
              Are you sure you want to move them all to section{" "}
              <strong className="text-brand">"{selectedSectionName}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                disabled={isUpdatingBulk}
                onClick={() => setConfirmBulkSectionModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingBulk}
                onClick={confirmBulkSectionReassign}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-ink)",
                  color: "var(--color-ink-fg, #ffffff)",
                }}
              >
                {isUpdatingBulk ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Moving...</span>
                  </>
                ) : (
                  <span>Confirm Move</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
