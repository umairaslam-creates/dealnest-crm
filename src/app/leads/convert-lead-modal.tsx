"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { convertLeadToDeal } from "@/app/actions";

type Stage = { id: string; name: string };
type DealPipeline = { id: string; name: string; stages: Stage[] };

export function ConvertLeadModal({
  leadId,
  leadName,
  dealPipelines,
  onClose,
}: {
  leadId: string;
  leadName: string;
  dealPipelines: DealPipeline[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pipelineId, setPipelineId] = useState(dealPipelines[0]?.id ?? "");
  const [stageId, setStageId] = useState(dealPipelines[0]?.stages[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("SAR");

  const activePipeline = dealPipelines.find((p) => p.id === pipelineId);

  function handleConvert() {
    if (!pipelineId || !stageId) return;
    startTransition(async () => {
      await convertLeadToDeal({
        leadId,
        pipelineId,
        stageId,
        value: value ? Number(value) : undefined,
        currency,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-text">Convert &quot;{leadName}&quot; to a deal</p>
          <button onClick={onClose} className="text-text-faint hover:text-text">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          <select
            value={pipelineId}
            onChange={(e) => {
              const p = dealPipelines.find((dp) => dp.id === e.target.value);
              setPipelineId(e.target.value);
              setStageId(p?.stages[0]?.id ?? "");
            }}
            className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
          >
            {dealPipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
          >
            {activePipeline?.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              placeholder="Deal value (optional)"
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

          <button
            onClick={handleConvert}
            disabled={pending || !pipelineId || !stageId}
            className="w-full rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-accent-fg disabled:opacity-60"
          >
            {pending ? "Converting..." : "Convert to deal"}
          </button>
        </div>
      </div>
    </div>
  );
}
