"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  Flame,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Check,
  Package,
  Sparkles,
  MapPin,
  Tag,
  Briefcase,
  User,
  Zap,
  Globe,
  DollarSign,
} from "lucide-react";
import {
  moveLeadStage,
  deleteLead,
  logLeadActivity,
  toggleTask,
  deleteTask,
} from "@/app/actions";
import { TaskModal } from "@/components/task-modal";
import { LeadModal } from "../lead-modal";
import { ConvertLeadModal } from "../convert-lead-modal";
import { useToast } from "@/components/toast-context";
import { Product } from "@/db/schema";

type Stage = { id: string; name: string; color?: string | null; order: number };

export function LeadDetailClient({
  lead,
  dealPipelines = [],
  products = [],
  members = [],
  accounts = [],
  currentUser,
}: {
  lead: any;
  dealPipelines: any[];
  products: Product[];
  members: any[];
  accounts: any[];
  currentUser: any;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "info" | "timeline" | "tasks" | "products" | "convert"
  >("info");

  // Interaction logger state
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"CALL" | "MEETING" | "NOTE" | "EMAIL">("NOTE");
  const [loggingNote, setLoggingNote] = useState(false);
  const [activityList, setActivityList] = useState(lead.activities || []);
  const [taskList, setTaskList] = useState(lead.tasks || []);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Current stage tracking
  const stages: Stage[] = lead.pipeline?.stages || [];
  const [currentStageId, setCurrentStageId] = useState(lead.stageId);
  const currentStageIndex = stages.findIndex((s) => s.id === currentStageId);
  const currentStage = stages.find((s) => s.id === currentStageId) || lead.stage;

  const initials = (lead.contactName || "L")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = (lead.contactName || "").split(" ")[0] || lead.contactName;

  // Days since created
  const createdDate = new Date(lead.createdAt);
  const daysInPipeline = Math.max(
    1,
    Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const openTasksCount = taskList.filter((t: any) => !t.done).length;

  // Handle stage progression
  async function handleStageChange(newStageId: string, stageName: string) {
    setCurrentStageId(newStageId);
    try {
      await moveLeadStage(lead.id, newStageId);
      toast.success(`Moved lead to stage: ${stageName}`);
    } catch (err: any) {
      toast.error("Failed to update lead stage.");
    }
  }

  // Handle logging activity
  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLoggingNote(true);
    try {
      await logLeadActivity({
        leadId: lead.id,
        type: noteType,
        notes: noteText.trim(),
        userId: currentUser?.id,
      });

      setActivityList((prev: any[]) => [
        {
          id: "temp_" + Date.now(),
          type: noteType,
          notes: noteText.trim(),
          occurredAt: new Date(),
          user: currentUser,
        },
        ...prev,
      ]);
      setNoteText("");
      toast.success("Activity logged successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to log activity");
    } finally {
      setLoggingNote(false);
    }
  }

  // Handle toggle task
  function handleToggleTask(taskId: string, currentDone: boolean) {
    setTaskList((prev: any[]) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !currentDone } : t))
    );
    startTransition(async () => {
      try {
        await toggleTask(taskId, !currentDone);
        if (!currentDone) {
          toast.success("Task marked complete!");
        } else {
          toast.info("Task reopened");
        }
      } catch (err) {
        setTaskList((prev: any[]) =>
          prev.map((t) => (t.id === taskId ? { ...t, done: currentDone } : t))
        );
        toast.error("Failed to update task");
      }
    });
  }

  // Handle delete lead
  async function handleDeleteLead() {
    if (
      !confirm(
        `Are you sure you want to delete lead "${lead.contactName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteLead(lead.id);
      toast.success("Lead removed.");
      router.push("/leads");
    } catch (err) {
      toast.error("Failed to delete lead.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
        <Link href="/leads" className="hover:text-text transition-colors">
          Leads
        </Link>
        <span>/</span>
        <span className="text-text font-bold">{lead.contactName}</span>
      </div>

      {/* Hero Person Profile Card */}
      <div className="card p-6 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand via-blue-500 to-cyan-400 text-white font-black text-2xl shadow-md ring-4 ring-brand/15">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text truncate">
                  {lead.contactName}
                </h1>

                {/* Score badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    lead.score === "hot"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                      : lead.score === "cold"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  <Flame size={12} />
                  <span>{lead.score ? `${lead.score} lead` : "Warm lead"}</span>
                </span>

                {/* Pipeline / Campaign Section */}
                <span className="rounded-full bg-brand/10 border border-brand/30 px-2.5 py-0.5 text-[11px] font-bold text-brand flex items-center gap-1">
                  <span>📁</span>
                  <span>{lead.pipeline?.name || "Main Inbound"}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted mt-1.5 flex-wrap">
                {lead.title && (
                  <>
                    <span className="flex items-center gap-1 font-semibold text-brand">
                      <Briefcase size={13} className="text-brand" />
                      <span>{lead.title}</span>
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-1 font-medium text-text">
                  <Building size={13} className="text-text-faint" />
                  <span>{lead.company || "Individual / Independent"}</span>
                </span>
                {lead.website && (
                  <>
                    <span>•</span>
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                      title={lead.website}
                    >
                      <Globe size={13} />
                      <span>{lead.website.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Tag size={13} className="text-text-faint" />
                  Sourced: {lead.source || "Direct Inbound"}
                </span>
                {(lead.city || lead.region) && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-text-faint" />
                      {[lead.city, lead.region].filter(Boolean).join(", ")}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>
                  Entered {createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Attached Tags / Labels */}
              {lead.tags && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {(() => {
                    try {
                      const tags = JSON.parse(lead.tags);
                      if (Array.isArray(tags)) {
                        return tags.map((t: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-wide border border-brand/40 bg-brand/10 text-brand shadow-2xs"
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
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {dealPipelines.length > 0 && (
              <button
                onClick={() => setConvertModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-ink)",
                  color: "var(--color-ink-fg, #ffffff)",
                }}
              >
                <Handshake size={14} />
                <span>Convert to Deal</span>
              </button>
            )}

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 px-3 py-2 text-xs font-semibold text-text transition-colors shadow-2xs"
                title={`Email ${lead.contactName}`}
              >
                <Mail size={14} className="text-brand" />
                <span>Email</span>
              </a>
            )}

            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 px-3 py-2 text-xs font-semibold text-text transition-colors shadow-2xs"
                title={`Call ${lead.contactName}`}
              >
                <Phone size={14} className="text-emerald-500" />
                <span>Call</span>
              </a>
            )}

            <button
              onClick={() => setEditLeadOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 px-3 py-2 text-xs font-semibold text-text-muted hover:text-text transition-colors"
              title="Edit Lead Details"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDeleteLead}
              className="p-2 rounded-xl border border-rose-300/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 dark:border-rose-500/30 hover:bg-rose-500/20 transition-colors"
              title="Delete Lead"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Pipeline Stage Stepper Bar */}
        {stages.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11.5px] font-semibold text-text-faint uppercase tracking-wider">
                Lead Pipeline Stage Progression ({currentStage?.name})
              </p>
              <span className="text-[11px] text-text-muted font-medium">
                Click any stage to advance
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stages.map((st, idx) => {
                const isCurrent = st.id === currentStageId;
                const isPast = idx < currentStageIndex;

                return (
                  <button
                    key={st.id}
                    onClick={() => handleStageChange(st.id, st.name)}
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
                      {isPast && (
                        <CheckCircle2
                          size={12}
                          className="text-emerald-500 dark:text-emerald-400 shrink-0"
                        />
                      )}
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
        )}
      </div>

      {/* Pill Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border pb-2">
        {[
          { id: "info", label: "Person & Lead Profile" },
          { id: "timeline", label: `Activities & Timeline (${activityList.length})` },
          { id: "tasks", label: `Tasks & Action Items (${openTasksCount})` },
          { id: "products", label: "Products of Interest" },
          { id: "convert", label: "Convert to Opportunity" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
            style={
              activeTab === tab.id
                ? {
                    backgroundColor: "var(--color-brand)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PERSON & LEAD PROFILE */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Row of 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Lead Temperature
                </span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10.5px] font-bold text-rose-500 border border-rose-500/20">
                  {lead.score?.toUpperCase() || "WARM"}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-text capitalize">
                {lead.score || "Warm"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">High conversion likelihood</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Pipeline Stage
                </span>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-bold text-brand border border-brand/20">
                  Step {currentStageIndex + 1}/{stages.length || 1}
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-text truncate">
                {currentStage?.name || "Active"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">In progression flow</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Product Interest
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-500 border border-emerald-500/20">
                  Target
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-text truncate">
                {lead.productInterest || "Fintech Solutions"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Commercial focus</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Days Active
                </span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10.5px] font-bold text-cyan-500 border border-cyan-500/20">
                  Velocity
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-text">
                {daysInPipeline} <span className="text-sm font-medium text-text-muted">days</span>
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Since lead creation</p>
            </div>
          </div>

          {/* Details Grid: Left Info Cards & Right Quick Note Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Contact Information & Organization */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <User size={15} className="text-brand" />
                  <span>Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Full Name</span>
                    <p className="text-sm font-bold text-text">{lead.contactName}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Job Title / Designation</span>
                    <p className="text-sm font-bold text-text flex items-center gap-1.5">
                      <Briefcase size={14} className="text-brand shrink-0" />
                      <span>{lead.title || "Not specified"}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Email Address</span>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-bold text-brand hover:underline truncate block"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-text-muted">Not specified</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Phone Number</span>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm font-bold text-emerald-500 hover:underline block"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-text-muted">Not specified</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1 md:col-span-2">
                    <span className="text-text-faint font-semibold block text-[11px]">Location &amp; Market</span>
                    <p className="text-sm font-bold text-text flex items-center gap-1.5">
                      <MapPin size={14} className="text-brand shrink-0" />
                      <span>{[lead.city, lead.region].filter(Boolean).join(", ") || "Saudi Arabia (KSA)"}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <Building size={15} className="text-brand" />
                  <span>Account &amp; Commercial Attributes</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Company / Account</span>
                    <p className="text-sm font-bold text-text">
                      {lead.company || "Individual Organization"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Company Website</span>
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5 truncate"
                        title={lead.website}
                      >
                        <Globe size={13} className="shrink-0" />
                        <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink size={11} className="shrink-0 opacity-70" />
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-text-muted">Not specified</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Estimated Value</span>
                    <p className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                      <DollarSign size={13} className="shrink-0" />
                      <span>{lead.value != null ? `${lead.value.toLocaleString()} SAR` : "Not specified"}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Assigned Owner</span>
                    <p className="text-sm font-bold text-text">
                      {lead.owner?.name || "Unassigned"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Acquisition Source</span>
                    <p className="text-sm font-bold text-text">{lead.source || "Direct Marketing"}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-1">
                    <span className="text-text-faint font-semibold block text-[11px]">Product Target</span>
                    <p className="text-sm font-bold text-text">
                      {lead.productInterest || "General Inquiry"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Quick Note Form & Owner Profile */}
            <div className="space-y-4">
              {/* Log Note form */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-text">Log Interaction</span>
                  <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border">
                    {(["NOTE", "CALL", "MEETING", "EMAIL"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNoteType(type)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          noteType === type
                            ? "bg-brand text-white shadow-xs"
                            : "text-text-muted hover:text-text"
                        }`}
                        style={
                          noteType === type
                            ? {
                                backgroundColor: "var(--color-brand)",
                                color: "var(--color-ink-fg, #ffffff)",
                              }
                            : undefined
                        }
                      >
                        {type === "NOTE" && "📝 Note"}
                        {type === "CALL" && "📞 Call"}
                        {type === "MEETING" && "🤝 Meet"}
                        {type === "EMAIL" && "✉️ Email"}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLogActivity} className="space-y-2.5">
                  <textarea
                    rows={3}
                    required
                    placeholder={`Log discussion details, executive feedback, or commitments with ${firstName}...`}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-faint outline-none focus:border-brand resize-none"
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

              {/* Lead Stage History & Quick Conversion Card */}
              <div className="card p-4 space-y-3">
                <h4 className="text-[12.5px] font-bold text-text">Quick Actions</h4>
                <div className="space-y-2">
                  {dealPipelines.length > 0 && (
                    <button
                      onClick={() => setConvertModalOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/60 hover:border-brand/40 hover:bg-surface-2 transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center font-bold">
                          <Handshake size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text">Convert to Deal</p>
                          <p className="text-[11px] text-text-muted">Create sales opportunity</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-text-muted" />
                    </button>
                  )}

                  <button
                    onClick={() => setTaskModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/60 hover:border-brand/40 hover:bg-surface-2 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                        <Plus size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">Schedule Follow-up</p>
                        <p className="text-[11px] text-text-muted">Add task with deadline</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-text-muted" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITIES & TIMELINE */}
      {activeTab === "timeline" && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                Activity Timeline &amp; History
              </h3>
              <p className="text-xs text-text-muted">
                Complete log of interactions, notes, calls, and meetings with {lead.contactName}
              </p>
            </div>
          </div>

          {/* Quick interaction logger */}
          <form onSubmit={handleLogActivity} className="p-4 rounded-2xl bg-surface-2/50 border border-border space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["NOTE", "CALL", "MEETING", "EMAIL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoteType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    noteType === type
                      ? "bg-brand text-white shadow-xs"
                      : "text-text-muted hover:text-text bg-surface border border-border"
                  }`}
                  style={
                    noteType === type
                      ? {
                          backgroundColor: "var(--color-brand)",
                          color: "var(--color-ink-fg, #ffffff)",
                        }
                      : undefined
                  }
                >
                  {type === "NOTE" && "📝 Add Note"}
                  {type === "CALL" && "📞 Log Call"}
                  {type === "MEETING" && "🤝 Log Meeting"}
                  {type === "EMAIL" && "✉️ Log Email"}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              required
              placeholder="What was discussed or agreed upon with this lead?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-faint outline-none focus:border-brand resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loggingNote}
                className="px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-ink)",
                  color: "var(--color-ink-fg, #ffffff)",
                }}
              >
                {loggingNote ? "Saving..." : "Log Activity"}
              </button>
            </div>
          </form>

          {/* Activities list */}
          {activityList.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              <StickyNote size={28} className="mx-auto text-text-faint mb-2" />
              <p className="text-sm font-semibold text-text">No activity logged yet</p>
              <p className="text-xs text-text-muted mt-1">Use the box above to log your first call or meeting.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activityList.map((a: any) => (
                <div key={a.id} className="py-3.5 flex items-start gap-3 text-xs">
                  <div className="h-8 w-8 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-brand shrink-0 mt-0.5">
                    {a.type === "CALL" && <Phone size={14} />}
                    {a.type === "MEETING" && <Handshake size={14} />}
                    {a.type === "EMAIL" && <Mail size={14} />}
                    {a.type === "NOTE" && <StickyNote size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text text-xs uppercase tracking-wider">
                        {a.type}
                      </span>
                      <span className="text-[11px] text-text-faint">
                        {new Date(a.occurredAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-text mt-1 text-xs leading-relaxed">{a.notes}</p>
                    {a.user?.name && (
                      <p className="text-[10.5px] text-text-faint mt-1">
                        Recorded by {a.user.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASKS & ACTION ITEMS */}
      {activeTab === "tasks" && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                Tasks &amp; Action Items
              </h3>
              <p className="text-xs text-text-muted">
                Keep the lead progressing by completing follow-ups and scheduled outreach
              </p>
            </div>

            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-ink-fg, #ffffff)",
              }}
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </div>

          {taskList.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              <CheckCircle2 size={28} className="mx-auto text-text-faint mb-2" />
              <p className="text-sm font-semibold text-text">No active tasks</p>
              <p className="text-xs text-text-muted mt-1">
                Add an action item to ensure timely follow-up with {lead.contactName}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {taskList.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-border bg-surface-2/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(t.id, t.done)}
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        t.done
                          ? "bg-brand border-brand text-white"
                          : "border-border bg-surface hover:border-brand"
                      }`}
                    >
                      {t.done && <CheckCircle2 size={12} />}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold leading-snug truncate ${
                          t.done ? "line-through text-text-faint" : "text-text"
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-[11.5px] text-text-muted mt-0.5 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                      {t.dueDate && (
                        <span className="text-[11px] text-text-faint flex items-center gap-1 mt-1">
                          <Clock size={11} />
                          Due: {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded border ${
                      t.priority === "HIGH"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                        : t.priority === "LOW"
                          ? "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRODUCTS & SOLUTIONS */}
      {activeTab === "products" && (
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text">
              Recommended Products &amp; Solutions
            </h3>
            <p className="text-xs text-text-muted">
              Solutions aligned with {lead.company || lead.contactName}&apos;s needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const isMatch =
                lead.productInterest &&
                p.name.toLowerCase().includes(lead.productInterest.toLowerCase());

              return (
                <div
                  key={p.id}
                  className={`card p-4 space-y-3 relative border transition-all ${
                    isMatch
                      ? "border-brand ring-2 ring-brand/20 bg-brand/5"
                      : "border-border hover:border-brand/40"
                  }`}
                >
                  {isMatch && (
                    <span className="absolute top-3 right-3 rounded-full bg-brand px-2 py-0.5 text-[9.5px] font-bold text-white uppercase">
                      Interest Match
                    </span>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-brand shrink-0">
                      <Package size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-text truncate">{p.name}</h4>
                      <p className="text-[11px] text-text-muted truncate">{p.category || "Fintech Solution"}</p>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                    {p.description || "Enterprise financial technology and payment gateway infrastructure."}
                  </p>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-text">
                      {p.currency || "SAR"} {p.price ? p.price.toLocaleString() : "Custom"}
                    </span>
                    <Link
                      href={`/products/${p.id}`}
                      className="text-brand font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Details</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CONVERT TO OPPORTUNITY */}
      {activeTab === "convert" && (
        <div className="card p-6 space-y-5 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <div className="h-12 w-12 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mx-auto mb-3">
              <Handshake size={24} />
            </div>
            <h3 className="text-base font-bold text-text">Convert {lead.contactName} to a Deal</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              This will create a new deal in your pipeline, assign an account, and transition the lead to Converted.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2/60 border border-border space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Contact Person:</span>
              <span className="font-bold text-text">{lead.contactName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Company Account:</span>
              <span className="font-bold text-text">{lead.company || "New Account"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Target Solution:</span>
              <span className="font-bold text-text">{lead.productInterest || "Fintech Core"}</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setConvertModalOpen(true)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-ink-fg, #ffffff)",
              }}
            >
              Open Conversion Wizard
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          defaultLeadId={lead.id}
          members={members}
        />
      )}

      {editLeadOpen && (
        <LeadModal
          open={editLeadOpen}
          onClose={() => setEditLeadOpen(false)}
          leadToEdit={lead}
          pipelineId={lead.pipelineId || ""}
          stages={stages}
          members={members}
        />
      )}

      {convertModalOpen && dealPipelines.length > 0 && (
        <ConvertLeadModal
          leadId={lead.id}
          leadName={lead.contactName}
          dealPipelines={dealPipelines}
          onClose={() => setConvertModalOpen(false)}
        />
      )}
    </div>
  );
}

