"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Tag,
  MapPin,
  Flame,
  Loader2,
  Briefcase,
  Globe,
  DollarSign,
} from "lucide-react";
import { createLead, updateLead } from "@/app/actions";
import { useToast } from "@/components/toast-context";

const PRODUCT_INTEREST_PRESETS = [
  "Payment Gateway",
  "Smart POS Terminals",
  "Core Banking API",
  "Corporate Payroll",
  "Payment Orchestration",
  "Merchant Onboarding",
  "Wallet Infrastructure",
  "Custom Fintech",
];

export type LeadEntity = {
  id: string;
  contactName: string;
  title?: string | null;
  company?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  productInterest?: string | null;
  region?: string | null;
  city?: string | null;
  value?: number | null;
  score?: string | null;
  pipelineId?: string | null;
  stageId?: string | null;
  ownerId?: string | null;
  tags?: string | null;
};

export function LeadModal({
  open,
  onClose,
  leadToEdit,
  pipelineId,
  stages = [],
  members = [],
  pipelines = [],
  availableLabels = [],
}: {
  open: boolean;
  onClose: () => void;
  leadToEdit?: LeadEntity | null;
  pipelineId: string;
  stages: { id: string; name: string }[];
  members?: { id: string; name: string | null }[];
  pipelines?: { id: string; name: string }[];
  availableLabels?: { id: string; name: string; color: string }[];
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [selectedPipelineId, setSelectedPipelineId] = useState(
    leadToEdit?.pipelineId ?? pipelineId
  );
  const [contactName, setContactName] = useState(leadToEdit?.contactName ?? "");
  const [title, setTitle] = useState(leadToEdit?.title ?? "");
  const [company, setCompany] = useState(leadToEdit?.company ?? "");
  const [website, setWebsite] = useState(leadToEdit?.website ?? "");
  const [email, setEmail] = useState(leadToEdit?.email ?? "");
  const [phone, setPhone] = useState(leadToEdit?.phone ?? "");
  const [source, setSource] = useState(leadToEdit?.source ?? "Inbound");
  const [productInterest, setProductInterest] = useState(leadToEdit?.productInterest ?? "Payment Gateway");
  const [region, setRegion] = useState(leadToEdit?.region ?? "Riyadh");
  const [city, setCity] = useState(leadToEdit?.city ?? "");
  const [value, setValue] = useState(leadToEdit?.value != null ? String(leadToEdit.value) : "");
  const [score, setScore] = useState(leadToEdit?.score ?? "warm");
  const [stageId, setStageId] = useState(leadToEdit?.stageId ?? stages[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState(leadToEdit?.ownerId ?? "");

  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (!leadToEdit?.tags) return [];
    try {
      const parsed = JSON.parse(leadToEdit.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  function toggleTag(tagName: string) {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim()) {
      toast.error("Contact name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (leadToEdit) {
        await updateLead(leadToEdit.id, {
          contactName: contactName.trim(),
          title: title.trim() || null,
          company: company.trim() || null,
          website: website.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          source: source || null,
          productInterest: productInterest || null,
          region: region || null,
          city: city.trim() || null,
          value: value ? parseFloat(value) : null,
          score: score || null,
          stageId: stageId || undefined,
          ownerId: ownerId || null,
          tags: JSON.stringify(selectedTags),
        });
        toast.success("Lead updated successfully!");
      } else {
        await createLead({
          contactName: contactName.trim(),
          title: title.trim() || undefined,
          company: company.trim() || undefined,
          website: website.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          source: source || undefined,
          productInterest: productInterest || undefined,
          region: region || undefined,
          city: city.trim() || undefined,
          value: value ? parseFloat(value) : undefined,
          score: score || undefined,
          pipelineId: selectedPipelineId,
          stageId: stageId || stages[0]?.id,
          ownerId: ownerId || undefined,
          tags: JSON.stringify(selectedTags),
        });
        toast.success("Lead created successfully!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              {leadToEdit ? "Edit Lead" : "Add New Lead"}
            </h2>
            <p className="text-[12px] text-text-muted">
              {leadToEdit ? "Update lead contact details, section and tags" : "Capture prospect details into the pipeline"}
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
          {/* Section / Campaign selection */}
          {pipelines.length > 0 && !leadToEdit && (
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Lead Section / Campaign
              </label>
              <select
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contact Name & Job Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <User size={13} className="text-text-muted" /> Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tariq Al-Mansoor"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Briefcase size={13} className="text-text-muted" /> Title / Designation
              </label>
              <input
                type="text"
                placeholder="e.g. VP of Operations"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>
          </div>

          {/* Company Name & Company Website */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Building size={13} className="text-text-muted" /> Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Riyadh Retail Co."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Globe size={13} className="text-text-muted" /> Company Website
              </label>
              <input
                type="text"
                placeholder="e.g. https://company.sa"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>
          </div>

          {/* Email Address & Phone Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Mail size={13} className="text-text-muted" /> Email Address
              </label>
              <input
                type="email"
                placeholder="tariq@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Phone size={13} className="text-text-muted" /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="+966 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>
          </div>

          {/* Estimated Value & City / Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <DollarSign size={13} className="text-text-muted" /> Estimated Value (SAR/USD)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 50000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <MapPin size={13} className="text-text-muted" /> City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Riyadh, Jeddah, Dubai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Tag size={13} className="text-text-muted" /> Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              >
                <option value="Inbound">Inbound Web</option>
                <option value="Outreach">Outbound Outreach</option>
                <option value="Referral">Client Referral</option>
                <option value="Event">LEAP / Conference</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Flame size={13} className="text-text-muted" /> Lead Temperature
              </label>
              <select
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              >
                <option value="hot">🔥 Hot Lead</option>
                <option value="warm">⚡ Warm Lead</option>
                <option value="cold">❄️ Cold Lead</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Product Interest
              </label>
              <input
                list="lead-product-interest-presets"
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                placeholder="Select or type any custom product/need"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
              <datalist id="lead-product-interest-presets">
                {PRODUCT_INTEREST_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
              <p className="mt-1 text-[10.5px] text-text-faint">
                Pick a preset or type a custom product, solution, or requirement.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <MapPin size={13} className="text-text-muted" /> Region / City
              </label>
              <input
                type="text"
                placeholder="e.g. Riyadh, KSA"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Initial Stage
              </label>
              <select
                data-testid="stage-selector"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Assigned Sales Rep
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-brand transition-all"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? "Member"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels / Tags Multi-select */}
          {availableLabels.length > 0 && (
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Labels & Tags
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-surface-2/60">
                {availableLabels.map((lbl) => {
                  const isChecked = selectedTags.includes(lbl.name);
                  return (
                    <button
                      type="button"
                      key={lbl.id || lbl.name}
                      onClick={() => toggleTag(lbl.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        isChecked ? "shadow-sm scale-[1.02]" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: isChecked ? `${lbl.color}25` : "var(--color-surface)",
                        borderColor: isChecked ? lbl.color : "var(--color-border)",
                        color: isChecked ? lbl.color : "var(--color-text)",
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: lbl.color }}
                      />
                      <span>{lbl.name}</span>
                      {isChecked && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid={leadToEdit ? "update-lead-button" : "save-lead-button"}
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold shadow-md transition-all active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-ink-fg, #ffffff)",
              }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {leadToEdit ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
