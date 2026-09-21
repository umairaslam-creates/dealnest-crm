"use client";

import React, { useState } from "react";
import { X, Calendar, Flag, User, Handshake, Users, Loader2 } from "lucide-react";
import { createTask, updateTask } from "@/app/actions";
import { useToast } from "./toast-context";

export type TaskEntity = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: Date | string | null;
  done: boolean;
  ownerId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
};

export function TaskModal({
  open,
  onClose,
  taskToEdit,
  deals = [],
  leads = [],
  members = [],
  defaultDealId,
  defaultLeadId,
}: {
  open: boolean;
  onClose: () => void;
  taskToEdit?: TaskEntity | null;
  deals?: { id: string; title: string }[];
  leads?: { id: string; contactName: string; company?: string | null }[];
  members?: { id: string; name: string | null }[];
  defaultDealId?: string;
  defaultLeadId?: string;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(taskToEdit?.title ?? "");
  const [description, setDescription] = useState(taskToEdit?.description ?? "");
  const [priority, setPriority] = useState(taskToEdit?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState<string>(
    taskToEdit?.dueDate
      ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [ownerId, setOwnerId] = useState(taskToEdit?.ownerId ?? "");
  const [associationType, setAssociationType] = useState<"none" | "deal" | "lead">(
    taskToEdit?.dealId || defaultDealId
      ? "deal"
      : taskToEdit?.leadId || defaultLeadId
        ? "lead"
        : "none"
  );
  const [dealId, setDealId] = useState(taskToEdit?.dealId ?? defaultDealId ?? "");
  const [leadId, setLeadId] = useState(taskToEdit?.leadId ?? defaultLeadId ?? "");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedDueDate = dueDate ? new Date(dueDate) : undefined;
      const finalDealId = associationType === "deal" ? dealId || undefined : undefined;
      const finalLeadId = associationType === "lead" ? leadId || undefined : undefined;

      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: selectedDueDate ?? null,
          ownerId: ownerId || null,
          dealId: finalDealId ?? null,
          leadId: finalLeadId ?? null,
        });
        toast.success("Task updated successfully!");
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: selectedDueDate,
          ownerId: ownerId || undefined,
          dealId: finalDealId,
          leadId: finalLeadId,
        });
        toast.success("Task created successfully!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-border-strong bg-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="text-[12px] text-text-muted">
              {taskToEdit ? "Update task schedule and assignment" : "Track follow-ups, calls, or deadlines"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-faint hover:bg-surface hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-text mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Follow up on proposal contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-text placeholder:text-text-faint outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-text mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add extra context, talking points, or link to docs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text placeholder:text-text-faint outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Flag size={13} className="text-text-muted" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
              >
                <option value="HIGH">🔴 High Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="LOW">🔵 Low Priority</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Calendar size={13} className="text-text-muted" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <User size={13} className="text-text-muted" /> Assignee
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? "Team Member"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Link Record
              </label>
              <select
                value={associationType}
                onChange={(e) => setAssociationType(e.target.value as any)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
              >
                <option value="none">Standalone (No link)</option>
                <option value="deal">Link to Deal</option>
                <option value="lead">Link to Lead</option>
              </select>
            </div>
          </div>

          {associationType === "deal" && (
            <div className="rounded-xl bg-surface-2 p-3 border border-border">
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-text mb-1.5">
                <Handshake size={13} className="text-emerald-600" /> Select Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[13px] text-text outline-none"
              >
                <option value="">Select a deal...</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {associationType === "lead" && (
            <div className="rounded-xl bg-surface-2 p-3 border border-border">
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-text mb-1.5">
                <Users size={13} className="text-blue-600" /> Select Lead
              </label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[13px] text-text outline-none"
              >
                <option value="">Select a lead...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.contactName} {l.company ? `(${l.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

