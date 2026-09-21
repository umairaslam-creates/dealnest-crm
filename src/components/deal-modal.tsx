"use client";

import React, { useState } from "react";
import { X, Handshake, Building, DollarSign, Calendar, User, Percent, Loader2 } from "lucide-react";
import { createDeal, updateDeal } from "@/app/actions";
import { useToast } from "./toast-context";

export type DealEntity = {
  id: string;
  title: string;
  value?: number | null;
  currency?: string | null;
  probability?: number | null;
  expectedClose?: Date | string | null;
  status?: "OPEN" | "WON" | "LOST";
  lossReason?: string | null;
  pipelineId: string;
  stageId: string;
  accountId?: string | null;
  ownerId?: string | null;
};

export function DealModal({
  open,
  onClose,
  dealToEdit,
  pipelines = [],
  defaultPipelineId,
  accounts = [],
  members = [],
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  dealToEdit?: DealEntity | null;
  pipelines: { id: string; name: string; stages: { id: string; name: string }[] }[];
  defaultPipelineId?: string;
  accounts?: { id: string; name: string }[];
  members?: { id: string; name: string | null }[];
  onSaved?: (deal: any) => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initialPipelineId =
    dealToEdit?.pipelineId ?? defaultPipelineId ?? pipelines[0]?.id ?? "";

  const [pipelineId, setPipelineId] = useState(initialPipelineId);
  const selectedPipeline = pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];
  const stages = selectedPipeline?.stages ?? [];

  const [title, setTitle] = useState(dealToEdit?.title ?? "");
  const [value, setValue] = useState(dealToEdit?.value ? String(dealToEdit.value) : "");
  const [currency, setCurrency] = useState(dealToEdit?.currency ?? "SAR");
  const [probability, setProbability] = useState(
    dealToEdit?.probability ? String(dealToEdit.probability) : "50"
  );
  const [expectedClose, setExpectedClose] = useState<string>(
    dealToEdit?.expectedClose
      ? new Date(dealToEdit.expectedClose).toISOString().split("T")[0]
      : ""
  );
  const [stageId, setStageId] = useState(dealToEdit?.stageId ?? stages[0]?.id ?? "");
  const [accountId, setAccountId] = useState(dealToEdit?.accountId ?? "");
  const [newAccountName, setNewAccountName] = useState("");
  const [ownerId, setOwnerId] = useState(dealToEdit?.ownerId ?? members[0]?.id ?? "");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a deal title.");
      return;
    }
    if (!stageId && stages[0]?.id) {
      setStageId(stages[0].id);
    }

    setSubmitting(true);
    try {
      const parsedValue = value ? Number(value) : undefined;
      const parsedProb = probability ? Number(probability) : undefined;
      const parsedDate = expectedClose ? new Date(expectedClose) : undefined;

      if (dealToEdit) {
        const updated = await updateDeal(dealToEdit.id, {
          title: title.trim(),
          value: parsedValue ?? null,
          currency,
          probability: parsedProb ?? null,
          expectedClose: parsedDate ?? null,
          pipelineId,
          stageId: stageId || stages[0]?.id,
          accountId: accountId || null,
          ownerId: ownerId || null,
        });
        toast.success("Deal updated successfully!");
        onSaved?.(updated);
      } else {
        const created = await createDeal({
          title: title.trim(),
          pipelineId,
          stageId: stageId || stages[0]?.id,
          value: parsedValue,
          currency,
          probability: parsedProb,
          expectedClose: parsedDate,
          accountId: accountId || undefined,
          newAccountName: !accountId && newAccountName.trim() ? newAccountName.trim() : undefined,
          ownerId: ownerId || undefined,
        });
        toast.success("Deal created successfully!");
        onSaved?.(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the deal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-border-strong bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              {dealToEdit ? "Edit Deal" : "New Sales Deal"}
            </h2>
            <p className="text-[12px] text-text-muted">
              {dealToEdit ? "Update opportunity terms and timeline" : "Create a new commercial opportunity"}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
              <Handshake size={13} className="text-text-muted" /> Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Rajhi Bank — Smart POS Expansion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <DollarSign size={13} className="text-text-muted" /> Value &amp; Currency
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="250000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-xl border border-border-strong bg-surface px-2.5 py-2 text-[12.5px] font-medium text-text outline-none"
                >
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Percent size={13} className="text-text-muted" /> Win Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Pipeline
              </label>
              <select
                value={pipelineId}
                onChange={(e) => {
                  setPipelineId(e.target.value);
                  const p = pipelines.find((item) => item.id === e.target.value);
                  if (p?.stages[0]) setStageId(p.stages[0].id);
                }}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Stage <span className="text-rose-500">*</span>
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Building size={13} className="text-text-muted" /> Client Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              >
                <option value="">Select an account or create new...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Calendar size={13} className="text-text-muted" /> Expected Close
              </label>
              <input
                type="date"
                value={expectedClose}
                onChange={(e) => setExpectedClose(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
              />
            </div>
          </div>

          {!accountId && (
            <div>
              <label className="block text-[12px] font-medium text-text-muted mb-1">
                Or enter a new Company / Account name:
              </label>
              <input
                type="text"
                placeholder="New Company name (will create an account)"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
              <User size={13} className="text-text-muted" /> Deal Owner
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? "Team Member"}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
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
              {dealToEdit ? "Save Changes" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

