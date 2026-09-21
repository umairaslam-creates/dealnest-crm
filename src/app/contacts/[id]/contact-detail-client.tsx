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
  ShieldCheck,
  Send,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Check,
  Package,
  CreditCard,
  MoreVertical,
  CheckSquare,
  DollarSign,
  Activity,
} from "lucide-react";
import { logActivity, toggleTask, deleteTask, deleteContact } from "@/app/actions";
import { TaskModal } from "@/components/task-modal";
import { useToast } from "@/components/toast-context";
import { Product } from "@/db/schema";

export function ContactDetailClient({
  contact,
  account,
  deals = [],
  tasks = [],
  activities = [],
  products = [],
  members = [],
  currentUser,
}: {
  contact: any;
  account: any;
  deals: any[];
  tasks: any[];
  activities: any[];
  products: Product[];
  members: any[];
  currentUser: any;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "info" | "deals" | "products" | "tasks" | "timeline"
  >("info");

  // Interaction logger
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"CALL" | "MEETING" | "NOTE" | "EMAIL">("NOTE");
  const [activityList, setActivityList] = useState(activities);
  const [taskList, setTaskList] = useState(tasks);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Product interests list
  const [productInterests, setProductInterests] = useState<string[]>([
    "MYTM Smart POS X990",
    "Unified Payment Gateway API",
    "Corporate Fleet Cards",
    "ZATCA E-Invoicing",
  ]);
  const [newInterestInput, setNewInterestInput] = useState("");
  const [showAddInterest, setShowAddInterest] = useState(false);

  const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const activeDealsCount = deals.filter((d) => d.status === "OPEN").length;
  const openTasksCount = taskList.filter((t) => !t.done).length;

  const initials = contact.name
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = contact.name.split(" ")[0] || contact.name;

  function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    startTransition(async () => {
      try {
        await logActivity({
          type: noteType,
          notes: noteText,
          contactId: contact.id,
          userId: currentUser?.id,
        });
        setActivityList((prev) => [
          {
            id: "temp_" + Date.now(),
            type: noteType,
            notes: noteText,
            occurredAt: new Date(),
            user: currentUser,
          },
          ...prev,
        ]);
        setNoteText("");
        toast.success("Activity recorded successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to log activity");
      }
    });
  }

  function handleToggleTask(taskId: string, currentDone: boolean) {
    setTaskList((prev) =>
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
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, done: currentDone } : t))
        );
        toast.error("Failed to update task");
      }
    });
  }

  function handleAddInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!newInterestInput.trim()) return;
    setProductInterests((prev) => [...prev, newInterestInput.trim()]);
    setNewInterestInput("");
    setShowAddInterest(false);
    toast.success("Added product interest");
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
        <Link href="/contacts" className="hover:text-text transition-colors">
          Contacts
        </Link>
        <span>/</span>
        <span className="text-text font-bold">{contact.name}</span>
        <span className="text-text-faint ml-1">⇅</span>
      </div>

      {/* Hero Profile Banner Card (Modeled after Inspiration Image 2 & 3) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl card p-5 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-brand via-indigo-500 to-indigo-400 text-white font-bold text-2xl shadow-sm ring-4 ring-brand/10">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-surface" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-text">
                {contact.name}
              </h2>
              {contact.role && (
                <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[10.5px] font-bold text-brand">
                  {contact.role}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {contact.title || "Key Stakeholder"} • {account?.name || "Corporate Enterprise"} • Joined{" "}
              {new Date(contact.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons (Inspired by Image 2 & 3) */}
        <div className="flex items-center gap-2.5">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm active:scale-[0.98] transition-all"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-ink-fg, #ffffff)",
              }}
            >
              <Mail size={14} />
              <span>Chat with {firstName}</span>
            </a>
          )}

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 shadow-2xs transition-colors"
              title="Call Contact"
            >
              <Phone size={15} />
            </a>
          )}

          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-brand hover:bg-surface-2 shadow-2xs transition-colors"
            title="Create Task for Contact"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Pill Navigation Tabs (Modeled after Image 2 & 3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border pb-2">
        {[
          { id: "info", label: "Contact Information" },
          { id: "deals", label: `Associated Deals (${deals.length})` },
          { id: "products", label: "Products & Solutions" },
          { id: "tasks", label: `Tasks & Action Items (${openTasksCount})` },
          { id: "timeline", label: "Activity & Timeline" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-brand text-white shadow-2xs"
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

      {/* TAB 1: CONTACT INFORMATION (Modeled directly after Inspiration Image 3) */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Row of 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Lifetime Value */}
            <div className="rounded-2xl card p-4 shadow-2xs relative">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Pipeline Value
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ↗ High
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono text-text">
                SAR {totalDealValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Across {deals.length} opportunities</p>
            </div>

            {/* Card 2: Active Deals */}
            <div className="rounded-2xl card p-4 shadow-2xs relative">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Active Deals
                </span>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-bold text-brand border border-brand/20">
                  {activeDealsCount} Open
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-text">
                {deals.length} <span className="text-sm font-medium text-text-muted">Deals</span>
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Negotiation & proposal phase</p>
            </div>

            {/* Card 3: Pending Tasks */}
            <div className="rounded-2xl card p-4 shadow-2xs relative">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Action Items
                </span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ⚡ Follow-up
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-text">
                {openTasksCount} <span className="text-sm font-medium text-text-muted">Pending</span>
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Assigned sales tasks</p>
            </div>

            {/* Card 4: Engagement Score */}
            <div className="rounded-2xl card p-4 shadow-2xs relative">
              <div className="flex items-center justify-between text-text-faint">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Engagement Health
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  🟢 Strong
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-text">
                94% <span className="text-xs font-semibold text-emerald-500">High Responsiveness</span>
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Active communications</p>
            </div>
          </div>

          {/* Two-Column Grid: General Info & Engagement History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: General Information */}
            <div className="card p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-text border-b border-border pb-3">
                General Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-text-faint font-medium">Primary Account Rep:</span>
                  <p className="font-bold text-text mt-0.5">
                    {currentUser?.name || "Ahmad Aziz"}
                  </p>
                </div>

                <div>
                  <span className="text-text-faint font-medium">Organization / Account:</span>
                  <p className="font-bold text-text mt-0.5">
                    {account?.name || "Independent"}
                  </p>
                </div>

                <div>
                  <span className="text-text-faint font-medium">Work Email:</span>
                  <p className="font-bold text-brand mt-0.5">
                    {contact.email || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-text-faint font-medium">Mobile Phone:</span>
                  <p className="font-bold text-text mt-0.5">
                    {contact.phone || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-text-faint font-medium">Territory / Region:</span>
                  <p className="font-bold text-text mt-0.5">
                    {account?.region || "Riyadh, Saudi Arabia"}
                  </p>
                </div>

                <div>
                  <span className="text-text-faint font-medium">Stakeholder Role:</span>
                  <p className="font-bold text-text mt-0.5">
                    {contact.role || "Executive Buyer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Card: Engagement & Progress History (Inspired by Image 3) */}
            <div className="card p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text">
                  Engagement &amp; Relationship Progress
                </h3>
                <span className="text-xs text-brand font-semibold">
                  + Log milestone
                </span>
              </div>

              {/* Progress visual */}
              <div className="relative rounded-2xl bg-surface-2 p-4 border border-border">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-brand">
                      Recent Strategic Update
                    </span>
                    <p className="text-xs font-semibold text-text mt-0.5">
                      Client approved Smart POS X990 pilot evaluation &amp; requested ZATCA e-invoicing API specs.
                    </p>
                    <span className="text-[10.5px] text-text-faint mt-1 block">
                      Logged today by {currentUser?.name || "Ahmad Aziz"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engagement Sparkline */}
              <div className="h-16 w-full flex items-end gap-1.5 pt-2">
                {[45, 60, 55, 75, 70, 85, 90, 80, 95, 98].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        i === 9
                          ? "bg-brand"
                          : "bg-surface-2 hover:bg-brand/40"
                      }`}
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card: Product Interests & Tags */}
          <div className="card p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">
                Product Interests &amp; Proposed Solutions
              </h3>
              <button
                onClick={() => setShowAddInterest(!showAddInterest)}
                className="text-xs text-brand font-bold hover:underline"
              >
                + Add solution interest
              </button>
            </div>

            {showAddInterest && (
              <form onSubmit={handleAddInterest} className="flex items-center gap-2 pt-1 pb-2">
                <input
                  type="text"
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  placeholder="e.g. B2B Escrow Engine, QR Stand..."
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#4361ee] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
                >
                  Add
                </button>
              </form>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {productInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  <Package size={13} className="text-[#4361ee]" />
                  <span>{interest}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSOCIATED DEALS (Modeled after Inspiration Image 2) */}
      {activeTab === "deals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Deal Cards */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Active & Closed Deals ({deals.length})
              </h3>
              <Link
                href="/pipeline"
                className="text-xs text-[#4361ee] font-semibold hover:underline"
              >
                Open Pipeline ↗
              </Link>
            </div>

            {deals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                No deals associated with this contact yet.
              </div>
            ) : (
              deals.map((deal) => (
                <div
                  key={deal.id}
                  className="group rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-sm font-bold text-slate-900 group-hover:text-[#4361ee] transition-colors flex items-center gap-1.5"
                      >
                        <span>{deal.title}</span>
                        <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target Close:{" "}
                        {deal.expectedClose
                          ? new Date(deal.expectedClose).toLocaleDateString()
                          : "Open"}
                      </p>
                    </div>

                    <span className="text-sm font-mono font-bold text-slate-900">
                      SAR {deal.value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10.5px] font-bold text-[#4361ee]">
                      Stage: {deal.stage?.name || "Qualification"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        deal.status === "WON"
                          ? "bg-emerald-50 text-emerald-700"
                          : deal.status === "LOST"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {deal.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar Column: Deal Health & Risk Meters (Directly from Image 2) */}
          <div className="space-y-4">
            {/* Total Deals Summary */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pipeline Contribution
              </h4>
              <p className="text-2xl font-mono font-bold text-slate-900">
                SAR {totalDealValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>

              {/* Concentric Circle Mock from Image 2 */}
              <div className="relative flex items-center justify-center py-4">
                <div className="h-28 w-28 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-[#4361ee] flex items-center justify-center font-bold text-xs text-[#4361ee]">
                      100%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Risks & Probabilities (Directly from Image 2) */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Commercial Health & Risks
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center text-slate-700 font-semibold mb-1">
                    <span>Budget & SAMA Approval</span>
                    <span className="font-bold text-[#4361ee]">85%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#4361ee]" style={{ width: "85%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-700 font-semibold mb-1">
                    <span>Competitor Risk</span>
                    <span className="font-bold text-amber-600">25%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: "25%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-700 font-semibold mb-1">
                    <span>Decision Maker Alignment</span>
                    <span className="font-bold text-emerald-600">92%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & SOLUTIONS */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Active & Recommended MYTM Products
            </h3>
            <Link
              href="/products"
              className="text-xs text-[#4361ee] font-semibold hover:underline"
            >
              Browse Full Catalog ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-600">
                    {product.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    SAR {product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>

                <button
                  onClick={() => toast.success(`Quotation generated for ${product.name}`)}
                  className="w-full rounded-full border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-[#4361ee] transition-colors"
                >
                  Add to Quotation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TASKS & ACTION ITEMS */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Follow-up Tasks ({taskList.length})
            </h3>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#4361ee] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
            >
              <Plus size={13} />
              <span>New Task</span>
            </button>
          </div>

          {taskList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
              No follow-up tasks recorded for this contact.
            </div>
          ) : (
            <div className="space-y-2">
              {taskList.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    task.done
                      ? "bg-slate-50/60 border-slate-200/60 opacity-60"
                      : "bg-white border-slate-200/90 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id, task.done)}
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        task.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 hover:border-indigo-500"
                      }`}
                    >
                      {task.done && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div>
                      <p
                        className={`text-xs font-bold text-slate-900 ${
                          task.done ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-[10.5px] text-slate-400 mt-0.5">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      task.priority === "HIGH"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ACTIVITY TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Inline Activity Logger */}
          <form
            onSubmit={handleLogActivity}
            className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Log New Interaction
              </span>
              <div className="flex items-center gap-1">
                {(["NOTE", "CALL", "MEETING", "EMAIL"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNoteType(t)}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all ${
                      noteType === t
                        ? "bg-[#4361ee] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Write details about this ${noteType.toLowerCase()}...`}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !noteText.trim()}
                className="flex items-center gap-1.5 rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-4 py-1.5 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
              >
                <Send size={12} />
                <span>Save Interaction</span>
              </button>
            </div>
          </form>

          {/* Activity Stream */}
          <div className="space-y-3">
            {activityList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                No activity logs recorded yet.
              </div>
            ) : (
              activityList.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3.5 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#4361ee]">
                    {act.type === "CALL" ? (
                      <Phone size={14} />
                    ) : act.type === "MEETING" ? (
                      <Users size={14} />
                    ) : (
                      <StickyNote size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {act.type} • {act.user?.name || "Ahmad Aziz"}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        {new Date(act.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                      {act.notes}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          members={members}
        />
      )}
    </div>
  );
}
