"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Crown,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  CheckSquare,
  ArrowRight,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  X,
  Search,
  Lock,
  Eye,
  Target,
  DollarSign,
  Calendar,
  Video,
  Trophy,
} from "lucide-react";
import {
  approveMemberAction,
  declineMemberAction,
  updatePermissionsAction,
  assignLeadsToMemberAction,
  assignTaskToMemberAction,
  createTeamMemberAction,
  removeTeamMemberAction,
  getMemberAuditStatsAction,
  assignQuotaToMemberAction,
} from "./actions";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/toast-context";

export type AssignedQuota = {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currency: string;
  period: string;
  startDate: Date;
  endDate: Date;
};

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  accountType: string;
  department: string | null;
  orgRole: string | null;
  status: string;
  companyDomain: string | null;
  phone: string | null;
  occupation: string | null;
  permissions: string | null;
  createdAt: Date;
  leadsCount?: number;
  dealsWonCount?: number;
  assignedQuota?: AssignedQuota | null;
};

export type AvailableLead = {
  id: string;
  contactName: string;
  company: string | null;
  score: string | null;
  ownerId: string | null;
};

interface TeamClientProps {
  currentUser: any;
  members: TeamMember[];
  pendingMembers: TeamMember[];
  availableLeads: AvailableLead[];
  departmentName: string;
  companyDomain: string;
}

