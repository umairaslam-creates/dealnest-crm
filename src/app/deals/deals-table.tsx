"use client";

import React, { Fragment, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  Handshake,
  DollarSign,
  Trophy,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { analyzeDeal, deleteDeal } from "@/app/actions";
import { DealModal, DealEntity } from "@/components/deal-modal";
import { useToast } from "@/components/toast-context";

type Deal = {
  id: string;
  title: string;
  value: number | null;
  currency: string | null;
  status: "OPEN" | "WON" | "LOST";
  probability?: number | null;
  expectedClose?: Date | string | null;
  pipelineId: string;
  stageId: string;
  accountId?: string | null;
  ownerId?: string | null;
  account: { name: string } | null;
  owner: { name: string | null } | null;
  stage: { name: string } | null;
};

export function DealsTable({
  deals,
  pipelines = [],
  accounts = [],
  members = [],
}: {
  deals: Deal[];
  pipelines?: any[];
  accounts?: any[];
  members?: any[];
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "WON" | "LOST">("ALL");

  // Modal states
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealEntity | null>(null);

  // Computed metrics
  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const openDeals = deals.filter((d) => d.status === "OPEN");
  const openValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const wonDeals = deals.filter((d) => d.status === "WON");
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchAccount = d.account?.name.toLowerCase().includes(q);
        const matchOwner = d.owner?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchAccount && !matchOwner) return false;
      }
      return true;
    });
  }, [deals, statusFilter, searchQuery]);

  function handleAnalyze(dealId: string) {
    setOpenId(dealId);
    startTransition(async () => {
      try {
        const result = await analyzeDeal(dealId);
        setSuggestions((prev) => ({ ...prev, [dealId]: result.suggestion }));
        toast.success("AI analysis loaded!");
      } catch (err) {
        toast.error("Failed to analyze deal.");
      }
    });
  }

  async function handleDelete(deal: Deal) {
    if (!confirm(`Are you sure you want to delete "${deal.title}"?`)) return;
    try {
      await deleteDeal(deal.id);
      toast.success("Deal deleted.");
    } catch (err) {
      toast.error("Failed to delete deal.");
    }
  }

  function handleEdit(deal: Deal) {
    setEditingDeal({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      currency: deal.currency,
      probability: deal.probability,
      expectedClose: deal.expectedClose,
      status: deal.status,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      accountId: deal.accountId,
      ownerId: deal.ownerId,
    });
    setDealModalOpen(true);
  }

  function handleNewDeal() {
    setEditingDeal(null);
    setDealModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Top Value Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-[12px] font-medium text-text-muted">Total Portfolio</p>
          <p className="font-numeric text-[22px] font-bold text-text mt-0.5">
            SAR {(totalValue / 1000).toFixed(0)}K
          </p>
          <p className="text-[11.5px] text-text-faint mt-0.5">{deals.length} total deals</p>
        </div>

        <div className="card p-4">
          <p className="text-[12px] font-medium text-blue-700">Open Pipeline</p>
          <p className="font-numeric text-[22px] font-bold text-blue-950 mt-0.5">
            SAR {(openValue / 1000).toFixed(0)}K
          </p>
          <p className="text-[11.5px] text-blue-800/70 mt-0.5">{openDeals.length} active opportunities</p>
        </div>

        <div className="card p-4">
          <p className="text-[12px] font-medium text-emerald-700">Won Revenue</p>
          <p className="font-numeric text-[22px] font-bold text-emerald-950 mt-0.5">
            SAR {(wonValue / 1000).toFixed(0)}K
          </p>
          <p className="text-[11.5px] text-emerald-800/70 mt-0.5">{wonDeals.length} deals closed won</p>
        </div>

        <div className="card p-4">
          <p className="text-[12px] font-medium text-text-muted">Win Rate</p>
          <p className="font-numeric text-[22px] font-bold text-text mt-0.5">
            {deals.length > 0
              ? Math.round((wonDeals.length / (wonDeals.length + deals.filter((d) => d.status === "LOST").length || 1)) * 100)
              : 0}
            %
          </p>
          <p className="text-[11.5px] text-text-faint mt-0.5">Closed deals ratio</p>
        </div>
      </div>

      {/* Control Bar: Filters, Search, New Deal */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl w-full md:w-auto">
          {(
            [
              { id: "ALL", label: `All (${deals.length})` },
              { id: "OPEN", label: `Open (${openDeals.length})` },
              { id: "WON", label: `Won (${wonDeals.length})` },
              { id: "LOST", label: `Lost (${deals.filter((d) => d.status === "LOST").length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all ${
                statusFilter === tab.id
                  ? "bg-surface text-text shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Add Deal */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-text-faint" />
            <input
              type="text"
              placeholder="Filter deals, accounts, reps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 py-1.5 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-ink transition-colors"
            />
          </div>

          <button
            onClick={handleNewDeal}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-ink-hover shadow-sm transition-all shrink-0"
          >
            <Plus size={14} />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake size={36} className="mx-auto mb-2 text-text-faint/60" />
            <p className="text-[14.5px] font-medium text-text">No deals found</p>
            <p className="text-[12.5px] text-text-muted mt-1">
              Try adjusting your search query or status filter.
            </p>
            <button
              onClick={handleNewDeal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[12.5px] font-medium text-white hover:bg-ink-hover"
            >
              <Plus size={14} />
              <span>Create New Deal</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/70 text-left text-[11.5px] font-semibold text-text-faint uppercase tracking-wider">
                <th className="px-4 py-3">Deal Opportunity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeals.map((d) => (
                <Fragment key={d.id}>
                  <tr className="hover:bg-surface-2/50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-text">
                      <Link
                        href={`/deals/${d.id}`}
                        className="hover:text-accent flex items-center gap-1.5"
                      >
                        <span>{d.title}</span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          d.status === "WON"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "LOST"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-text-muted">
                      {d.account?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-text-muted">
                      {d.owner?.name ?? "Unassigned"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-surface-2 text-text-muted border border-border">
                        {d.stage?.name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-numeric font-bold text-text">
                      {d.currency} {d.value?.toLocaleString() ?? "0"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAnalyze(d.id)}
                          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-medium text-text-muted hover:border-accent hover:text-accent transition-colors"
                        >
                          <Sparkles size={12} className="text-amber-500" />
                          <span>AI Check</span>
                        </button>

                        <button
                          onClick={() => handleEdit(d)}
                          title="Edit deal"
                          className="p-1 rounded-lg text-text-faint hover:text-text hover:bg-surface-2 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleDelete(d)}
                          title="Delete deal"
                          className="p-1 rounded-lg text-text-faint hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {openId === d.id && (
                    <tr className="border-b border-border bg-emerald-50/40">
                      <td colSpan={7} className="px-4 py-3 text-[12.5px] text-emerald-950">
                        {pending && !suggestions[d.id] ? (
                          <div className="flex items-center gap-2 text-emerald-700">
                            <Sparkles size={13} className="animate-spin text-emerald-600" />
                            <span>Analyzing deal signals and interaction history...</span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold text-emerald-900">
                                AI Suggestion:{" "}
                              </strong>
                              <span>{suggestions[d.id]}</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Deal Modal */}
      {dealModalOpen && (
        <DealModal
          open={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          dealToEdit={editingDeal}
          pipelines={pipelines}
          accounts={accounts}
          members={members}
        />
      )}
    </div>
  );
}
