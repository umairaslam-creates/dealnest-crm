"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  Video,
  Calendar,
  DollarSign,
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  X,
  Building2,
  Sparkles,
  Filter,
  ArrowUpRight,
  Percent,
  Layers,
  ShieldCheck,
  UserCheck,
  User,
  Zap,
} from "lucide-react";
import {
  TargetWithProgress,
  TargetType,
  TargetPeriod,
  createTargetAction,
  updateTargetAction,
  deleteTargetAction,
  getTargetsWithProgressAction,
} from "@/app/actions/targets";
import {
  formatCurrency,
  convertCurrency,
  getCurrencySymbol,
  CURRENCIES,
  CurrencyCode,
} from "@/lib/currency";
import { useToast } from "@/components/toast-context";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  designation?: string | null;
  image?: string | null;
};

type Pipeline = {
  id: string;
  name: string;
};

export function TargetsClient({
  initialTargets,
  userRole,
  currentUserId,
  members,
  pipelines,
}: {
  initialTargets: TargetWithProgress[];
  userRole: "ADMIN" | "MANAGER" | "REP";
  currentUserId: string;
  members: Member[];
  pipelines: Pipeline[];
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [targetsList, setTargetsList] = useState<TargetWithProgress[]>(initialTargets);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("SAR");

  // Filter Tabs
  const [viewScope, setViewScope] = useState<"ALL" | "MY" | "ASSIGNED_BY_ME">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetWithProgress | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<TargetType>("DEMO_SCHEDULED");
  const [formTargetValue, setFormTargetValue] = useState<number | string>(20);
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>("SAR");
  const [formPeriod, setFormPeriod] = useState<TargetPeriod>("MONTHLY");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formAssigneeId, setFormAssigneeId] = useState<string>("TEAM"); // "TEAM" | "MYSELF" | user.id
  const [formPipelineId, setFormPipelineId] = useState<string>("ALL");

  const isTeamLeadOrAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  // Refresh targets from server
  async function refreshTargets() {
    startTransition(async () => {
      const res = await getTargetsWithProgressAction();
      if (res.success) {
        setTargetsList(res.targets);
      }
    });
  }

  // Preset Date Helper
  function applyPeriodPreset(preset: TargetPeriod) {
    const now = new Date();
    if (preset === "MONTHLY") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFormStartDate(start.toISOString().split("T")[0]);
      setFormEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "QUARTERLY") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth, 1);
      const end = new Date(now.getFullYear(), quarterMonth + 3, 0);
      setFormStartDate(start.toISOString().split("T")[0]);
      setFormEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "ANNUAL") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setFormStartDate(start.toISOString().split("T")[0]);
      setFormEndDate(end.toISOString().split("T")[0]);
    }
  }

  // Open Create Modal
  function handleOpenCreateModal() {
    setEditingTarget(null);
    setFormTitle("");
    // Reps default to DEMO_SCHEDULED; Team Leads can default to REVENUE_QUOTA
    if (isTeamLeadOrAdmin) {
      setFormType("REVENUE_QUOTA");
      setFormTargetValue(500000);
      setFormAssigneeId("TEAM");
    } else {
      setFormType("DEMO_SCHEDULED");
      setFormTargetValue(15);
      setFormAssigneeId("MYSELF");
    }
    setFormCurrency("SAR");
    setFormPeriod("MONTHLY");
    applyPeriodPreset("MONTHLY");
    setFormPipelineId("ALL");
    setModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEditModal(target: TargetWithProgress) {
    setEditingTarget(target);
    setFormTitle(target.title);
    setFormType(target.type);
    setFormTargetValue(target.targetValue);
    setFormCurrency((target.currency as CurrencyCode) || "SAR");
    setFormPeriod(target.period);
    setFormStartDate(new Date(target.startDate).toISOString().split("T")[0]);
    setFormEndDate(new Date(target.endDate).toISOString().split("T")[0]);
    if (!target.userId) {
      setFormAssigneeId("TEAM");
    } else if (target.userId === currentUserId) {
      setFormAssigneeId("MYSELF");
    } else {
      setFormAssigneeId(target.userId);
    }
    setFormPipelineId(target.pipelineId || "ALL");
    setModalOpen(true);
  }

  // Submit Target
  async function handleSubmitTarget(e: React.FormEvent) {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast.error("Please enter a target title.");
      return;
    }

    const val = Number(formTargetValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Target value must be greater than zero.");
      return;
    }

    if (!formStartDate || !formEndDate) {
      toast.error("Please specify both start and end dates.");
      return;
    }

    if (new Date(formEndDate) <= new Date(formStartDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    let targetUserId: string | null = null;
    if (formAssigneeId === "MYSELF") {
      targetUserId = currentUserId;
    } else if (formAssigneeId !== "TEAM") {
      targetUserId = formAssigneeId;
    }

    startTransition(async () => {
      if (editingTarget) {
        const res = await updateTargetAction(editingTarget.id, {
          title: formTitle,
          type: formType,
          targetValue: val,
          currency: formCurrency,
          period: formPeriod,
          startDate: formStartDate,
          endDate: formEndDate,
          userId: targetUserId,
          pipelineId: formPipelineId === "ALL" ? null : formPipelineId,
        });

        if (res.success) {
          toast.success("Target updated successfully!");
          setModalOpen(false);
          await refreshTargets();
        } else {
          toast.error(res.error || "Failed to update target.");
        }
      } else {
        const res = await createTargetAction({
          title: formTitle,
          type: formType,
          targetValue: val,
          currency: formCurrency,
          period: formPeriod,
          startDate: formStartDate,
          endDate: formEndDate,
          userId: targetUserId,
          pipelineId: formPipelineId === "ALL" ? null : formPipelineId,
        });

        if (res.success) {
          toast.success("Target created successfully!");
          setModalOpen(false);
          await refreshTargets();
        } else {
          toast.error(res.error || "Failed to create target.");
        }
      }
    });
  }

  // Delete Target
  async function handleDeleteTarget(target: TargetWithProgress) {
    if (!confirm(`Are you sure you want to remove target "${target.title}"?`)) return;

    startTransition(async () => {
      const res = await deleteTargetAction(target.id);
      if (res.success) {
        toast.success("Target deleted successfully.");
        await refreshTargets();
      } else {
        toast.error(res.error || "Failed to delete target.");
      }
    });
  }

  // Filter Targets List
  const filteredTargets = useMemo(() => {
    return targetsList.filter((t) => {
      // Scope filter
      if (viewScope === "MY") {
        if (t.userId !== currentUserId) return false;
      } else if (viewScope === "ASSIGNED_BY_ME") {
        if (t.assignedByUserId !== currentUserId) return false;
      }

      // Type filter
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;

      // Period filter
      if (periodFilter !== "ALL" && t.period !== periodFilter) return false;

      return true;
    });
  }, [targetsList, viewScope, typeFilter, periodFilter, currentUserId]);

  // Aggregate KPI Highlights
  const kpis = useMemo(() => {
    // 1. Revenue Quotas: sum target vs current in display currency
    const revenueTargets = targetsList.filter((t) => t.type === "REVENUE_QUOTA");
    let totalQuotaTarget = 0;
    let totalQuotaActual = 0;

    for (const t of revenueTargets) {
      const tValConverted = convertCurrency(t.targetValue, t.currency, displayCurrency);
      const cValConverted = convertCurrency(t.currentValue, t.currency, displayCurrency);
      totalQuotaTarget += tValConverted;
      totalQuotaActual += cValConverted;
    }

    const quotaAttainment =
      totalQuotaTarget > 0 ? Math.round((totalQuotaActual / totalQuotaTarget) * 100) : 0;

    // 2. Demo Targets
    const demoTargets = targetsList.filter((t) => t.type === "DEMO_SCHEDULED");
    const totalDemosGoal = demoTargets.reduce((sum, t) => sum + t.targetValue, 0);
    const totalDemosActual = demoTargets.reduce((sum, t) => sum + t.currentValue, 0);
    const demosAttainment =
      totalDemosGoal > 0 ? Math.round((totalDemosActual / totalDemosGoal) * 100) : 0;

    // 3. Meeting Targets
    const meetingTargets = targetsList.filter((t) => t.type === "MEETING_SCHEDULED");
    const totalMeetingsGoal = meetingTargets.reduce((sum, t) => sum + t.targetValue, 0);
    const totalMeetingsActual = meetingTargets.reduce((sum, t) => sum + t.currentValue, 0);
    const meetingsAttainment =
      totalMeetingsGoal > 0 ? Math.round((totalMeetingsActual / totalMeetingsGoal) * 100) : 0;

    // 4. On Track vs Behind
    const activeCount = targetsList.length;
    const achievedCount = targetsList.filter((t) => t.paceStatus === "ACHIEVED").length;
    const onTrackCount = targetsList.filter(
      (t) => t.paceStatus === "AHEAD" || t.paceStatus === "ON_TRACK"
    ).length;

    return {
      totalQuotaTarget,
      totalQuotaActual,
      quotaAttainment,
      totalDemosGoal,
      totalDemosActual,
      demosAttainment,
      totalMeetingsGoal,
      totalMeetingsActual,
      meetingsAttainment,
      activeCount,
      achievedCount,
      onTrackCount,
    };
  }, [targetsList, displayCurrency]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm bg-surface border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl p-2 bg-brand/10 text-brand">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-text">Sales Targets &amp; Quotas</h1>
                {isTeamLeadOrAdmin && (
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Team Lead Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Set and track revenue quotas in SAR/USD, scheduled demos, discovery meetings, and team conversion milestones.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Currency Switcher Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-1 text-xs font-bold shadow-inner">
            <span className="text-[11px] text-text-muted px-2 font-medium">Currency:</span>
            <button
              onClick={() => setDisplayCurrency("SAR")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                displayCurrency === "SAR"
                  ? "bg-surface text-brand shadow-sm font-extrabold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span>🇸🇦 SAR (﷼)</span>
            </button>
            <button
              onClick={() => setDisplayCurrency("USD")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                displayCurrency === "USD"
                  ? "bg-surface text-brand shadow-sm font-extrabold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span>🇺🇸 USD ($)</span>
            </button>
          </div>

          {/* New Target Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-ink)",
              color: "var(--color-ink-fg, #ffffff)",
            }}
          >
            <Plus size={15} />
            <span>{isTeamLeadOrAdmin ? "Set Target or Quota" : "Set Personal Goal"}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Revenue Quota Attainment */}
        <div className="card p-4 space-y-2 border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Revenue Quota Attained
            </span>
            <DollarSign size={15} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-numeric text-2xl font-extrabold text-text">
              {kpis.quotaAttainment}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpis.totalQuotaActual, displayCurrency, { compact: true })}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.quotaAttainment)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            Target: {formatCurrency(kpis.totalQuotaTarget, displayCurrency)} ({displayCurrency})
          </p>
        </div>

        {/* 2. Demos Scheduled Target */}
        <div className="card p-4 space-y-2 border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Product Demos Goal
            </span>
            <Video size={15} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-numeric text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {kpis.totalDemosActual} <span className="text-xs text-text-muted font-normal">/ {kpis.totalDemosGoal}</span>
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {kpis.demosAttainment}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.demosAttainment)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            {Math.max(0, kpis.totalDemosGoal - kpis.totalDemosActual)} demos remaining to hit goal
          </p>
        </div>

        {/* 3. Meetings Scheduled Target */}
        <div className="card p-4 space-y-2 border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Discovery Meetings
            </span>
            <Calendar size={15} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-numeric text-2xl font-extrabold text-text">
              {kpis.totalMeetingsActual} <span className="text-xs text-text-muted font-normal">/ {kpis.totalMeetingsGoal}</span>
            </span>
            <span className="text-xs font-bold text-amber-600">
              {kpis.meetingsAttainment}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.meetingsAttainment)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            Client discovery sessions conducted
          </p>
        </div>

        {/* 4. Active Programs Status */}
        <div className="card p-4 space-y-2 border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Program Health
            </span>
            <Trophy size={15} className="text-brand" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-numeric text-2xl font-extrabold text-text">
              {kpis.activeCount} <span className="text-xs text-text-muted font-normal">active</span>
            </span>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 text-[10.5px] font-bold">
              {kpis.achievedCount} Achieved
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-text-muted">
            <span className="flex items-center gap-1 text-blue-500">
              <Zap size={12} /> {kpis.onTrackCount} on pace
            </span>
            <span>•</span>
            <span>{Math.max(0, kpis.activeCount - kpis.onTrackCount - kpis.achievedCount)} behind</span>
          </div>
          <p className="text-[10.5px] text-text-faint">Multi-team performance benchmark</p>
        </div>
      </div>

      {/* Filter Toolbar & View Scopes */}
      <div className="card p-3.5 bg-surface border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 text-xs font-semibold">
          <button
            onClick={() => setViewScope("ALL")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              viewScope === "ALL"
                ? "bg-surface text-text shadow-sm font-bold"
                : "text-text-muted hover:text-text"
            }`}
          >
            All Team Targets ({targetsList.length})
          </button>
          <button
            onClick={() => setViewScope("MY")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              viewScope === "MY"
                ? "bg-surface text-text shadow-sm font-bold"
                : "text-text-muted hover:text-text"
            }`}
          >
            My Targets
          </button>
          {isTeamLeadOrAdmin && (
            <button
              onClick={() => setViewScope("ASSIGNED_BY_ME")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewScope === "ASSIGNED_BY_ME"
                  ? "bg-surface text-text shadow-sm font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Assigned by Me
            </button>
          )}
        </div>

        {/* Secondary Category & Period Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-text-muted" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text outline-none focus:border-brand"
            >
              <option value="ALL">All Categories</option>
              <option value="REVENUE_QUOTA">Revenue Quotas</option>
              <option value="DEMO_SCHEDULED">Demos Scheduled</option>
              <option value="MEETING_SCHEDULED">Meetings Scheduled</option>
              <option value="DEALS_WON">Deals Closed</option>
              <option value="LEADS_GENERATED">Leads Generated</option>
            </select>
          </div>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text outline-none focus:border-brand"
          >
            <option value="ALL">All Periods</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {/* Targets Cards Grid */}
      {filteredTargets.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-border flex flex-col items-center justify-center space-y-3">
          <div className="rounded-full bg-surface-2 p-3 text-text-muted">
            <Target size={28} />
          </div>
          <h3 className="text-sm font-bold text-text">No targets found</h3>
          <p className="text-xs text-text-muted max-w-sm">
            {viewScope === "MY"
              ? "You do not have any active targets assigned to you. Click below to set a personal goal."
              : "No targets match the current filters. Set a new target or goal to start tracking progress."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="rounded-xl bg-brand hover:bg-brand-hover text-white px-4 py-2 text-xs font-bold transition-colors"
          >
            Set New Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTargets.map((target) => {
            const isRevenue = target.type === "REVENUE_QUOTA";

            // Format displayed values
            let displayTargetVal = "";
            let displayActualVal = "";
            let displayRemainingVal = "";

            if (isRevenue) {
              const targetConverted = convertCurrency(
                target.targetValue,
                target.currency,
                displayCurrency
              );
              const actualConverted = convertCurrency(
                target.currentValue,
                target.currency,
                displayCurrency
              );
              const remainingConverted = Math.max(0, targetConverted - actualConverted);

              displayTargetVal = formatCurrency(targetConverted, displayCurrency);
              displayActualVal = formatCurrency(actualConverted, displayCurrency);
              displayRemainingVal = formatCurrency(remainingConverted, displayCurrency);
            } else {
              displayTargetVal = `${target.targetValue.toLocaleString()}`;
              displayActualVal = `${target.currentValue.toLocaleString()}`;
              displayRemainingVal = `${target.remaining.toLocaleString()}`;
            }

            // Status Styling
            let paceBadge = {
              label: "On Track",
              icon: Target,
              bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            };
            if (target.paceStatus === "ACHIEVED") {
              paceBadge = {
                label: "Goal Achieved!",
                icon: Trophy,
                bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              };
            } else if (target.paceStatus === "AHEAD") {
              paceBadge = {
                label: "Ahead of Pace",
                icon: Zap,
                bg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
              };
            } else if (target.paceStatus === "BEHIND") {
              paceBadge = {
                label: "Behind Pace",
                icon: AlertTriangle,
                bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
              };
            }

            const canEdit =
              isTeamLeadOrAdmin ||
              target.assignedByUserId === currentUserId ||
              target.userId === currentUserId;

            return (
              <div
                key={target.id}
                className="card p-4 flex flex-col justify-between border border-border hover:border-brand/40 bg-surface shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  {/* Card Header: Type Badge & Period */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg p-1.5 bg-surface-2 text-brand">
                        {target.type === "REVENUE_QUOTA" && <DollarSign size={14} />}
                        {target.type === "DEMO_SCHEDULED" && <Video size={14} />}
                        {target.type === "MEETING_SCHEDULED" && <Calendar size={14} />}
                        {target.type === "DEALS_WON" && <Trophy size={14} />}
                        {target.type === "LEADS_GENERATED" && <Users size={14} />}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          {target.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-text-faint ml-1.5">
                          • {target.period}
                        </span>
                      </div>
                    </div>

                    {/* Pace Badge */}
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${paceBadge.bg}`}
                    >
                      <paceBadge.icon size={11} />
                      <span>{paceBadge.label}</span>
                    </span>
                  </div>

                  {/* Title & Pipeline */}
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-text line-clamp-1 group-hover:text-brand transition-colors">
                      {target.title}
                    </h3>
                    {target.pipeline && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <Layers size={11} />
                        <span>Pipeline: {target.pipeline.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Attainment Percentage & Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-numeric text-2xl font-extrabold text-text">
                          {displayActualVal}
                        </span>
                        <span className="text-xs text-text-muted">/ {displayTargetVal}</span>
                      </div>
                      <span className="font-numeric text-sm font-bold text-brand">
                        {target.percentage}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          target.percentage >= 100
                            ? "bg-emerald-500"
                            : target.paceStatus === "BEHIND"
                            ? "bg-amber-500"
                            : "bg-brand"
                        }`}
                        style={{ width: `${Math.min(100, target.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
                      <span>{displayRemainingVal} to hit goal</span>
                      <span className="flex items-center gap-1 text-text-faint">
                        <Clock size={11} /> {target.daysLeft}d left
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Assignee & Actions */}
                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                  {/* Assignee Badge */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {target.user ? (
                      <>
                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                          {target.user.image ? (
                            <img
                              src={target.user.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            target.user.name?.charAt(0) || "U"
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-[11px] font-bold text-text truncate">
                            {target.user.name}
                          </p>
                          <p className="text-[9.5px] text-text-muted truncate">
                            {target.user.designation || "Sales Rep"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-6 w-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                          <Building2 size={12} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-text">Team-Wide Target</p>
                          <p className="text-[9.5px] text-text-muted">Entire Organization</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(target)}
                        className="rounded-lg p-1.5 text-text-faint hover:bg-surface-2 hover:text-text transition-colors"
                        title="Edit Target"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteTarget(target)}
                        className="rounded-lg p-1.5 text-text-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Target"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Target Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl border border-border-strong bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
              <div>
                <h2 className="text-[16px] font-bold text-text flex items-center gap-2">
                  <Target size={18} className="text-brand" />
                  <span>{editingTarget ? "Edit Target or Goal" : "Set New Target or Milestone"}</span>
                </h2>
                <p className="text-[12px] text-text-muted mt-0.5">
                  {isTeamLeadOrAdmin
                    ? "Assign quota amounts, demo benchmarks, or meeting goals to your team or yourself."
                    : "Set personal activity goals for scheduled demos, client meetings, or pipeline velocity."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-text-faint hover:bg-surface hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Rep Permission Notice if user is standard REP */}
            {!isTeamLeadOrAdmin && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>
                  As a Sales Representative, you can set personal Demo, Meeting, Deal, and Lead goals for yourself. Quota amounts in SAR/USD can only be assigned by your Team Lead or Manager.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitTarget} className="p-5 space-y-4 overflow-y-auto">
              {/* Target Title */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">
                  Target Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Enterprise Revenue Quota, Monthly Demos Goal"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text outline-none focus:border-brand transition-all"
                />
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">
                  Milestone Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Revenue Quota (Only allowed for Team Leads / Admins) */}
                  <button
                    type="button"
                    disabled={!isTeamLeadOrAdmin}
                    onClick={() => {
                      setFormType("REVENUE_QUOTA");
                      if (formTargetValue === 15 || formTargetValue === 20) setFormTargetValue(500000);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formType === "REVENUE_QUOTA"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    } ${!isTeamLeadOrAdmin ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <DollarSign size={16} />
                    <span className="text-[11.5px] font-bold mt-1.5">Revenue Quota</span>
                    <span className="text-[9.5px] text-text-muted">
                      {isTeamLeadOrAdmin ? "Sales amount" : "Team Lead Only"}
                    </span>
                  </button>

                  {/* Demos Scheduled */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("DEMO_SCHEDULED");
                      if (Number(formTargetValue) > 1000) setFormTargetValue(20);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formType === "DEMO_SCHEDULED"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Video size={16} />
                    <span className="text-[11.5px] font-bold mt-1.5">Demos Scheduled</span>
                    <span className="text-[9.5px] text-text-muted">Product presentations</span>
                  </button>

                  {/* Meetings Scheduled */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("MEETING_SCHEDULED");
                      if (Number(formTargetValue) > 1000) setFormTargetValue(35);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formType === "MEETING_SCHEDULED"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Calendar size={16} />
                    <span className="text-[11.5px] font-bold mt-1.5">Discovery Meetings</span>
                    <span className="text-[9.5px] text-text-muted">Client consultations</span>
                  </button>

                  {/* Deals Won */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("DEALS_WON");
                      if (Number(formTargetValue) > 1000) setFormTargetValue(10);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formType === "DEALS_WON"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Trophy size={16} />
                    <span className="text-[11.5px] font-bold mt-1.5">Deals Closed Won</span>
                    <span className="text-[9.5px] text-text-muted">Closed contracts</span>
                  </button>

                  {/* Leads Generated */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("LEADS_GENERATED");
                      if (Number(formTargetValue) > 1000) setFormTargetValue(50);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formType === "LEADS_GENERATED"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Users size={16} />
                    <span className="text-[11.5px] font-bold mt-1.5">Leads Generated</span>
                    <span className="text-[9.5px] text-text-muted">New prospects</span>
                  </button>
                </div>
              </div>

              {/* Target Value & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1.5">
                    Target Goal Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={formType === "REVENUE_QUOTA" ? "500000" : "25"}
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text outline-none focus:border-brand"
                  />
                </div>

                {formType === "REVENUE_QUOTA" ? (
                  <div>
                    <label className="block text-[12px] font-semibold text-text mb-1.5">
                      Currency
                    </label>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text outline-none focus:border-brand"
                    >
                      <option value="SAR">🇸🇦 Saudi Riyal (SAR / ﷼)</option>
                      <option value="USD">🇺🇸 US Dollar (USD / $)</option>
                      <option value="AED">🇦🇪 UAE Dirham (AED)</option>
                      <option value="EUR">🇪🇺 Euro (EUR / €)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[12px] font-semibold text-text mb-1.5">
                      Unit
                    </label>
                    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted font-medium">
                      {formType === "DEMO_SCHEDULED" && "Completed Demos"}
                      {formType === "MEETING_SCHEDULED" && "Scheduled Meetings"}
                      {formType === "DEALS_WON" && "Won Deal Contracts"}
                      {formType === "LEADS_GENERATED" && "Qualified Leads"}
                    </div>
                  </div>
                )}
              </div>

              {/* Period Presets & Dates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-semibold text-text">
                    Timeframe &amp; Active Period
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-brand">
                    <button
                      type="button"
                      onClick={() => {
                        setFormPeriod("MONTHLY");
                        applyPeriodPreset("MONTHLY");
                      }}
                      className="hover:underline font-semibold"
                    >
                      This Month
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormPeriod("QUARTERLY");
                        applyPeriodPreset("QUARTERLY");
                      }}
                      className="hover:underline font-semibold"
                    >
                      This Quarter
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormPeriod("ANNUAL");
                        applyPeriodPreset("ANNUAL");
                      }}
                      className="hover:underline font-semibold"
                    >
                      This Year
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10.5px] text-text-muted mb-1">Start Date</span>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => {
                        setFormStartDate(e.target.value);
                        setFormPeriod("CUSTOM");
                      }}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <span className="block text-[10.5px] text-text-muted mb-1">End Date</span>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => {
                        setFormEndDate(e.target.value);
                        setFormPeriod("CUSTOM");
                      }}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Target Assignee (Team Lead controls) */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">
                  Target Assignee
                </label>
                {isTeamLeadOrAdmin ? (
                  <select
                    value={formAssigneeId}
                    onChange={(e) => setFormAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text outline-none focus:border-brand"
                  >
                    <option value="TEAM">🏢 Entire Team / Organization (Collective Target)</option>
                    <option value="MYSELF">👤 Myself (Team Lead Personal Target)</option>
                    <optgroup label="Assign to Sales Representative">
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          👤 {m.name} ({m.designation || m.role})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
                  <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text flex items-center gap-2">
                    <UserCheck size={14} className="text-brand" />
                    <span>Myself (Personal Representative Goal)</span>
                  </div>
                )}
              </div>

              {/* Optional Pipeline Restriction */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1.5">
                  Pipeline Scope (Optional)
                </label>
                <select
                  value={formPipelineId}
                  onChange={(e) => setFormPipelineId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text outline-none focus:border-brand"
                >
                  <option value="ALL">All Sales Pipelines</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border bg-surface hover:bg-surface-2 px-4 py-2 text-xs font-semibold text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-ink-fg, #ffffff)",
                  }}
                >
                  {pending ? "Saving..." : editingTarget ? "Update Target" : "Create Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

