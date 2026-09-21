"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Building,
  Calendar,
  User,
  Tag,
  MapPin,
  Flame,
  CheckSquare,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  StickyNote,
  Users,
  CheckCircle2,
} from "lucide-react";
import { moveLeadStage, deleteLead, logLeadActivity, toggleTask } from "@/app/actions";
import { TaskModal } from "@/components/task-modal";
import { useToast } from "@/components/toast-context";

export function LeadDetailDrawer({
  open,
  onClose,
  lead,
  stages = [],
  members = [],
  onEdit,
  onConvert,
}: {
  open: boolean;
  onClose: () => void;
  lead: any;
  stages: { id: string; name: string }[];
  members: { id: string; name: string | null }[];
  onEdit: (lead: any) => void;
  onConvert: (lead: any) => void;
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "activities" | "tasks">("details");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteType, setNoteType] = useState<"CALL" | "MEETING" | "NOTE" | "EMAIL">("NOTE");
  const [noteText, setNoteText] = useState("");
  const [loggingNote, setLoggingNote] = useState(false);

  if (!open || !lead) return null;

  async function handleStageChange(newStageId: string) {
    try {
      await moveLeadStage(lead.id, newStageId);
      toast.success("Lead stage updated.");
    } catch (err) {
      toast.error("Failed to update stage.");
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete lead "${lead.contactName}"?`)) return;
    try {
      await deleteLead(lead.id);
      toast.success("Lead deleted.");
      onClose();
    } catch (err) {
      toast.error("Failed to delete lead.");
    }
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLoggingNote(true);
    try {
      await logLeadActivity({
        leadId: lead.id,
        type: noteType,
        notes: noteText.trim(),
      });
      setNoteText("");
      toast.success("Activity logged!");
    } catch (err) {
      toast.error("Failed to log activity.");
    } finally {
      setLoggingNote(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[9985] bg-ink/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-[9986] w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border bg-surface-2/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-text">{lead.contactName}</h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    lead.score === "hot"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : lead.score === "cold"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {lead.score || "Warm"}
                </span>
              </div>
              <p className="text-[13px] text-text-muted mt-0.5 flex items-center gap-1.5">
                <Building size={13} className="text-text-faint" />
                {lead.company || "Independent Contact"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-faint hover:bg-surface hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Stage Switcher */}
          <div className="mt-4 flex items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-border">
            <span className="text-[12px] font-medium text-text-muted pl-1">Stage</span>
            <select
              value={lead.stageId ?? ""}
              onChange={(e) => handleStageChange(e.target.value)}
              className="rounded-lg border border-border-strong bg-surface-2 px-2.5 py-1 text-[12.5px] font-medium text-text outline-none focus:border-ink"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Contact Buttons & Convert CTA */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-[12px] font-medium text-text transition-colors"
              >
                <Mail size={13} className="text-text-muted" />
                <span>Email</span>
              </a>
            ) : (
              <span className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-border/50 bg-surface/50 text-[12px] font-medium text-text-faint opacity-50 cursor-not-allowed">
                <Mail size={13} />
                <span>Email</span>
              </span>
            )}

            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-[12px] font-medium text-text transition-colors"
              >
                <Phone size={13} className="text-text-muted" />
                <span>Call</span>
              </a>
            ) : (
              <span className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-border/50 bg-surface/50 text-[12px] font-medium text-text-faint opacity-50 cursor-not-allowed">
                <Phone size={13} />
                <span>Call</span>
              </span>
            )}

            <button
              onClick={() => onConvert(lead)}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] font-bold shadow-xs transition-colors active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-ink-fg, #ffffff)",
              }}
            >
              <span>Convert</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border bg-surface-2/20 px-5 pt-2">
          {(
            [
              { id: "details", label: "Profile" },
              { id: "activities", label: `Notes & Log (${lead.activities?.length ?? 0})` },
              { id: "tasks", label: `Tasks (${lead.tasks?.length ?? 0})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-ink text-text"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "details" && (
            <div className="space-y-3">
              <div className="card p-3.5 space-y-2.5">
                <h3 className="text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                  <div>
                    <span className="text-text-faint block text-[11px]">Email</span>
                    <span className="font-medium text-text">{lead.email || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block text-[11px]">Phone</span>
                    <span className="font-medium text-text">{lead.phone || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div className="card p-3.5 space-y-2.5">
                <h3 className="text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                  Lead Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div>
                    <span className="text-text-faint block text-[11px]">Product Interest</span>
                    <span className="font-medium text-text">{lead.productInterest || "General"}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block text-[11px]">Source</span>
                    <span className="font-medium text-text">{lead.source || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block text-[11px]">Region</span>
                    <span className="font-medium text-text">{lead.region || "KSA"}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block text-[11px]">Assigned Owner</span>
                    <span className="font-medium text-text">{lead.owner?.name || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              {/* Section & Tags */}
              <div className="card p-3.5 space-y-2.5">
                <h3 className="text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                  Section & Labels
                </h3>
                <div className="space-y-2 text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <span className="text-text-faint text-[11px]">Campaign Section:</span>
                    <span className="font-semibold text-brand text-xs px-2 py-0.5 rounded-md bg-brand/10 border border-brand/30">
                      📁 {lead.pipeline?.name || "Main Inbound"}
                    </span>
                  </div>
                  {lead.tags && (
                    <div>
                      <span className="text-text-faint block text-[11px] mb-1.5">Attached Labels:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          try {
                            const tags = JSON.parse(lead.tags);
                            if (Array.isArray(tags)) {
                              return tags.map((t: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-wide border border-brand/40 bg-brand/10 text-brand"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                                  <span>{t}</span>
                                </span>
                              ));
                            }
                          } catch {}
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className="space-y-4">
              {/* Add Note / Activity Form */}
              <form onSubmit={handleLogActivity} className="card p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-text">Log New Activity</span>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11.5px] font-medium text-text outline-none"
                  >
                    <option value="NOTE">📝 Note</option>
                    <option value="CALL">📞 Phone Call</option>
                    <option value="MEETING">🤝 Meeting</option>
                    <option value="EMAIL">✉️ Email</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Record summary of call, meeting takeaways, or notes..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-ink resize-none"
                />
                <button
                  type="submit"
                  disabled={loggingNote}
                  className="w-full py-1.5 rounded-lg text-[12px] font-bold shadow-xs transition-colors active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  {loggingNote ? "Saving..." : "Log Activity"}
                </button>
              </form>

              {/* Activities timeline */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                  Timeline
                </p>
                {(!lead.activities || lead.activities.length === 0) ? (
                  <p className="text-[12.5px] text-text-faint py-4 text-center">
                    No activities logged yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {lead.activities.map((a: any) => (
                      <div key={a.id} className="py-2.5 text-[12.5px]">
                        <div className="flex items-center justify-between text-text-muted text-[11px]">
                          <span className="font-semibold uppercase text-ink">{a.type}</span>
                          <span suppressHydrationWarning>{new Date(a.occurredAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-text mt-1">{a.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-text">Follow-up Tasks</span>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                >
                  <Plus size={13} />
                  <span>Add Task</span>
                </button>
              </div>

              {(!lead.tasks || lead.tasks.length === 0) ? (
                <div className="card p-6 text-center text-[12.5px] text-text-muted">
                  <CheckSquare size={24} className="mx-auto mb-1 text-text-faint" />
                  No follow-up tasks scheduled for this lead.
                </div>
              ) : (
                <div className="space-y-2">
                  {lead.tasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="card p-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={async () => {
                            await toggleTask(t.id, !t.done);
                            toast.success(t.done ? "Reopened task" : "Task completed!");
                          }}
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            t.done ? "bg-accent border-accent text-white" : "border-border-strong"
                          }`}
                        >
                          {t.done && <CheckCircle2 size={12} />}
                        </button>
                        <span className={`text-[12.5px] truncate ${t.done ? "line-through text-text-faint" : "text-text font-medium"}`}>
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-surface-2 text-text-muted">
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-surface-2/40 flex items-center justify-between">
          <button
            onClick={() => onEdit(lead)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-[12.5px] font-medium text-text transition-colors"
          >
            <Edit2 size={13} />
            <span>Edit Details</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-[12.5px] font-medium text-rose-700 transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete Lead</span>
          </button>
        </div>
      </div>

      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          defaultLeadId={lead.id}
          members={members}
        />
      )}
    </>
  );
}

