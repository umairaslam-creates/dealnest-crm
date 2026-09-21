"use client";

import React, { useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
  Eye,
  Settings2,
  FolderOpen,
  Filter,
  Layers,
} from "lucide-react";
import { bulkImportLeads } from "@/app/actions";
import { useToast } from "@/components/toast-context";

export type ImportStage = { id: string; name: string; color?: string | null };
export type ImportPipeline = { id: string; name: string; isDefault?: boolean; stages: ImportStage[] };
export type ImportMember = { id: string; name: string | null };

export interface ImportLeadsButtonProps {
  pipelineId?: string;
  stages?: ImportStage[];
  currentPipelineId?: string;
  pipelines?: ImportPipeline[];
  members?: ImportMember[];
  initialStages?: ImportStage[];
}

// Available CRM target fields with user-friendly descriptions and icons
export const TARGET_FIELDS = [
  {
    id: "contactName",
    label: "Contact Name",
    icon: "👤",
    badge: "Recommended",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    description: "Lead full name or primary contact person",
  },
  {
    id: "title",
    label: "Job Title / Designation",
    icon: "💼",
    badge: "Designation",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    description: "Job title, role, or position (e.g. VP of Sales, CTO, Manager)",
  },
  {
    id: "company",
    label: "Company / Account",
    icon: "🏢",
    badge: "Organization",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    description: "Business name or company affiliation",
  },
  {
    id: "website",
    label: "Company Website",
    icon: "🌐",
    badge: "Web / URL",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    description: "Company website URL or domain (e.g. https://company.com)",
  },
  {
    id: "email",
    label: "Email Address",
    icon: "✉️",
    badge: "Contact",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    description: "Email address for correspondence",
  },
  {
    id: "phone",
    label: "Phone Number",
    icon: "📞",
    badge: "Contact",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    description: "Mobile, landline, or WhatsApp number",
  },
  {
    id: "value",
    label: "Estimated Value / Budget",
    icon: "💰",
    badge: "Commercial",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    description: "Estimated lead deal value or prospective budget",
  },
  {
    id: "notes",
    label: "📌 Lead Note / Comment",
    icon: "📝",
    badge: "Creates Activity Note",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    description: "Imports column text and attaches it directly as an activity note to this lead",
  },
  {
    id: "source",
    label: "Lead Source",
    icon: "🌐",
    badge: "Attribution",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    description: "Event, campaign, referral, or channel (e.g., Money 20/20, Web)",
  },
  {
    id: "productInterest",
    label: "Product Interest",
    icon: "🎯",
    badge: "Commercial",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    description: "Product line, solution, or commercial service",
  },
  {
    id: "region",
    label: "Region / Country",
    icon: "📍",
    badge: "Geography",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    description: "Country, state, or general geographic market",
  },
  {
    id: "city",
    label: "City / Location",
    icon: "🏙️",
    badge: "Geography",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    description: "City or physical location",
  },
  {
    id: "score",
    label: "Lead Temperature",
    icon: "🔥",
    badge: "Hot / Warm / Cold",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    description: "Score or urgency: Hot, Warm, or Cold",
  },
  {
    id: "tags",
    label: "Tags / Custom Label",
    icon: "🏷️",
    badge: "Categorization",
    badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    description: "Custom label or tag attached to the lead card",
  },
  {
    id: "skip",
    label: "🚫 Skip Column",
    icon: "—",
    badge: "Ignore",
    badgeColor: "bg-slate-500/10 text-text-muted border-slate-500/20",
    description: "Do not import this column into the CRM",
  },
] as const;

