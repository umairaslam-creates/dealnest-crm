"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Phone,
  Users,
  ExternalLink,
  StickyNote,
  Mail,
  Trophy,
  XCircle,
  RotateCcw,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Building,
  User,
  DollarSign,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import {
  logActivity,
  analyzeDeal,
  moveDealStage,
  setDealStatus,
  deleteDeal,
  toggleTask,
} from "@/app/actions";
import { DealQuickActions } from "./deal-quick-actions";
import { DealModal } from "@/components/deal-modal";
import { TaskModal } from "@/components/task-modal";
import { useToast } from "@/components/toast-context";

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  CALL: Phone,
  MEETING: Users,
  NOTE: StickyNote,
  EMAIL: Mail,
};

export function DealDetailClient({
  deal,
  suggestions,
  googleConnected,
  pipelines = [],
  accounts = [],
  members = [],
}: {
  deal: any;
  suggestions: any[];
  googleConnected: boolean;
  pipelines?: any[];
  accounts?: any[];
  members?: any[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [analyzing, setAnalyzing] = useState(false);
  const [latestSuggestion, setLatestSuggestion] = useState<string | null>(
    suggestions[0]?.suggestion ?? null
  );

  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"CALL" | "MEETING" | "NOTE" | "EMAIL">("NOTE");
  const [loggingNote, setLoggingNote] = useState(false);

  const [editDealOpen, setEditDealOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lossReason, setLossReason] = useState("");

  const stages =
    deal.stage?.pipeline?.stages
      ?.slice()
      .sort((a: any, b: any) => a.order - b.order) ?? [];

  const currentStageIndex = stages.findIndex((s: any) => s.id === deal.stageId);

  function handleAnalyze() {
    setAnalyzing(true);
    startTransition(async () => {
      try {
        const result = await analyzeDeal(deal.id);
        setLatestSuggestion(result.suggestion);
        toast.success("AI deal analysis complete!");
      } catch (err) {
        toast.error("Failed to run AI analysis.");
      } finally {
        setAnalyzing(false);
      }
    });
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLoggingNote(true);
    try {
      await logActivity({ dealId: deal.id, type: noteType, notes: noteText.trim() });
      setNoteText("");
      toast.success("Activity logged.");
    } catch (err) {
      toast.error("Failed to log activity.");
    } finally {
      setLoggingNote(false);
    }
  }

  async function handleStatusChange(status: "OPEN" | "WON" | "LOST", reason?: string) {
    try {
      await setDealStatus(deal.id, status, reason);
      if (status === "WON") toast.success("Deal won! Congratulations! 🎉");
      else if (status === "LOST") toast.info("Deal marked as lost.");
      else toast.info("Deal reopened.");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  }

  async function handleDeleteDeal() {
    if (!confirm(`Are you sure you want to delete deal "${deal.title}"?`)) return;
    try {
      await deleteDeal(deal.id);
      toast.success("Deal deleted.");
      router.push("/pipeline");
    } catch (err) {
      toast.error("Failed to delete deal.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[19px] font-bold text-text">{deal.title}</h1>
              <span
                className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  deal.status === "WON"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : deal.status === "LOST"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                {deal.status}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1 text-[12.5px] text-text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Building size={13} className="text-text-faint" />
                {deal.account?.name ?? "No Account"}
              </span>
              <span className="flex items-center gap-1">
                <User size={13} className="text-text-faint" />
                Owner: {deal.owner?.name ?? "Unassigned"}
              </span>
              {deal.expectedClose && (
                <span suppressHydrationWarning className="flex items-center gap-1">
                  <Calendar size={13} className="text-text-faint" />
                  Target: {new Date(deal.expectedClose).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-text hover:border-accent hover:text-accent shadow-sm transition-all"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>{analyzing ? "Analyzing..." : "AI Suggestion"}</span>
            </button>

            <button
              onClick={() => setEditDealOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDeleteDeal}
              className="p-2 rounded-xl border border-rose-300/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 dark:border-rose-500/30 hover:bg-rose-500/20 transition-colors"
              title="Delete deal"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Commercial summary & Status action buttons */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] uppercase font-semibold text-text-faint block">
                Deal Value
              </span>
              <span className="font-numeric text-[22px] font-bold text-text">
                {deal.currency} {deal.value?.toLocaleString() ?? "0"}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-[11px] uppercase font-semibold text-text-faint block">
                Win Probability
              </span>
              <span className="font-numeric text-[18px] font-semibold text-text">
                {deal.probability ?? 0}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deal.status === "OPEN" ? (
              <>
                <button
                  onClick={() => handleStatusChange("WON")}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Trophy size={14} />
                  <span>Mark as Won</span>
                </button>
                <button
                  onClick={() => setLostModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-[12.5px] font-medium text-rose-600 dark:text-rose-300 dark:border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                >
                  <XCircle size={14} />
                  <span>Mark as Lost</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStatusChange("OPEN")}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-text hover:bg-surface-2 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reopen Opportunity</span>
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Stage Stepper Bar */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-[11.5px] font-semibold text-text-faint uppercase tracking-wider mb-2.5">
            Stage Progression ({deal.stage?.name})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
            {stages.map((st: any, idx: number) => {
              const isCurrent = st.id === deal.stageId;
              const isPast = idx < currentStageIndex;

              return (
                <button
                  key={st.id}
                  onClick={() => {
                    startTransition(async () => {
                      await moveDealStage(deal.id, st.id);
                      toast.success(`Moved to stage: ${st.name}`);
                    });
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all text-[12px] ${
                    isCurrent
                      ? "border-brand bg-brand shadow-lg font-bold ring-2 ring-brand/30"
                      : isPast
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                        : "border-border bg-surface-2/60 text-text-muted hover:border-brand/40 hover:text-text font-medium"
                  }`}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: "var(--color-brand)",
                          color: "var(--color-ink-fg, #ffffff)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate">{st.name}</span>
                    {isPast && <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400 shrink-0" />}
                    {isCurrent && (
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
                        style={{ backgroundColor: "var(--color-ink-fg, #ffffff)" }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Suggestion Alert */}
        {latestSuggestion && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-[12.5px] text-emerald-200 flex items-start gap-2.5">
            <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Recommended Next Step:</p>
              <p className="mt-0.5 leading-relaxed text-slate-200">{latestSuggestion}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Activities & Tasks, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Activities & Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Log New Activity Card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text">Log Interaction</span>
              <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg">
                {(["NOTE", "CALL", "MEETING", "EMAIL"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNoteType(type)}
                    className={`px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                      noteType === type
                        ? "bg-brand text-white shadow-xs"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {type === "NOTE" && "📝 Note"}
                    {type === "CALL" && "📞 Call"}
                    {type === "MEETING" && "🤝 Meeting"}
                    {type === "EMAIL" && "✉️ Email"}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-2.5">
              <textarea
                rows={2}
                required
                placeholder="Log discussion details, executive feedback, or next commitments..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-faint outline-none focus:border-brand resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loggingNote}
                  className="px-5 py-2 rounded-xl text-[12.5px] font-bold shadow-md transition-all active:scale-[0.98] border border-white/10"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  {loggingNote ? "Saving..." : "Log Note"}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="card p-4 space-y-3">
            <p className="text-[12px] font-semibold text-text-faint uppercase tracking-wider">
              Deal Timeline &amp; History ({deal.activities?.length ?? 0})
            </p>

            {(!deal.activities || deal.activities.length === 0) ? (
              <p className="text-[13px] text-text-faint py-6 text-center">
                No activity has been logged on this deal yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {deal.activities.map((a: any) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? StickyNote;
                  return (
                    <div key={a.id} className="py-3 flex items-start gap-3 text-[13px]">
                      <div className="h-7 w-7 rounded-lg bg-surface-2 flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text text-[12.5px] uppercase">
                            {a.type}
                          </span>
                          <span suppressHydrationWarning className="text-[11.5px] text-text-faint">
                            {new Date(a.occurredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-text-muted mt-1 leading-relaxed">{a.notes}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Tasks & Quick Actions */}
        <div className="space-y-4">
          {/* Quick Actions (Email & Meeting Google Integrations) */}
          <div className="card p-4">
            <DealQuickActions
              dealId={deal.id}
              googleConnected={googleConnected}
            />
          </div>

          {/* Key Stakeholders & Contacts Person Card */}
          {deal.account?.contacts && deal.account.contacts.length > 0 && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-brand" />
                  <p className="text-[13px] font-semibold text-text">Key Stakeholders &amp; Contacts</p>
                </div>
                <Link
                  href="/contacts"
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  All Contacts →
                </Link>
              </div>

              <div className="space-y-2">
                {deal.account.contacts.map((c: any) => {
                  const initials = (c.name || "C")
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <Link
                      key={c.id}
                      href={`/contacts/${c.id}`}
                      className="group/contact flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-brand/40 transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-text group-hover/contact:text-brand truncate transition-colors">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">
                            {c.title || c.role || "Key Stakeholder"}
                          </p>
                        </div>
                      </div>

                      <span className="flex items-center gap-1 text-[11px] font-semibold text-brand group-hover/contact:underline shrink-0 ml-2">
                        <span>View Profile</span>
                        <ExternalLink size={11} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Tasks Card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-text">Associated Tasks</p>
                <p className="text-[11px] text-text-faint">Action items for this deal</p>
              </div>
              <button
                onClick={() => setTaskModalOpen(true)}
                className="flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
              >
                <Plus size={13} />
                <span>Add Task</span>
              </button>
            </div>

            {(!deal.tasks || deal.tasks.length === 0) ? (
              <div className="py-6 text-center text-[12.5px] text-text-muted">
                No active tasks. Add one to keep this deal moving!
              </div>
            ) : (
              <div className="space-y-2">
                {deal.tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl border border-border bg-surface-2/40 flex items-start justify-between gap-2 text-[12.5px]"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            await toggleTask(t.id, !t.done);
                          });
                        }}
                        className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          t.done ? "bg-accent border-accent text-white" : "border-border-strong bg-surface"
                        }`}
                      >
                        {t.done && <CheckCircle2 size={12} />}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`font-medium leading-snug truncate ${
                            t.done ? "line-through text-text-faint" : "text-text"
                          }`}
                        >
                          {t.title}
                        </p>
                        {t.dueDate && (
                          <span suppressHydrationWarning className="text-[11px] text-text-faint flex items-center gap-1 mt-0.5">
                            <Clock size={11} />
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        t.priority === "HIGH"
                          ? "bg-rose-100 text-rose-700"
                          : t.priority === "LOW"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Deal Modal */}
      {editDealOpen && (
        <DealModal
          open={editDealOpen}
          onClose={() => setEditDealOpen(false)}
          dealToEdit={deal}
          pipelines={pipelines}
          accounts={accounts}
          members={members}
        />
      )}

      {/* Add Task Modal for this Deal */}
      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          defaultDealId={deal.id}
          members={members}
        />
      )}

      {/* Mark as Lost Reason Modal */}
      {lostModalOpen && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-border-strong bg-surface shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-text">Mark Deal as Lost</h3>
              <p className="text-[12px] text-text-muted mt-0.5">
                Record the reason to help analyze win/loss trends in Reports.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text mb-1.5">
                Loss Reason
              </label>
              <select
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              >
                <option value="Competitor pricing">Competitor pricing</option>
                <option value="Feature mismatch">Product / Feature mismatch</option>
                <option value="Budget cut / Frozen">Budget cut or project frozen</option>
                <option value="Went quiet / Unresponsive">Unresponsive prospect</option>
                <option value="Timing / Postponed">Timing / postponed to next year</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLostModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-[12.5px] font-medium text-text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLostModalOpen(false);
                  handleStatusChange("LOST", lossReason || "Competitor pricing");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-[12.5px] font-semibold hover:bg-rose-700"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
