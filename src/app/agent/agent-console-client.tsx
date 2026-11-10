"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bot, CheckCircle2, ExternalLink, Layers3, Loader2, Search, XCircle } from "lucide-react";

type LeadSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  section: { id: string; name: string } | null;
  stage: { id: string; name: string } | null;
  tags: string[];
};

type StageOption = { id: string; name: string };
type PipelineOption = { id: string; name: string; stages: StageOption[] };

export function AgentConsoleClient({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSummary[]>([]);
  const [selected, setSelected] = useState<LeadSummary | null>(null);
  const [leadPipelines, setLeadPipelines] = useState<PipelineOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("");

  const activeSection = useMemo(
    () => leadPipelines.find((pipeline) => pipeline.id === selectedSectionId),
    [leadPipelines, selectedSectionId]
  );

  async function runSearch(nextQuery = query) {
    setSearching(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/agent/leads/search?q=${encodeURIComponent(nextQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setResults(data.results ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Search failed." });
    } finally {
      setSearching(false);
    }
  }

  async function loadLead(id: string) {
    setActing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/agent/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lead load failed.");
      setSelected(data.lead);
      setLeadPipelines(data.options?.leadPipelines ?? []);
      setSelectedSectionId(data.lead.section?.id ?? data.options?.leadPipelines?.[0]?.id ?? "");
      setSelectedStageId(data.lead.stage?.id ?? "");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Lead load failed." });
    } finally {
      setActing(false);
    }
  }

  async function postCommand(path: string, body: Record<string, unknown>, successText: string) {
    if (!selected) return;
    setActing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/agent/leads/${selected.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Command failed.");
      setMessage({ type: "success", text: successText });
      await loadLead(selected.id);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Command failed." });
    } finally {
      setActing(false);
    }
  }

  function handleSectionChange(pipelineId: string) {
    const pipeline = leadPipelines.find((item) => item.id === pipelineId);
    setSelectedSectionId(pipelineId);
    setSelectedStageId(pipeline?.stages[0]?.id ?? "");
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="card border border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Bot size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-text">Agent Console</h2>
              <p className="mt-1 max-w-2xl text-xs text-text-muted">
                Fast internal controls for lead lookup, stage changes, notes, labels, and conversion without opening the full board.
              </p>
            </div>
            <Link
              href="/agent/sections"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text hover:bg-surface-2"
            >
              <Layers3 size={14} /> Sections
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <div className="card border border-border p-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-text-faint" />
              <input
                data-testid="lead-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, company, email, phone"
                className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-brand"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {results.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  if (compact) {
                    router.push(`/leads/${lead.id}`);
                    return;
                  }
                  loadLead(lead.id);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selected?.id === lead.id
                    ? "border-brand bg-brand/10"
                    : "border-border bg-surface-2/60 hover:border-brand/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text">{lead.name}</p>
                    <p className="truncate text-xs text-text-muted">{lead.company || "No company"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                    {lead.stage?.name || "No stage"}
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-text-muted">
                  <span className="truncate">ID: {lead.id}</span>
                  <span className="truncate">Section: {lead.section?.name || "Unassigned"}</span>
                  <span className="truncate">{lead.email || lead.phone || "No email or phone"}</span>
                </div>
              </button>
            ))}
            {results.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-text-muted">
                Search for a lead to start.
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <div className="card min-h-[520px] border border-border p-4">
            {message && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            {!selected ? (
              <div className="flex h-full min-h-[430px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-muted">
                Select a lead to view internal controls.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-text">{selected.name}</h3>
                    <p className="text-sm text-text-muted">{selected.company || "No company"}</p>
                    <p className="mt-1 text-xs text-text-faint">{selected.email || "No email"} · {selected.phone || "No phone"}</p>
                  </div>
                  <Link
                    data-testid={`open-lead-page-${selected.id}`}
                    href={`/leads/${selected.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-text hover:bg-surface-2"
                  >
                    <ExternalLink size={14} /> Open lead page
                  </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-text-muted">Section</span>
                    <select
                      data-testid="stage-selector"
                      value={selectedSectionId}
                      onChange={(event) => handleSectionChange(event.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
                    >
                      {leadPipelines.map((pipeline) => (
                        <option key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-text-muted">Stage</span>
                    <select
                      data-testid="stage-selector"
                      value={selectedStageId}
                      onChange={(event) => setSelectedStageId(event.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
                    >
                      {(activeSection?.stages ?? []).map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    data-testid="save-section-button"
                    onClick={() =>
                      postCommand("section", { pipelineId: selectedSectionId, stageId: selectedStageId }, "Lead section updated.")
                    }
                    disabled={acting || !selectedSectionId}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Save section
                  </button>
                  <button
                    data-testid="save-stage-button"
                    onClick={() => postCommand("stage", { stageId: selectedStageId }, "Lead stage updated.")}
                    disabled={acting || !selectedStageId}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-2 disabled:opacity-60"
                  >
                    Save stage
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-muted">Add note</label>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    <button
                      data-testid="add-note-button"
                      onClick={() => {
                        postCommand("note", { notes: note }, "Note added.");
                        setNote("");
                      }}
                      disabled={acting || !note.trim()}
                      className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Add note
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-muted">Apply label</label>
                    <input
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder="Money20/20 hot lead"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    <button
                      data-testid="save-label-button"
                      onClick={() => {
                        postCommand("label", { label }, "Label applied.");
                        setLabel("");
                      }}
                      disabled={acting || !label.trim()}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-2 disabled:opacity-60"
                    >
                      Apply label
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <button
                    data-testid="convert-to-deal-button"
                    onClick={() => postCommand("convert-to-deal", {}, "Lead converted to deal.")}
                    disabled={acting}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {acting ? "Working..." : "Convert to deal"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