// Helper to auto-detect CRM field from column header
function detectFieldMapping(header: string): string {
  const h = header.trim().toLowerCase();

  // Notes & comments detection
  if (
    h.includes("note") ||
    h.includes("comment") ||
    h.includes("description") ||
    h.includes("remark") ||
    h.includes("details") ||
    h.includes("feedback") ||
    h.includes("summary") ||
    h.includes("memo")
  ) {
    return "notes";
  }

  // Job Title / Designation detection
  if (
    h.includes("designation") ||
    h.includes("job title") ||
    h.includes("job_title") ||
    h.includes("jobtitle") ||
    h.includes("title") ||
    h.includes("position") ||
    h.includes("role") ||
    h.includes("occupation") ||
    h.includes("headline")
  ) {
    return "title";
  }

  // Website / URL detection
  if (
    h.includes("website") ||
    h.includes("site") ||
    h.includes("url") ||
    h.includes("domain") ||
    h.includes("homepage") ||
    h.includes("web")
  ) {
    return "website";
  }

  // Value / Budget detection
  if (
    h.includes("value") ||
    h.includes("budget") ||
    h.includes("amount") ||
    h.includes("revenue") ||
    h.includes("worth") ||
    h.includes("price")
  ) {
    return "value";
  }

  // City detection
  if (h.includes("city") || h.includes("town") || h.includes("metro")) {
    return "city";
  }

  // Name detection
  if (
    h === "name" ||
    h === "contact name" ||
    h === "full name" ||
    h === "lead name" ||
    h === "contact" ||
    h === "person" ||
    h === "first name" ||
    h.includes("contact name") ||
    h.includes("fullname")
  ) {
    return "contactName";
  }

  // Company detection
  if (
    h.includes("company") ||
    h.includes("account") ||
    h.includes("organization") ||
    h.includes("org") ||
    h.includes("business") ||
    h.includes("firm")
  ) {
    return "company";
  }

  // Email detection
  if (h.includes("email") || h.includes("mail")) {
    return "email";
  }

  // Phone detection
  if (
    h.includes("phone") ||
    h.includes("mobile") ||
    h.includes("tel") ||
    h.includes("cell") ||
    h.includes("whatsapp")
  ) {
    return "phone";
  }

  // Source / Campaign detection
  if (
    h.includes("source") ||
    h.includes("campaign") ||
    h.includes("origin") ||
    h.includes("channel") ||
    h.includes("lead source")
  ) {
    return "source";
  }

  // Product interest detection
  if (
    h.includes("product") ||
    h.includes("interest") ||
    h.includes("service") ||
    h.includes("solution")
  ) {
    return "productInterest";
  }

  // Region / Location detection
  if (
    h.includes("region") ||
    h.includes("location") ||
    h.includes("country") ||
    h.includes("state")
  ) {
    return "region";
  }

  // Score / Temperature detection
  if (
    h.includes("score") ||
    h.includes("temperature") ||
    h.includes("rating") ||
    h.includes("priority")
  ) {
    return "score";
  }

  // Tags / Labels detection
  if (h.includes("tag") || h.includes("label") || h.includes("badge")) {
    return "tags";
  }

  return "skip";
}

