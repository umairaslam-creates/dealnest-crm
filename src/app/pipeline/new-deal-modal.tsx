"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createDeal } from "@/app/actions";

type Account = { id: string; name: string };
type Member = { id: string; name: string | null };
type Stage = { id: string; name: string };

export function NewDealModal({
  open,
  onClose,
  pipelineId,
  stages,
  accounts,
  members,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  pipelineId: string;
  stages: Stage[];
  accounts: Account[];
  members: Member[];
  onCreated?: (deal: { id: string; stageId: string }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [accountId, setAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [ownerId, setOwnerId] = useState(members[0]?.id ?? "");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit() {
    if (!title.trim()) {
      setError("Give this deal a name.");
      return;
    }
    if (!stageId) {
      setError("Pick a stage.");
      return;
    }
    setError("");
    startTransition(async () => {
      const deal = await createDeal({
        title: title.trim(),
        pipelineId,
        stageId,
        value: value ? Number(value) : undefined,
        currency,
        accountId: accountId || undefined,
        newAccountName: !accountId ? newAccountName.trim() || undefined : undefined,
        ownerId: ownerId || undefined,
      });
      onCreated?.(deal);
      setTitle("");
      setValue("");
      setNewAccountName("");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-text">New deal</p>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          <input
            autoFocus
            placeholder="Deal name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
          />

          <div className="flex gap-2">
            <input
              placeholder="Value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-md border border-border-strong px-2 py-1.5 text-[13px] outline-none"
            >
              <option value="SAR">SAR</option>
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="PKR">PKR</option>
            </select>
          </div>

          <div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
            >
              <option value="">New account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {!accountId && (
              <input
                placeholder="New account name (optional)"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="mt-2 w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
              />
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="flex-1 rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="flex-1 rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={pending}
            className="w-full rounded-md bg-ink px-3 py-2 text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
          >
            {pending ? "Creating..." : "Create deal"}
          </button>
        </div>
      </div>
    </div>
  );
}
