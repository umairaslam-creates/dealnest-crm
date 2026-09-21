"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  StickyNote,
  Users,
  Handshake,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import { logActivity, toggleTask, deleteTask, deleteContact } from "@/app/actions";
import { TaskModal } from "@/components/task-modal";
import { useToast } from "@/components/toast-context";

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  CALL: Phone,
  MEETING: Users,
  NOTE: StickyNote,
  EMAIL: Mail,
};

export function ContactDetailDrawer({
  open,
  onClose,
  contact,
  allDeals = [],
  allTasks = [],
  members = [],
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  contact: any;
  allDeals?: any[];
  allTasks?: any[];
  members?: any[];
  onEdit: (contact: any) => void;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"context" | "deals" | "tasks" | "activities">("context");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Activity logging state
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"CALL" | "MEETING" | "NOTE" | "EMAIL">("NOTE");
  const [loggingActivity, setLoggingActivity] = useState(false);

  if (!open || !contact) return null;

  const initials = (contact.name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Associated deals for this contact's account
  const associatedDeals =
    contact.account?.deals ??
    allDeals.filter((d: any) => d.accountId === contact.accountId);

  // Associated tasks
  const associatedDealIds = new Set(associatedDeals.map((d: any) => d.id));
  const contactTasks = allTasks.filter(
    (t: any) => t.dealId && associatedDealIds.has(t.dealId)
  );

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLoggingActivity(true);
    try {
      await logActivity({
        contactId: contact.id,
        type: noteType,
        notes: noteText.trim(),
      });
      setNoteText("");
      toast.success("Activity logged for this stakeholder.");
    } catch (err) {
      toast.error("Failed to log activity.");
    } finally {
      setLoggingActivity(false);
    }
  }

  async function handleDeleteContact() {
    if (!confirm(`Are you sure you want to delete contact "${contact.name}"?`)) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contact deleted.");
      onClose();
    } catch (err) {
      toast.error("Failed to delete contact.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="h-full w-full max-w-xl bg-surface shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-250 select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="p-6 border-b border-border bg-gradient-to-b from-surface-2 to-surface flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-13 w-13 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-[18px] shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-text truncate">{contact.name}</h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <ShieldCheck size={12} />
                  Active
                </span>
              </div>
              <p className="text-[13px] text-text-muted font-medium truncate mt-0.5">
                {contact.title || "Key Stakeholder"}
                {contact.account?.name && ` at ${contact.account.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                title="Send Email"
                className="p-2 rounded-xl border border-border text-text-muted hover:text-brand hover:bg-surface-2 transition-all shadow-2xs"
              >
                <Mail size={15} />
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                title="Call Phone"
                className="p-2 rounded-xl border border-border text-text-muted hover:text-brand hover:bg-surface-2 transition-all shadow-2xs"
              >
                <Phone size={15} />
              </a>
            )}
            <button
              onClick={() => onEdit(contact)}
              title="Edit Contact"
              className="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-all shadow-2xs cursor-pointer"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={handleDeleteContact}
              title="Delete Contact"
              className="p-2 rounded-xl border border-border text-text-muted hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-300 transition-all shadow-2xs cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              title="Close window"
              className="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:bg-surface-2 transition-all ml-1 shadow-2xs cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-surface shrink-0">
          {[
            { id: "context", label: "Overview & Context" },
            { id: "deals", label: `Deals (${associatedDeals.length})` },
            { id: "tasks", label: `Tasks (${contactTasks.length})` },
            { id: "activities", label: `Activities (${contact.activities?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-[13px] font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-brand text-brand font-bold"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CONTEXT & DETAILS */}
          {activeTab === "context" && (
            <div className="space-y-5">
              {/* Primary Attributes Card */}
              <div className="rounded-2xl border border-border bg-surface-2 p-4 space-y-3 shadow-2xs">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Email Address</span>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="font-semibold text-text hover:text-brand flex items-center gap-1 mt-0.5"
                      >
                        <Mail size={13} className="text-text-muted" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Direct Phone</span>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-semibold text-text hover:text-brand flex items-center gap-1 mt-0.5 font-numeric"
                      >
                        <Phone size={13} className="text-text-muted" />
                        <span>{contact.phone}</span>
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Associated Company</span>
                    <span className="font-semibold text-text flex items-center gap-1 mt-0.5">
                      <Building size={13} className="text-text-muted" />
                      <span>{contact.account?.name || "Independent"}</span>
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Stakeholder Role</span>
                    <span className="font-semibold text-text mt-0.5 block">
                      {contact.role || contact.title || "Decision Maker"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Territory / Region</span>
                    <span className="font-semibold text-text mt-0.5 block">
                      {contact.account?.region || "Middle East"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">Added to CRM</span>
                    <span suppressHydrationWarning className="font-semibold text-text mt-0.5 block">
                      {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Summary of Associated Deals */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
                    Deal Portfolio ({associatedDeals.length})
                  </h3>
                  <Link
                    href="/pipeline"
                    className="text-[11.5px] font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    <span>View Pipeline</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                {associatedDeals.length === 0 ? (
                  <p className="text-[12.5px] text-text-muted py-3 text-center">
                    No active deals currently linked to this stakeholder's organization.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {associatedDeals.map((deal: any) => (
                      <Link
                        key={deal.id}
                        href={`/deals/${deal.id}`}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2 hover:border-brand/40 transition-all group"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-text group-hover:text-brand transition-colors truncate">
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11.5px] text-text-muted mt-0.5">
                            <span>Stage: {deal.stage?.name || "Active"}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-numeric text-[13.5px] font-bold text-text">
                            {deal.currency || "SAR"} {(deal.value || 0).toLocaleString()}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              deal.status === "WON"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : deal.status === "LOST"
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {deal.status || "OPEN"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSOCIATED DEALS */}
          {activeTab === "deals" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-text">
                  Opportunities &amp; Contract Stages
                </span>
                <Link
                  href="/pipeline"
                  className="flex items-center gap-1 text-[12px] font-bold text-brand hover:underline"
                >
                  <Plus size={13} />
                  <span>New Deal</span>
                </Link>
              </div>

              {associatedDeals.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border">
                  <Handshake size={32} className="mx-auto mb-2 text-text-muted opacity-50" />
                  <p className="text-[13.5px] font-bold text-text">No active deals found</p>
                  <p className="text-[12px] text-text-muted mt-1">
                    Create an opportunity in the Pipeline linked to {contact.account?.name || contact.name}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {associatedDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-4 rounded-2xl border border-border bg-surface shadow-2xs hover:border-brand/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/deals/${deal.id}`}
                            className="text-[14px] font-bold text-text hover:text-brand flex items-center gap-1.5 group"
                          >
                            <span>{deal.title}</span>
                            <ExternalLink size={12} className="text-text-muted group-hover:text-brand" />
                          </Link>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            Stage: <span className="font-semibold text-text">{deal.stage?.name || "Active"}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-numeric text-[15px] font-extrabold text-text">
                            {deal.currency || "SAR"} {(deal.value || 0).toLocaleString()}
                          </p>
                          <span
                            className={`text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              deal.status === "WON"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : deal.status === "LOST"
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {deal.status || "OPEN"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[12px]">
                        <span className="text-text-muted">
                          Target Close: {deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : "Flexible"}
                        </span>
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-bold text-brand hover:underline"
                        >
                          Open Deal Workspace →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASKS & ACTION ITEMS */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-text">Follow-up Tasks</span>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="flex items-center gap-1 text-[12px] font-bold text-brand hover:underline cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Task</span>
                </button>
              </div>

              {contactTasks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border">
                  <Clock size={32} className="mx-auto mb-2 text-text-muted opacity-50" />
                  <p className="text-[13.5px] font-bold text-text">No pending follow-ups</p>
                  <p className="text-[12px] text-text-muted mt-1">
                    Add a reminder or to-do item for this contact to keep engagements moving.
                  </p>
                  <button
                    onClick={() => setTaskModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-[12px] font-bold text-white hover:bg-brand/90 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Create follow-up</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactTasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl border border-border bg-surface flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              await toggleTask(t.id, !t.done);
                            });
                          }}
                          className={`mt-0.5 h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            t.done
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-border-strong hover:border-brand"
                          }`}
                        >
                          {t.done && <CheckCircle2 size={13} />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-[13px] font-semibold leading-snug ${
                              t.done ? "line-through text-text-faint" : "text-text"
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">
                              {t.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted">
                            {t.dueDate && (
                              <span className="flex items-center gap-1 font-medium text-text-muted">
                                <Calendar size={11} />
                                {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {t.deal?.title && (
                              <span className="text-brand font-medium">
                                Deal: {t.deal.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          t.priority === "HIGH"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : t.priority === "LOW"
                              ? "bg-surface-2 text-text-muted border border-border"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {t.priority || "MEDIUM"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVITIES & TIMELINE LOGGER */}
          {activeTab === "activities" && (
            <div className="space-y-4">
              {/* Activity Log Form */}
              <form onSubmit={handleLogActivity} className="rounded-2xl border border-border bg-surface-2 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
                    Log Interaction
                  </span>
                  <div className="flex items-center gap-1">
                    {(["NOTE", "CALL", "MEETING", "EMAIL"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNoteType(type)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          noteType === type
                            ? "bg-brand text-white shadow-2xs"
                            : "text-text-muted hover:text-text hover:bg-surface"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={`Write ${noteType.toLowerCase()} notes about this contact...`}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-brand transition-all resize-none shadow-2xs"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loggingActivity}
                    className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-brand/90 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>{loggingActivity ? "Saving..." : "Log Activity"}</span>
                  </button>
                </div>
              </form>

              {/* Timeline List */}
              <div className="space-y-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
                  Interaction History
                </span>
                {(!contact.activities || contact.activities.length === 0) ? (
                  <p className="text-[12.5px] text-text-muted py-6 text-center rounded-2xl border border-dashed border-border">
                    No activities recorded yet. Use the logger above to track calls, meetings, or emails.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contact.activities.map((a: any) => {
                      const Icon = ACTIVITY_ICONS[a.type] ?? StickyNote;
                      return (
                        <div
                          key={a.id}
                          className="p-3 rounded-2xl border border-border bg-surface shadow-2xs space-y-1 text-[12.5px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 font-bold uppercase text-[11px] text-text">
                              <Icon size={12} className="text-brand" />
                              {a.type}
                            </span>
                            <span suppressHydrationWarning className="text-[11px] text-text-muted">
                              {new Date(a.occurredAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-text-muted leading-relaxed">{a.notes}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Task Modal */}
        {taskModalOpen && (
          <TaskModal
            open={taskModalOpen}
            onClose={() => setTaskModalOpen(false)}
            deals={associatedDeals}
            members={members}
          />
        )}
      </div>
    </div>
  );
}