export function ImportLeadsButton({
  pipelineId,
  stages = [],
  currentPipelineId,
  pipelines = [],
  members = [],
  initialStages = [],
}: ImportLeadsButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  // Modal open state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"mapping" | "preview">("mapping");

  // File parsing states
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnSamples, setColumnSamples] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Field selection & mapping states
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});

  // Destination pipeline & stage selection
  const effectivePipelines = useMemo(() => {
    if (pipelines.length > 0) return pipelines;
    if (pipelineId) {
      return [{ id: pipelineId, name: "Leads", stages }];
    }
    return [];
  }, [pipelines, pipelineId, stages]);

  const defaultPipeId = currentPipelineId || pipelineId || effectivePipelines[0]?.id || "";
  const [targetPipelineId, setTargetPipelineId] = useState<string>(defaultPipeId);

  // Target stages derived from selected pipeline
  const currentPipelineStages = useMemo(() => {
    const pipe = effectivePipelines.find((p) => p.id === targetPipelineId);
    if (pipe && pipe.stages && pipe.stages.length > 0) return pipe.stages;
    if (initialStages.length > 0) return initialStages;
    if (stages.length > 0) return stages;
    return [];
  }, [effectivePipelines, targetPipelineId, initialStages, stages]);

  const [targetStageId, setTargetStageId] = useState<string>(
    currentPipelineStages[0]?.id || ""
  );

  // Optional owner and source
  const [defaultOwnerId, setDefaultOwnerId] = useState<string>("");
  const [defaultSource, setDefaultSource] = useState<string>("File Import");

  // When pipeline changes, reset default stage
  function handlePipelineChange(pipeId: string) {
    setTargetPipelineId(pipeId);
    const pipe = effectivePipelines.find((p) => p.id === pipeId);
    if (pipe && pipe.stages && pipe.stages.length > 0) {
      setTargetStageId(pipe.stages[0].id);
    }
  }

  // Parse file: CSV, Excel (.xlsx, .xls), or JSON
  async function processFile(file: File) {
    setError("");
    setFileName(file.name);
    setFileSize(file.size);
    setDefaultSource(`Import - ${file.name.replace(/\.[^/.]+$/, "")}`);

    try {
      let parsedRows: Record<string, unknown>[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsedRows = parsed;
        } else if (parsed && typeof parsed === "object") {
          const list = parsed.leads || parsed.contacts || parsed.data || parsed.rows;
          if (Array.isArray(list)) parsedRows = list;
          else parsedRows = [parsed];
        }
      } else {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const workbook = XLSX.read(buf, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setError("Workbook has no sheets.");
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      }

      if (!parsedRows || parsedRows.length === 0) {
        setError("File contains no records or rows we could read.");
        return;
      }

      // Collect all column names from rows
      const colSet = new Set<string>();
      parsedRows.slice(0, 100).forEach((r) => {
        Object.keys(r).forEach((k) => {
          if (k && k.trim()) colSet.add(k.trim());
        });
      });

      const cols = Array.from(colSet);
      if (cols.length === 0) {
        setError("No columns found in the file.");
        return;
      }

      // Collect sample values for each column
      const samples: Record<string, string[]> = {};
      const mappings: Record<string, string> = {};
      const selected = new Set<string>();

      cols.forEach((col) => {
        const detected = detectFieldMapping(col);
        mappings[col] = detected;

        // Check columns that mapped to a recognized field or by default
        if (detected !== "skip") {
          selected.add(col);
        } else {
          // If no auto-match, still check so user can review it
          selected.add(col);
        }

        // Get up to 3 non-empty distinct samples
        const sampleList: string[] = [];
        for (const row of parsedRows) {
          const val = row[col];
          if (val != null && String(val).trim() !== "") {
            const strVal = String(val).trim();
            if (!sampleList.includes(strVal)) {
              sampleList.push(strVal);
              if (sampleList.length >= 3) break;
            }
          }
        }
        samples[col] = sampleList;
      });

      setRows(parsedRows);
      setDetectedColumns(cols);
      setColumnSamples(samples);
      setFieldMappings(mappings);
      setSelectedColumns(selected);
      setActiveTab("mapping");
    } catch (err: any) {
      setError(`Failed to read file: ${err.message || "Unknown error"}`);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  // Toggle selection for a single column
  function toggleColumnSelection(col: string) {
    const next = new Set(selectedColumns);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    setSelectedColumns(next);
  }

  // Select all or Deselect all columns
  function handleSelectAllColumns() {
    setSelectedColumns(new Set(detectedColumns));
  }

  function handleDeselectAllColumns() {
    setSelectedColumns(new Set());
  }

  // Change mapping for a column
  function handleMappingChange(col: string, targetField: string) {
    setFieldMappings((prev) => ({
      ...prev,
      [col]: targetField,
    }));
    // If user explicitly maps to a valid CRM field, ensure column is selected
    if (targetField !== "skip") {
      setSelectedColumns((prev) => new Set([...prev, col]));
    }
  }

  // Reset modal state
  function handleReset() {
    setFileName("");
    setFileSize(null);
    setRows([]);
    setDetectedColumns([]);
    setColumnSamples({});
    setSelectedColumns(new Set());
    setFieldMappings({});
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    handleReset();
    setModalOpen(false);
  }

  // Validation: at least one field should map to contactName, company, or email
  const hasIdentifierMapping = useMemo(() => {
    return Array.from(selectedColumns).some((col) => {
      const target = fieldMappings[col];
      return target === "contactName" || target === "company" || target === "email";
    });
  }, [selectedColumns, fieldMappings]);

  // Notes mapped count
  const hasNotesMapping = useMemo(() => {
    return Array.from(selectedColumns).some((col) => fieldMappings[col] === "notes");
  }, [selectedColumns, fieldMappings]);

  // Active columns to import
  const activeImportColumnsCount = useMemo(() => {
    return Array.from(selectedColumns).filter((col) => fieldMappings[col] !== "skip").length;
  }, [selectedColumns, fieldMappings]);

  // Execute bulk import
  function handleImportSubmit() {
    if (rows.length === 0) {
      toast.error("No rows found to import.");
      return;
    }
    if (activeImportColumnsCount === 0) {
      toast.error("Please select and map at least one field to import.");
      return;
    }
    if (!targetStageId) {
      toast.error("Please select a target stage.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await bulkImportLeads({
          pipelineId: targetPipelineId,
          stageId: targetStageId,
          rows,
          fieldMappings,
          selectedColumns: Array.from(selectedColumns),
          defaultSource: defaultSource.trim() || "File Import",
          defaultOwnerId: defaultOwnerId || undefined,
        });

        const targetPipeName =
          effectivePipelines.find((p) => p.id === targetPipelineId)?.name || "Section";

        toast.success(
          `Successfully imported ${res.imported} lead(s) with ${res.notesAdded} note(s) attached into "${targetPipeName}"!`
        );

        if (res.skipped > 0) {
          toast.info(`Skipped ${res.skipped} row(s) with missing identifiers.`);
        }

        handleClose();
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to import leads.");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-text hover:border-brand hover:text-brand shadow-xs transition-all active:scale-[0.98]"
        title="Import leads from CSV, Excel, or JSON with interactive field analysis"
      >
        <Upload size={14} className="text-brand" />
        <span>Import from file</span>
      </button>

      {/* Interactive Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="card max-w-4xl w-full max-h-[92vh] flex flex-col p-6 border border-border shadow-2xl overflow-hidden rounded-2xl bg-surface animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text flex items-center gap-2">
                    <span>Import Leads &amp; Lead Notes</span>
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                      Interactive Engine
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted">
                    Analyze file columns, choose which fields to import, map lead notes, and select target section
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-text-faint hover:bg-surface-2 hover:text-text transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* STEP 1: Upload or Drop file if no rows parsed yet */}
              {rows.length === 0 ? (
                <div className="space-y-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="bulk-lead-file-input"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      isDragOver
                        ? "border-brand bg-brand/5 scale-[0.99]"
                        : "border-border hover:border-brand/60 bg-surface-2/40 hover:bg-surface-2/80"
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-3 shadow-inner">
                      <Upload size={28} />
                    </div>
                    <p className="text-sm font-bold text-text">
                      Click to upload or drag &amp; drop your leads file
                    </p>
                    <p className="mt-1 text-xs text-text-muted text-center max-w-sm">
                      Supports <strong className="text-text">CSV</strong>,{" "}
                      <strong className="text-text">Excel (.xlsx, .xls)</strong>, and{" "}
                      <strong className="text-text">JSON</strong> files.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-text-faint bg-surface border border-border px-3 py-1 rounded-full">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Smart analysis will detect contact details and row notes automatically</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Sample Format Guide */}
                  <div className="p-4 rounded-xl border border-border bg-surface-2/30 space-y-2">
                    <p className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <FileText size={14} className="text-text-muted" />
                      <span>Accepted Columns &amp; Notes Attachment</span>
                    </p>
                    <p className="text-[11.5px] text-text-muted leading-relaxed">
                      You can import columns like <code className="text-text font-mono text-[11px] bg-surface px-1 py-0.5 rounded">Name</code>,{" "}
                      <code className="text-text font-mono text-[11px] bg-surface px-1 py-0.5 rounded">Company</code>,{" "}
                      <code className="text-text font-mono text-[11px] bg-surface px-1 py-0.5 rounded">Email</code>,{" "}
                      <code className="text-text font-mono text-[11px] bg-surface px-1 py-0.5 rounded">Phone</code>, and any{" "}
                      <code className="text-brand font-mono text-[11px] bg-brand/10 px-1.5 py-0.5 rounded font-bold">Notes</code> or{" "}
                      <code className="text-brand font-mono text-[11px] bg-brand/10 px-1.5 py-0.5 rounded font-bold">Comments</code> column. Each row note will be attached directly to that specific lead as an activity note.
                    </p>
                  </div>
                </div>
              ) : (
                /* STEP 2: File Analyzed - Field Selection & Mapping */
                <div className="space-y-5">
                  {/* File Summary Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-2/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text truncate max-w-xs sm:max-w-md">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          <strong className="text-text font-semibold">{rows.length} rows</strong> detected •{" "}
                          <strong className="text-text font-semibold">{detectedColumns.length} columns</strong> analyzed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="text-xs font-semibold text-text-muted hover:text-text px-2.5 py-1 rounded-lg border border-border hover:bg-surface-2 transition-colors"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* Destination Settings (Section, Stage, Owner, Source) */}
                  <div className="p-4 rounded-xl border border-border bg-surface-2/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-text">
                      <Settings2 size={15} className="text-brand" />
                      <span>Destination &amp; Assignment Settings</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Destination Section / Campaign */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Destination Section / Campaign
                        </label>
                        <select
                          value={targetPipelineId}
                          onChange={(e) => handlePipelineChange(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
                        >
                          {effectivePipelines.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.isDefault ? "(Main)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Destination Stage */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Initial Stage
                        </label>
                        <select
                          value={targetStageId}
                          onChange={(e) => setTargetStageId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
                        >
                          {currentPipelineStages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Default Sales Rep */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Assign Sales Rep
                        </label>
                        <select
                          value={defaultOwnerId}
                          onChange={(e) => setDefaultOwnerId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name || "Unnamed Rep"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Default Lead Source */}
                      <div>
                        <label className="text-[11px] font-semibold text-text-muted block mb-1">
                          Default Acquisition Source
                        </label>
                        <input
                          type="text"
                          value={defaultSource}
                          onChange={(e) => setDefaultSource(e.target.value)}
                          placeholder="e.g. Money 20/20, LEAP"
                          className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Field Mapping vs Live Preview */}
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("mapping")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeTab === "mapping"
                            ? "bg-brand text-white shadow-xs"
                            : "text-text-muted hover:text-text bg-surface border border-border"
                        }`}
                        style={
                          activeTab === "mapping"
                            ? {
                                backgroundColor: "var(--color-brand)",
                                color: "var(--color-ink-fg, #ffffff)",
                              }
                            : undefined
                        }
                      >
                        <Layers size={13} />
                        <span>Fields Selection &amp; Mapping ({activeImportColumnsCount} mapped)</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeTab === "preview"
                            ? "bg-brand text-white shadow-xs"
                            : "text-text-muted hover:text-text bg-surface border border-border"
                        }`}
                        style={
                          activeTab === "preview"
                            ? {
                                backgroundColor: "var(--color-brand)",
                                color: "var(--color-ink-fg, #ffffff)",
                              }
                            : undefined
                        }
                      >
                        <Eye size={13} />
                        <span>Live Preview (First 3 Rows)</span>
                      </button>
                    </div>

                    {activeTab === "mapping" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllColumns}
                          className="text-[11.5px] font-semibold text-brand hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-text-faint">•</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllColumns}
                          className="text-[11.5px] font-semibold text-text-muted hover:underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TAB 1: Fields Selection & Mapping Table */}
                  {activeTab === "mapping" && (
                    <div className="space-y-3">
                      {!hasIdentifierMapping && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
                          <AlertCircle size={15} className="shrink-0" />
                          <span>
                            Please map at least one field to <strong>Contact Name</strong>,{" "}
                            <strong>Company</strong>, or <strong>Email</strong> so each imported lead has an identifiable title.
                          </span>
                        </div>
                      )}

                      {hasNotesMapping && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                          <Check size={14} className="shrink-0" />
                          <span>
                            <strong>Lead Note column detected!</strong> Row notes will be attached automatically to each created lead's activity timeline.
                          </span>
                        </div>
                      )}

                      <div className="rounded-xl border border-border overflow-hidden bg-surface">
                        <div className="grid grid-cols-12 gap-3 p-3 bg-surface-2/70 text-[11px] font-bold uppercase tracking-wider text-text-faint border-b border-border">
                          <div className="col-span-1 flex items-center justify-center">
                            <span>Import?</span>
                          </div>
                          <div className="col-span-4">
                            <span>File Column Header</span>
                          </div>
                          <div className="col-span-4">
                            <span>Sample Data in File</span>
                          </div>
                          <div className="col-span-3">
                            <span>Map to CRM Field</span>
                          </div>
                        </div>

                        <div className="divide-y divide-border max-h-72 overflow-y-auto">
                          {detectedColumns.map((col) => {
                            const isSelected = selectedColumns.has(col);
                            const currentTarget = fieldMappings[col] || "skip";
                            const samples = columnSamples[col] || [];

                            return (
                              <div
                                key={col}
                                className={`grid grid-cols-12 gap-3 p-3 items-center transition-colors ${
                                  isSelected ? "bg-surface hover:bg-surface-2/40" : "bg-surface-2/20 opacity-60"
                                }`}
                              >
                                {/* Checkbox */}
                                <div className="col-span-1 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleColumnSelection(col)}
                                    className="p-1 rounded text-text hover:text-brand"
                                    title={isSelected ? "Exclude column" : "Include column"}
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={16} className="text-brand" />
                                    ) : (
                                      <Square size={16} className="text-text-faint" />
                                    )}
                                  </button>
                                </div>

                                {/* Column Name */}
                                <div className="col-span-4 flex items-center gap-2 truncate">
                                  <span className="text-xs font-bold text-text truncate" title={col}>
                                    {col}
                                  </span>
                                  {currentTarget === "notes" && (
                                    <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                      📌 Note
                                    </span>
                                  )}
                                  {currentTarget === "contactName" && (
                                    <span className="rounded-md bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
                                      👤 Name
                                    </span>
                                  )}
                                </div>

                                {/* Sample Data Preview */}
                                <div className="col-span-4 flex items-center gap-1.5 truncate">
                                  {samples.length > 0 ? (
                                    <div className="flex items-center gap-1 truncate">
                                      {samples.map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[11px] text-text-muted bg-surface-2 border border-border px-1.5 py-0.5 rounded truncate max-w-[140px]"
                                          title={s}
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-text-faint italic">No preview data</span>
                                  )}
                                </div>

                                {/* Target CRM Field Dropdown */}
                                <div className="col-span-3">
                                  <select
                                    disabled={!isSelected}
                                    value={isSelected ? currentTarget : "skip"}
                                    onChange={(e) => handleMappingChange(col, e.target.value)}
                                    className={`w-full rounded-lg border px-2 py-1 text-xs font-semibold outline-none transition-colors ${
                                      isSelected
                                        ? currentTarget === "notes"
                                          ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                                          : currentTarget !== "skip"
                                            ? "border-brand/50 bg-brand/5 text-text"
                                            : "border-border bg-surface text-text-muted"
                                        : "border-border/50 bg-surface-2/50 text-text-faint"
                                    }`}
                                  >
                                    {TARGET_FIELDS.map((tf) => (
                                      <option key={tf.id} value={tf.id}>
                                        {tf.icon} {tf.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Live Preview */}
                  {activeTab === "preview" && (
                    <div className="space-y-3">
                      <p className="text-xs text-text-muted">
                        Here is a real preview of how the first {Math.min(3, rows.length)} leads will be imported into the CRM:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {rows.slice(0, 3).map((row, idx) => {
                          // Compute mapped lead properties for this row
                          let contactName = "";
                          let title = "";
                          let company = "";
                          let website = "";
                          let email = "";
                          let phone = "";
                          let source = defaultSource;
                          let productInterest = "";
                          let region = "";
                          let city = "";
                          let valueStr = "";
                          let score = "";
                          let noteText = "";

                          Array.from(selectedColumns).forEach((col) => {
                            const target = fieldMappings[col];
                            const val = row[col] != null ? String(row[col]).trim() : "";
                            if (!val || target === "skip") return;

                            if (target === "contactName") contactName = val;
                            else if (target === "title") title = val;
                            else if (target === "company") company = val;
                            else if (target === "website") website = val;
                            else if (target === "email") email = val;
                            else if (target === "phone") phone = val;
                            else if (target === "source") source = val;
                            else if (target === "productInterest") productInterest = val;
                            else if (target === "region") region = val;
                            else if (target === "city") city = val;
                            else if (target === "value") valueStr = val;
                            else if (target === "score") score = val;
                            else if (target === "notes") noteText = noteText ? `${noteText}\n${val}` : val;
                          });

                          if (!contactName && company) contactName = `${company} Contact`;
                          if (!contactName && email) contactName = email.split("@")[0];

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-xl border border-border bg-surface-2/40 space-y-2.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                                  Lead #{idx + 1}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {valueStr && (
                                    <span className="text-[10.5px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                      💰 {valueStr}
                                    </span>
                                  )}
                                  {score && (
                                    <span className="text-[10.5px] font-bold text-amber-500">
                                      {score.toLowerCase().includes("hot") ? "🔥 Hot" : score.toLowerCase().includes("warm") ? "⚡ Warm" : "❄️ Cold"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-bold text-text truncate">
                                  {contactName || <span className="text-danger italic font-normal">Missing Name</span>}
                                </p>
                                {title && (
                                  <p className="text-[11px] font-semibold text-brand truncate flex items-center gap-1">
                                    <span>💼 {title}</span>
                                  </p>
                                )}
                                <p className="text-xs text-text-muted truncate">
                                  {company || "No Company Specified"}
                                </p>
                                {website && (
                                  <a
                                    href={website.startsWith("http") ? website : `https://${website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline truncate block"
                                  >
                                    🌐 {website}
                                  </a>
                                )}
                              </div>

                              <div className="space-y-1 text-[11px] text-text-muted border-t border-border/70 pt-2">
                                {email && <p className="truncate">✉️ {email}</p>}
                                {phone && <p className="truncate">📞 {phone}</p>}
                                {(city || region) && (
                                  <p className="truncate">📍 {[city, region].filter(Boolean).join(", ")}</p>
                                )}
                                {productInterest && <p className="truncate">🎯 {productInterest}</p>}
                                <p className="truncate text-text-faint">🌐 Source: {source}</p>
                              </div>

                              {noteText ? (
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-200">
                                  <span className="font-bold flex items-center gap-1 mb-0.5">
                                    <span>📌 Note attached:</span>
                                  </span>
                                  <p className="line-clamp-2 italic">"{noteText}"</p>
                                </div>
                              ) : (
                                <p className="text-[10.5px] text-text-faint italic">No note mapped for this lead</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border shrink-0">
              <div className="text-xs text-text-muted">
                {rows.length > 0 && (
                  <span>
                    Ready to import <strong className="text-text">{rows.length} lead(s)</strong> with{" "}
                    <strong className="text-brand">{activeImportColumnsCount} mapped field(s)</strong>.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>

                {rows.length > 0 && (
                  <button
                    type="button"
                    disabled={pending || !hasIdentifierMapping || activeImportColumnsCount === 0}
                    onClick={handleImportSubmit}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-ink)",
                      color: "var(--color-ink-fg, #ffffff)",
                    }}
                  >
                    {pending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Importing {rows.length} Leads...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Import {rows.length} Leads</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