export function TeamClient({
  currentUser,
  members,
  pendingMembers,
  availableLeads,
  departmentName,
  companyDomain,
}: TeamClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"directory" | "pending">("directory");
  const [searchQuery, setSearchQuery] = useState("");

  const isTeamLead =
    currentUser?.orgRole === "TEAM_LEAD" ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "MANAGER";

  // Modal states
  const toast = useToast();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectedData, setInspectedData] = useState<any>(null);
  const [permissionsModalMember, setPermissionsModalMember] = useState<TeamMember | null>(null);
  const [assignLeadsMember, setAssignLeadsMember] = useState<TeamMember | null>(null);
  const [assignTaskMember, setAssignTaskMember] = useState<TeamMember | null>(null);
  const [assignQuotaMember, setAssignQuotaMember] = useState<TeamMember | null>(null);

  // Assign Quota Form State
  const [quotaForm, setQuotaForm] = useState({
    title: "",
    type: "REVENUE_QUOTA" as "REVENUE_QUOTA" | "DEMO_SCHEDULED" | "MEETING_SCHEDULED" | "DEALS_WON" | "LEADS_GENERATED",
    targetValue: 250000 as number | string,
    currency: "SAR",
    period: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM",
    startDate: "",
    endDate: "",
  });

  function handleOpenAssignQuota(member: TeamMember) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setAssignQuotaMember(member);
    setQuotaForm({
      title: `Monthly Quota — ${member.name || member.email}`,
      type: "REVENUE_QUOTA",
      targetValue: 250000,
      currency: "SAR",
      period: "MONTHLY",
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  }

  function handleSubmitAssignQuota(e: React.FormEvent) {
    e.preventDefault();
    if (!assignQuotaMember) return;

    if (!quotaForm.title.trim()) {
      toast.error("Please enter a quota or target title.");
      return;
    }

    const val = Number(quotaForm.targetValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Quota value must be greater than zero.");
      return;
    }

    startTransition(async () => {
      const res = await assignQuotaToMemberAction({
        memberId: assignQuotaMember.id,
        title: quotaForm.title,
        type: quotaForm.type,
        targetValue: val,
        currency: quotaForm.currency,
        period: quotaForm.period,
        startDate: quotaForm.startDate,
        endDate: quotaForm.endDate,
      });

      if (res.success) {
        toast.success(res.message || "Quota assigned successfully!");
        setAssignQuotaMember(null);
      } else {
        toast.error(res.error || "Failed to assign quota.");
      }
    });
  }

  // Add Member Form
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    orgRole: "REPRESENTATIVE",
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Assign Task Form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  });

  // Assign Leads Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Permissions state for modal
  const [editPermissions, setEditPermissions] = useState({
    canExportLeads: true,
    canDeleteLeads: false,
    canViewReports: true,
    canReassignLeads: false,
    canManagePipelines: false,
  });

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.name?.toLowerCase() || "").includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.occupation?.toLowerCase() || "").includes(q) ||
      (m.orgRole?.toLowerCase() || "").includes(q)
    );
  });

  // 1-Click Approve Member
  function handleApprove(memberId: string) {
    startTransition(async () => {
      await approveMemberAction(memberId);
    });
  }

  // 1-Click Decline Member
  function handleDecline(memberId: string) {
    if (!confirm("Are you sure you want to decline this applicant?")) return;
    startTransition(async () => {
      await declineMemberAction(memberId);
    });
  }

  // Inspect Member Stats (Read-Only)
  async function handleInspect(member: TeamMember) {
    setInspectedData(null);
    setInspectModalOpen(true);
    const data = await getMemberAuditStatsAction(member.id);
    setInspectedData(data);
  }

  // Open Permissions Modal
  function handleOpenPermissions(member: TeamMember) {
    let perms = {
      canExportLeads: true,
      canDeleteLeads: false,
      canViewReports: true,
      canReassignLeads: false,
      canManagePipelines: false,
    };
    if (member.permissions) {
      try {
        perms = { ...perms, ...JSON.parse(member.permissions) };
      } catch (e) {}
    }
    setEditPermissions(perms);
    setPermissionsModalMember(member);
  }

  // Save Permissions
  function handleSavePermissions() {
    if (!permissionsModalMember) return;
    startTransition(async () => {
      await updatePermissionsAction(permissionsModalMember.id, editPermissions);
      setPermissionsModalMember(null);
    });
  }

  // Submit Lead Assignment
  function handleAssignLeads() {
    if (!assignLeadsMember || selectedLeadIds.length === 0) return;
    startTransition(async () => {
      await assignLeadsToMemberAction(assignLeadsMember.id, selectedLeadIds);
      setAssignLeadsMember(null);
      setSelectedLeadIds([]);
    });
  }

  // Submit Task Assignment
  function handleAssignTask() {
    if (!assignTaskMember || !taskForm.title.trim()) return;
    startTransition(async () => {
      await assignTaskToMemberAction(assignTaskMember.id, {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
      });
      setAssignTaskMember(null);
      setTaskForm({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
    });
  }

  // Add Member Submit
  function handleCreateMember() {
    setAddError(null);
    startTransition(async () => {
      const res = await createTeamMemberAction({
        name: newMemberForm.name,
        email: newMemberForm.email,
        password: newMemberForm.password,
        orgRole: newMemberForm.orgRole,
        department: departmentName,
      });
      if (res.error) {
        setAddError(res.error);
        return;
      }
      setAddMemberOpen(false);
      setNewMemberForm({ name: "", email: "", password: "", orgRole: "REPRESENTATIVE" });
    });
  }

  // Remove Member
  function handleRemoveMember(member: TeamMember) {
    if (!confirm(`Are you sure you want to remove ${member.name || member.email}? Their assigned leads and deals will be unassigned.`)) {
      return;
    }
    startTransition(async () => {
      await removeTeamMemberAction(member.id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Ribbon */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-indigo-600 text-white shadow-md font-bold text-xl">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text">Department Team &amp; Governance</h1>
                <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[11px] font-bold border border-brand/20">
                  {departmentName || "Sales"}
                </span>
                {companyDomain && (
                  <span className="font-mono text-[11px] text-text-muted bg-surface-2 px-2 py-0.5 rounded-md border border-border">
                    @{companyDomain}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text-muted mt-0.5">
                {isTeamLead ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Crown size={14} />
                    You are verified Team Lead. You can manage members, approvals, and permissions.
                  </span>
                ) : (
                  <span>
                    Viewing department directory. Contact your Team Lead for additional permissions.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isTeamLead && (
              <button
                type="button"
                onClick={() => setAddMemberOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-xs hover:bg-ink-hover active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Counters Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Active Members
            </span>
            <p className="text-2xl font-bold text-text mt-1">{members.length}</p>
          </div>

          <div
            onClick={() => setActiveTab("pending")}
            className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
              pendingMembers.length > 0
                ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15"
                : "border-border bg-surface-2/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending Approvals
              </span>
              {pendingMembers.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {pendingMembers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Unassigned Leads
            </span>
            <p className="text-2xl font-bold text-text mt-1">
              {availableLeads.filter((l) => !l.ownerId).length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Total Leads in Dept
            </span>
            <p className="text-2xl font-bold text-text mt-1">{availableLeads.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
              activeTab === "directory"
                ? "bg-brand text-white shadow-xs"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            <Users size={15} />
            <span>Team Directory</span>
            <span className="rounded-full bg-white/20 px-2 py-0.2 text-[11px]">
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
              activeTab === "pending"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            <Clock size={15} />
            <span>Pending Approvals</span>
            {pendingMembers.length > 0 && (
              <span className="rounded-full bg-amber-500 text-slate-950 font-black px-2 py-0.5 text-[11px] animate-pulse">
                {pendingMembers.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "directory" && (
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-8 pr-3.5 py-1.5 text-[12.5px] text-text placeholder:text-text-muted outline-none focus:border-brand shadow-xs"
            />
          </div>
        )}
      </div>

      {/* ======================= TAB 1: TEAM DIRECTORY ======================= */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isMemberLead = member.orgRole === "TEAM_LEAD";
            const initials = (member.name || member.email)
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={member.id}
                className={`rounded-2xl border bg-surface p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isMemberLead
                    ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-surface"
                    : "border-border"
                }`}
              >
                <div>
                  {/* Header: Avatar, Name, Role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-sm shadow-xs ${
                          isMemberLead
                            ? "bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950"
                            : "bg-surface-2 text-text border border-border"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-text text-[14.5px] truncate">
                            {member.name || member.email}
                          </h3>
                        </div>
                        <span className="block text-[12px] text-text-muted truncate">
                          {member.occupation || "Team Member"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border shrink-0 ${
                        isMemberLead
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-surface-2 text-text-muted border-border"
                      }`}
                    >
                      {isMemberLead && <Crown size={12} />}
                      {member.orgRole || "Representative"}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 py-2.5 border-y border-border text-[12px] text-text-muted">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-text-faint shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-text-faint shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 py-1 text-center">
                    <div className="rounded-xl bg-surface-2/60 p-2 border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint">
                        Assigned Leads
                      </span>
                      <p className="text-[15px] font-bold text-text">
                        {member.leadsCount !== undefined ? member.leadsCount : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-2/60 p-2 border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint">
                        Deals Won
                      </span>
                      <p className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                        {member.dealsWonCount !== undefined ? member.dealsWonCount : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Quota Badge */}
                  {member.assignedQuota ? (
                    <div className="mt-2.5 p-2 rounded-xl bg-brand/5 border border-brand/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-brand font-bold truncate">
                        <Target size={13} className="shrink-0" />
                        <span className="truncate">{member.assignedQuota.title}</span>
                      </div>
                      <span className="font-numeric font-extrabold text-text shrink-0 ml-2">
                        {member.assignedQuota.type === "REVENUE_QUOTA"
                          ? formatCurrency(member.assignedQuota.targetValue, member.assignedQuota.currency)
                          : `${member.assignedQuota.targetValue.toLocaleString()} ${
                              member.assignedQuota.type === "DEMO_SCHEDULED"
                                ? "Demos"
                                : member.assignedQuota.type === "MEETING_SCHEDULED"
                                ? "Meetings"
                                : "Deals"
                            }`}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2.5 p-1.5 rounded-xl bg-surface-2/40 border border-dashed border-border text-center text-[10.5px] text-text-faint flex items-center justify-center gap-1">
                      <Target size={11} />
                      <span>No active quota assigned</span>
                    </div>
                  )}
                </div>

                {/* Team Lead Actions */}
                {isTeamLead && (
                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAssignQuota(member)}
                      className="flex items-center gap-1 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand px-2.5 py-1.5 text-[11.5px] font-bold border border-brand/30 transition-colors cursor-pointer"
                      title="Set Quota or Target for this member"
                    >
                      <Target size={13} />
                      <span>Assign Quota</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInspect(member)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface-2 hover:bg-surface-elevated px-2.5 py-1.5 text-[11.5px] font-semibold text-text border border-border transition-colors cursor-pointer"
                      title="Inspect Rep Stats & Performance (Read-Only)"
                    >
                      <Eye size={13} className="text-brand" />
                      <span>Inspect Stats</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignLeadsMember(member);
                        setSelectedLeadIds([]);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-surface-2 hover:bg-surface-elevated px-2.5 py-1.5 text-[11.5px] font-semibold text-text border border-border transition-colors cursor-pointer"
                      title="Assign Leads to Member"
                    >
                      <span>Assign Leads</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignTaskMember(member);
                        setTaskForm({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
                      }}
                      className="flex items-center gap-1 rounded-xl bg-surface-2 hover:bg-surface-elevated px-2.5 py-1.5 text-[11.5px] font-semibold text-text border border-border transition-colors cursor-pointer"
                      title="Assign Task to Member"
                    >
                      <CheckSquare size={13} />
                      <span>Task</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPermissions(member)}
                      className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 border border-border transition-colors cursor-pointer"
                      title="Edit Portal Permissions"
                    >
                      <Sliders size={13} />
                    </button>

                    {member.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 rounded-xl text-text-faint hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================= TAB 2: PENDING APPROVALS ======================= */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingMembers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-text">All Caught Up!</h3>
              <p className="text-[13px] text-text-muted mt-1 max-w-sm mx-auto">
                There are currently no pending signup approval requests for the {departmentName} team.
              </p>
            </div>
          ) : (
            pendingMembers.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-base">
                    {p.name?.charAt(0) || p.email.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text text-[15px]">{p.name || p.email}</h4>
                      <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-bold border border-amber-500/30">
                        Requested: {p.orgRole || "Representative"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[12.5px] text-text-muted">
                      <span>{p.email}</span>
                      {p.phone && <span>• {p.phone}</span>}
                      <span>
                        • Applied: {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {isTeamLead ? (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleApprove(p.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-[12.5px] font-bold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve Member</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDecline(p.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 px-3.5 py-2 text-[12.5px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <XCircle size={15} />
                      <span>Decline</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                    Awaiting Team Lead Decision
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================= MODAL: REP STATS INSPECTOR (READ-ONLY) ======================= */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand font-bold">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-text text-[16px]">
                    Rep Performance &amp; Audit Inspector
                  </h3>
                  <p className="text-[11.5px] text-text-muted">
                    Read-only performance audit view. (Team Leads cannot mutate rep&apos;s personal dashboard directly)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
              {!inspectedData ? (
                <div className="py-12 text-center text-text-muted">Loading audit telemetry...</div>
              ) : (
                <>
                  {/* Rep Bio */}
                  <div className="rounded-2xl border border-border bg-surface-2/60 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-text text-[15px]">
                        {inspectedData.member.name}
                      </h4>
                      <p className="text-[12px] text-text-muted">
                        {inspectedData.member.email} • {inspectedData.member.orgRole}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-[11px] font-bold border border-emerald-500/20">
                      Status: {inspectedData.member.status}
                    </span>
                  </div>

                  {/* High level metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Assigned Leads
                      </span>
                      <p className="text-xl font-bold text-text mt-1">
                        {inspectedData.stats.totalLeads}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Deals Won
                      </span>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {inspectedData.stats.wonDealsCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Won Value
                      </span>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        SAR {(inspectedData.stats.wonValue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Pipeline Value
                      </span>
                      <p className="text-xl font-bold text-brand mt-1">
                        SAR {(inspectedData.stats.openPipelineValue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Tasks progress */}
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12.5px] font-bold text-text">Task Velocity</span>
                      <span className="text-[12px] font-medium text-text-muted">
                        {inspectedData.stats.completedTasksCount} / {inspectedData.stats.totalTasks}{" "}
                        completed
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all"
                        style={{
                          width: `${
                            inspectedData.stats.totalTasks > 0
                              ? (inspectedData.stats.completedTasksCount /
                                  inspectedData.stats.totalTasks) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recent Leads Sample */}
                  <div>
                    <h5 className="text-[12.5px] font-bold text-text mb-2">Recent Active Leads</h5>
                    {inspectedData.leads.length === 0 ? (
                      <p className="text-[12px] text-text-muted italic">No leads currently assigned.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {inspectedData.leads.slice(0, 5).map((l: any) => (
                          <div
                            key={l.id}
                            className="rounded-xl border border-border bg-surface p-2.5 flex items-center justify-between text-[12.5px]"
                          >
                            <div>
                              <span className="font-semibold text-text">{l.contactName}</span>
                              {l.company && (
                                <span className="text-text-muted ml-2">({l.company})</span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-text-muted">
                              {l.score || "WARM"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="rounded-xl bg-surface-2 hover:bg-surface-elevated px-4 py-2 text-[13px] font-semibold text-text border border-border transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT PERMISSIONS ======================= */}
      {permissionsModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-text text-[15px]">Portal Permissions</h3>
                  <p className="text-[11.5px] text-text-muted">
                    {permissionsModalMember.name || permissionsModalMember.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermissionsModalMember(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 py-4 text-[13px]">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-surface-2 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Export Leads to CSV/Excel</span>
                  <span className="text-[11px] text-text-muted">Can download pipeline data</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canExportLeads}
                  onChange={(e) =>
                    setEditPermissions((p) => ({ ...p, canExportLeads: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-surface-2 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Delete Leads &amp; Deals</span>
                  <span className="text-[11px] text-text-muted">Permanent deletion privilege</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canDeleteLeads}
                  onChange={(e) =>
                    setEditPermissions((p) => ({ ...p, canDeleteLeads: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-surface-2 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">View Executive Reports</span>
                  <span className="text-[11px] text-text-muted">Access analytics and charts</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canViewReports}
                  onChange={(e) =>
                    setEditPermissions((p) => ({ ...p, canViewReports: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-surface-2 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Reassign Lead Ownership</span>
                  <span className="text-[11px] text-text-muted">Transfer leads between reps</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canReassignLeads}
                  onChange={(e) =>
                    setEditPermissions((p) => ({ ...p, canReassignLeads: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-surface-2 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Manage Pipeline Stages</span>
                  <span className="text-[11px] text-text-muted">Add, reorder, or remove stages</span>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canManagePipelines}
                  onChange={(e) =>
                    setEditPermissions((p) => ({ ...p, canManagePipelines: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPermissionsModalMember(null)}
                className="rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSavePermissions}
                className="rounded-xl bg-brand px-4 py-2 text-[12.5px] font-bold text-white shadow-xs hover:bg-brand-hover"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ASSIGN LEADS ======================= */}
      {assignLeadsMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-text text-[15px]">
                  Assign Leads to {assignLeadsMember.name || assignLeadsMember.email}
                </h3>
                <p className="text-[11.5px] text-text-muted">
                  Select available or unassigned leads to transfer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignLeadsMember(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
              {availableLeads.length === 0 ? (
                <p className="text-[13px] text-text-muted py-6 text-center">No leads available.</p>
              ) : (
                availableLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  return (
                    <label
                      key={lead.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked ? "border-brand bg-brand/10" : "border-border hover:bg-surface-2"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-text text-[13px]">{lead.contactName}</p>
                        <p className="text-[11.5px] text-text-muted">
                          {lead.company || "Individual Lead"} • Score: {lead.score || "WARM"}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds((prev) => [...prev, lead.id]);
                          } else {
                            setSelectedLeadIds((prev) => prev.filter((id) => id !== lead.id));
                          }
                        }}
                        className="h-4 w-4 rounded accent-brand"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[12px] text-text-muted">
                {selectedLeadIds.length} lead(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignLeadsMember(null)}
                  className="rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedLeadIds.length === 0 || isPending}
                  onClick={handleAssignLeads}
                  className="rounded-xl bg-brand px-4 py-2 text-[12.5px] font-bold text-white shadow-xs hover:bg-brand-hover disabled:opacity-40"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ASSIGN TASK ======================= */}
      {assignTaskMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-text text-[15px]">
                  Assign Task to {assignTaskMember.name || assignTaskMember.email}
                </h3>
                <p className="text-[11.5px] text-text-muted">
                  Create a tracked action item with priority and due date
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignTaskMember(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-[13px]">
              <div>
                <label className="font-semibold text-text text-[12.5px]">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule commercial contract demo"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="font-semibold text-text text-[12.5px]">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Key talking points or objective..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text text-[12.5px]">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="font-semibold text-text text-[12.5px]">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((f) => ({ ...f, priority: e.target.value as any }))
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignTaskMember(null)}
                className="rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!taskForm.title.trim() || isPending}
                onClick={handleAssignTask}
                className="rounded-xl bg-brand px-4 py-2 text-[12.5px] font-bold text-white shadow-xs hover:bg-brand-hover disabled:opacity-40"
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD MEMBER ======================= */}
      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-text text-[15px]">Add Team Member Directly</h3>
                <p className="text-[11.5px] text-text-muted">
                  Create an active department account with direct password
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddMemberOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-[13px]">
              <div>
                <label className="font-semibold text-text text-[12.5px]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zaid Mansoor"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="font-semibold text-text text-[12.5px]">Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder={`name@${companyDomain || "company.com"}`}
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="font-semibold text-text text-[12.5px]">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="font-semibold text-text text-[12.5px]">Role</label>
                <select
                  value={newMemberForm.orgRole}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, orgRole: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand"
                >
                  <option value="REPRESENTATIVE">Representative</option>
                  <option value="EXECUTIVE">Account Executive</option>
                  <option value="SPECIALIST">Operations Specialist</option>
                  <option value="INTERN">Associate / Intern</option>
                </select>
              </div>

              {addError && (
                <p className="text-[12px] text-rose-500 font-medium">{addError}</p>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddMemberOpen(false)}
                className="rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !newMemberForm.name.trim() ||
                  !newMemberForm.email.trim() ||
                  newMemberForm.password.length < 6 ||
                  isPending
                }
                onClick={handleCreateMember}
                className="rounded-xl bg-brand px-4 py-2 text-[12.5px] font-bold text-white shadow-xs hover:bg-brand-hover disabled:opacity-40"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ASSIGN QUOTA OR TARGET ======================= */}
      {assignQuotaMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3.5">
              <div>
                <h3 className="font-bold text-text text-base flex items-center gap-2">
                  <Target size={18} className="text-brand" />
                  <span>Assign Quota &amp; Targets</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Set individual revenue quotas or activity goals for this team member.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignQuotaMember(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Member Profile Banner */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-sm">
                {assignQuotaMember.name?.charAt(0) || assignQuotaMember.email.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text truncate">
                  {assignQuotaMember.name || assignQuotaMember.email}
                </p>
                <p className="text-[11px] text-text-muted">
                  {assignQuotaMember.orgRole || "Representative"} • {assignQuotaMember.email}
                </p>
              </div>
            </div>

            {/* Notification alert info */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>
                Once assigned, <strong>{assignQuotaMember.name}</strong> will receive an instant high-priority notification message in their CRM header, and their personal dashboard &amp; quotas will be updated.
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAssignQuota} className="space-y-3.5">
              {/* Target Title */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1">
                  Quota Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Sales Quota, Monthly Demos Milestone"
                  value={quotaForm.title}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text outline-none focus:border-brand"
                />
              </div>

              {/* Milestone Category */}
              <div>
                <label className="block text-[12px] font-semibold text-text mb-1">
                  Milestone Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuotaForm((f) => ({ ...f, type: "REVENUE_QUOTA", targetValue: 250000 }))}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      quotaForm.type === "REVENUE_QUOTA"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <DollarSign size={15} className="shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Revenue Quota</p>
                      <p className="text-[10px] text-text-muted">Closed won amount</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuotaForm((f) => ({ ...f, type: "DEMO_SCHEDULED", targetValue: 15 }))}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      quotaForm.type === "DEMO_SCHEDULED"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Video size={15} className="shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Demos Scheduled</p>
                      <p className="text-[10px] text-text-muted">Live presentations</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuotaForm((f) => ({ ...f, type: "MEETING_SCHEDULED", targetValue: 25 }))}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      quotaForm.type === "MEETING_SCHEDULED"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Calendar size={15} className="shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Discovery Meetings</p>
                      <p className="text-[10px] text-text-muted">Client sessions</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuotaForm((f) => ({ ...f, type: "DEALS_WON", targetValue: 8 }))}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      quotaForm.type === "DEALS_WON"
                        ? "border-brand bg-brand/5 ring-1 ring-brand text-brand"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    <Trophy size={15} className="shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Deals Won</p>
                      <p className="text-[10px] text-text-muted">Closed contracts</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Value & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-text mb-1">
                    Target Goal Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quotaForm.targetValue}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, targetValue: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text outline-none focus:border-brand"
                  />
                </div>

                {quotaForm.type === "REVENUE_QUOTA" ? (
                  <div>
                    <label className="block text-[12px] font-semibold text-text mb-1">
                      Currency
                    </label>
                    <select
                      value={quotaForm.currency}
                      onChange={(e) => setQuotaForm((f) => ({ ...f, currency: e.target.value }))}
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
                    <label className="block text-[12px] font-semibold text-text mb-1">
                      Unit
                    </label>
                    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted font-medium">
                      {quotaForm.type === "DEMO_SCHEDULED" && "Product Demos"}
                      {quotaForm.type === "MEETING_SCHEDULED" && "Client Meetings"}
                      {quotaForm.type === "DEALS_WON" && "Won Contracts"}
                    </div>
                  </div>
                )}
              </div>

              {/* Period & Dates */}
              <div className="space-y-2">
                <label className="block text-[12px] font-semibold text-text">
                  Timeframe &amp; Active Dates
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10.5px] text-text-muted mb-1">Start Date</span>
                    <input
                      type="date"
                      required
                      value={quotaForm.startDate}
                      onChange={(e) => setQuotaForm((f) => ({ ...f, startDate: e.target.value, period: "CUSTOM" }))}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <span className="block text-[10.5px] text-text-muted mb-1">End Date</span>
                    <input
                      type="date"
                      required
                      value={quotaForm.endDate}
                      onChange={(e) => setQuotaForm((f) => ({ ...f, endDate: e.target.value, period: "CUSTOM" }))}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignQuotaMember(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-text-muted hover:text-text border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-brand hover:bg-brand-hover px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-40 transition-colors"
                >
                  {isPending ? "Assigning..." : "Assign Quota & Notify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

