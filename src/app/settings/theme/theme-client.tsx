"use client";

import React, { useState } from "react";
import {
  Palette,
  Check,
  Building,
  Image as ImageIcon,
  Sparkles,
  RefreshCcw,
  Shield,
  Globe,
  Zap,
  Box,
  Diamond,
  Flame,
  Type,
  Layers,
} from "lucide-react";
import { THEMES, useTheme, ThemeConfig, CompanyBranding } from "@/components/theme-context";
import { useToast } from "@/components/toast-context";

const EMBLEMS = [
  { id: "M", label: "Classic M", icon: null },
  { id: "diamond", label: "Diamond", icon: Diamond },
  { id: "globe", label: "Globe", icon: Globe },
  { id: "shield", label: "Shield", icon: Shield },
  { id: "spark", label: "Spark", icon: Sparkles },
  { id: "cube", label: "Cube", icon: Box },
  { id: "zap", label: "Lightning", icon: Zap },
];

export function ThemeSettingsClient() {
  const toast = useToast();
  const { theme, setTheme, branding, updateBranding, resetBranding, fontCombo, setFontCombo, fontCombos } = useTheme();

  const [categoryFilter, setCategoryFilter] = useState("All");

  // Local branding form state
  const [name, setName] = useState(branding.companyName);
  const [tagline, setTagline] = useState(branding.companyTagline);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");
  const [selectedEmblem, setSelectedEmblem] = useState<CompanyBranding["emblem"]>(
    branding.emblem || "M"
  );

  const categories = [
    "All",
    "Glassmorphism & Frosted",
    "Modern Pastel",
    "Vibrant Fintech",
    "Dark & Obsidian",
    "Luxury Enterprise",
    "Minimalist",
  ];

  const filteredThemes = THEMES.filter((t) => {
    if (categoryFilter === "All") return true;
    return t.category === categoryFilter;
  });

  function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    updateBranding({
      companyName: name.trim() || "DEALNEST",
      companyTagline: tagline.trim() || "Enterprise Sales Intelligence",
      logoUrl: logoUrl.trim() || null,
      emblem: selectedEmblem,
    });
    toast.success("Company branding updated successfully!");
  }

  function handleReset() {
    resetBranding();
    setName("DEALNEST");
    setTagline("Enterprise Sales Intelligence");
    setLogoUrl("");
    setSelectedEmblem("diamond");
    toast.info("Branding reset to defaults.");
  }

  return (
    <div className="space-y-8 max-w-6xl pb-10">
      {/* 1. COMPANY BRANDING & LOGO CUSTOMIZER */}
      <div className="card p-6 space-y-6 border border-border bg-surface text-text shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-2xs">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Company Logo &amp; Identity</h2>
              <p className="text-xs text-text-muted">
                Replace default DEALNEST text with your company name, custom logo, or brand emblem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-2 shadow-2xs transition-colors"
          >
            <RefreshCcw size={12} />
            <span>Reset to Default</span>
          </button>
        </div>

        <form onSubmit={handleSaveBranding} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Company Name (replaces DEALNEST) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp, Saudi Fintech..."
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Company Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Enterprise Sales, Global Payments..."
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Custom Logo Image URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Custom Logo Image URL (Optional PNG/SVG)
              </label>
              <div className="relative">
                <ImageIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-2xl border border-border bg-surface pl-9 pr-4 py-2.5 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Leave empty to use the selected emblem icon below.
              </p>
            </div>

            {/* Emblem selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Brand Emblem Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {EMBLEMS.map((emb) => {
                  const Icon = emb.icon;
                  const isSelected = selectedEmblem === emb.id;
                  return (
                    <button
                      key={emb.id}
                      type="button"
                      onClick={() => setSelectedEmblem(emb.id as any)}
                      className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                        isSelected
                          ? "border-brand bg-brand/15 text-brand shadow-2xs font-bold"
                          : "border-border bg-surface text-text hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-brand/15 text-brand">
                        {Icon ? <Icon size={12} /> : <span className="font-bold text-xs">M</span>}
                      </div>
                      <span>{emb.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="rounded-full bg-brand hover:bg-brand/90 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                Apply Company Branding
              </button>
            </div>
          </div>

          {/* Live Preview Box (1 Col) */}
          <div className="rounded-2xl bg-surface-2 border border-border p-5 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">
                Live Sidebar Preview
              </p>

              {/* Sidebar header preview */}
              <div className="rounded-2xl bg-surface border border-border p-3 flex items-center gap-3 shadow-2xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded-xl object-contain p-1 border border-border"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand font-bold text-lg shadow-2xs">
                    {selectedEmblem === "M" ? (
                      "M"
                    ) : selectedEmblem === "diamond" ? (
                      <Diamond size={18} />
                    ) : selectedEmblem === "globe" ? (
                      <Globe size={18} />
                    ) : selectedEmblem === "shield" ? (
                      <Shield size={18} />
                    ) : selectedEmblem === "spark" ? (
                      <Sparkles size={18} />
                    ) : selectedEmblem === "cube" ? (
                      <Box size={18} />
                    ) : (
                      <Zap size={18} />
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold tracking-tight text-text">
                      {name || "DEALNEST"}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {tagline || "Enterprise Sales Intelligence"}
                  </span>
                </div>
              </div>

              {/* Collapsed Pill Preview */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  Collapsed Icon State
                </p>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand font-bold text-lg shadow-2xs">
                  {selectedEmblem === "M" ? (
                    "M"
                  ) : selectedEmblem === "diamond" ? (
                    <Diamond size={18} />
                  ) : selectedEmblem === "globe" ? (
                    <Globe size={18} />
                  ) : selectedEmblem === "shield" ? (
                    <Shield size={18} />
                  ) : selectedEmblem === "spark" ? (
                    <Sparkles size={18} />
                  ) : selectedEmblem === "cube" ? (
                    <Box size={18} />
                  ) : (
                    <Zap size={18} />
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10.5px] text-text-muted mt-4">
              Saved preferences apply immediately and persist in your browser.
            </p>
          </div>
        </form>
      </div>

      {/* 2. DEDICATED GLASSMORPHISM & FROSTED GLASS SHOWCASE SECTION (7 Themes) */}
      <div className="space-y-5 rounded-3xl p-6 border border-indigo-300/40 bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-blue-950/95 text-white shadow-2xl relative overflow-hidden">
        {/* Luminous Background Orbs simulating genuine optical glass refraction */}
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-cyan-300 shadow-inner">
              <Sparkles size={22} className="animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Glassmorphism &amp; Frosted Glass
                </h2>
                <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[10.5px] font-bold text-cyan-300 uppercase tracking-wider">
                  ✦ 7 Dedicated Themes
                </span>
                <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-300 uppercase tracking-wider">
                  Photo Reference Match
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Optical frosted translucent glass cards, specular light borders, inner highlights, and ambient illumination matching your inspiration image. Automatically converts sidebars, headers, cards, and tables across the entire CRM into translucent glass.
              </p>
            </div>
          </div>

          {theme.isGlass && (
            <div className="flex items-center gap-2 self-start md:self-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Check size={13} className="text-emerald-400" />
              <span>Glassmorphism Active</span>
            </div>
          )}
        </div>

        {/* Live Frosted Card Preview Strip */}
        <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-amber-300 text-slate-950 font-black shadow-md">
              GL
            </div>
            <div>
              <p className="text-xs font-bold text-white">Live Frosted Glass Surface</p>
              <p className="text-[11px] text-slate-300">
                Notice the ambient light refraction, specular top border, and blur diffusion.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/15 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-slate-400">Active Theme:</span>
            <span className="text-xs font-bold text-cyan-300">{theme.name}</span>
          </div>
        </div>

        {/* 7 Dedicated Glassmorphism Themes Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
          {THEMES.filter((t) => t.isGlass).map((t) => {
            const isSelected = theme.id === t.id;
            const p = t.palette;

            return (
              <div
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  toast.success(`Applied "${t.name}" glassmorphism theme!`);
                }}
                className={`group relative flex flex-col justify-between rounded-3xl p-5 cursor-pointer transition-all duration-200 backdrop-blur-2xl ${
                  isSelected
                    ? "ring-2 ring-cyan-400 shadow-2xl scale-[1.02]"
                    : "hover:scale-[1.01] hover:border-white/40"
                }`}
                style={{
                  backgroundColor: p.surface,
                  border: isSelected ? "1.5px solid #38bdf8" : `1px solid ${p.border}`,
                  boxShadow: isSelected
                    ? "0 20px 40px -8px rgba(0,0,0,0.6), inset 0 1px 2px 0 rgba(255,255,255,0.35)"
                    : "0 10px 25px -5px rgba(0,0,0,0.4), inset 0 1px 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="text-sm font-bold leading-tight"
                        style={{ color: p.text }}
                      >
                        {t.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-[10.5px] font-semibold text-cyan-300">
                          Frosted Glass
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-slate-950 font-bold shadow-sm">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    ) : (
                      <div
                        className="h-4 w-4 rounded-full border border-white/30"
                        style={{ backgroundColor: p.brand }}
                      />
                    )}
                  </div>

                  {/* Swatches Bar */}
                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-xl border border-white/30 shadow-inner"
                      style={{ backgroundColor: p.bg }}
                      title="Canvas Background"
                    />
                    <div
                      className="h-7 w-7 rounded-xl border border-white/40 shadow-inner"
                      style={{ backgroundColor: p.brand }}
                      title="Brand Accent"
                    />
                    <div
                      className="h-7 w-7 rounded-xl border border-white/40 shadow-inner"
                      style={{ backgroundColor: p.accent }}
                      title="Accent"
                    />
                    <div
                      className="h-7 flex-1 rounded-xl border border-white/30 flex items-center justify-center text-[10px] font-bold shadow-inner"
                      style={{ backgroundColor: p.surface2, color: p.text }}
                    >
                      {t.fontName}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span style={{ color: p.textMuted }}>{t.fontName}</span>
                  <span
                    className="font-bold text-[11px] underline group-hover:opacity-100 transition-opacity"
                    style={{ color: p.brand }}
                  >
                    {isSelected ? "Active Now" : "Apply Theme →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ALL THEMES CATALOG (PALETTES & FONTS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-2xs">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">CRM Color Palettes &amp; Typography</h2>
              <p className="text-xs text-text-muted">
                Select from 14 curated theme designs. Instantly transforms colors, surfaces, and typography.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-brand text-white shadow-2xs font-bold"
                    : "bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Themes Grid (14 Options) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredThemes.map((t) => {
            const isSelected = theme.id === t.id;
            const p = t.palette;

            return (
              <div
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  toast.success(`Applied "${t.name}" theme!`);
                }}
                className={`theme-preview-card group relative flex flex-col justify-between rounded-3xl p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-brand shadow-md scale-[1.01]"
                    : "hover:shadow-sm hover:scale-[1.005]"
                }`}
                style={{
                  backgroundColor: p.surface,
                  border: `1.5px solid ${isSelected ? p.brand : p.border}`,
                }}
              >
                <div>
                  {/* Top Bar: Name & Category */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="text-sm font-bold leading-tight"
                        style={{ color: p.text }}
                      >
                        {t.name}
                      </h3>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: p.textMuted }}
                      >
                        {t.category}
                      </span>
                    </div>

                    {isSelected && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white shadow-xs"
                        style={{ backgroundColor: p.brand }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Typography Pill */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        backgroundColor: p.surface2,
                        color: p.text,
                        border: `1px solid ${p.border}`,
                      }}
                    >
                      <Type size={11} style={{ color: p.brand }} />
                      {t.fontName}
                    </span>
                    {t.isDark && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: p.bg,
                          color: p.brand,
                          border: `1px solid ${p.borderStrong}`,
                        }}
                      >
                        Dark Mode
                      </span>
                    )}
                  </div>

                  {/* Color Palette Swatches (5 Circles) */}
                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full shadow-2xs"
                      style={{ backgroundColor: p.bg, border: `1px solid ${p.borderStrong}` }}
                      title={`Background: ${p.bg}`}
                    />
                    <div
                      className="h-6 w-6 rounded-full shadow-2xs"
                      style={{ backgroundColor: p.surface, border: `1px solid ${p.borderStrong}` }}
                      title={`Surface: ${p.surface}`}
                    />
                    <div
                      className="h-6 w-6 rounded-full shadow-2xs"
                      style={{ backgroundColor: p.brand, border: `1px solid ${p.borderStrong}` }}
                      title={`Brand Accent: ${p.brand}`}
                    />
                    <div
                      className="h-6 w-6 rounded-full shadow-2xs"
                      style={{ backgroundColor: p.accent, border: `1px solid ${p.borderStrong}` }}
                      title={`Secondary: ${p.accent}`}
                    />
                    <div
                      className="h-6 w-6 rounded-full shadow-2xs"
                      style={{ backgroundColor: p.text, border: `1px solid ${p.borderStrong}` }}
                      title={`Text: ${p.text}`}
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <div
                  className="mt-5 pt-3 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${p.border}` }}
                >
                  <span
                    className="text-xs font-bold transition-colors"
                    style={{ color: isSelected ? p.brand : p.textMuted }}
                  >
                    {isSelected ? "Active Theme" : "Click to Apply"}
                  </span>
                  <div
                    className="h-2 w-12 rounded-full"
                    style={{ backgroundColor: p.brand }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CRM TYPOGRAPHY & FONT COMBINATIONS (12 CURATED COMBOS) */}
      <div className="card p-6 space-y-6 border border-border bg-surface text-text shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-2xs">
              <Type size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text">CRM Font Combinations (12 Curated Combos)</h2>
                <span className="rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[11px] font-bold text-brand">
                  12 Options
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Choose a font combo to immediately transform all headings, cards, text, and numerical displays across the CRM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Currently Active:</span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-bold text-text border border-border">
              {fontCombo.name}
            </span>
          </div>
        </div>

        {/* Font Combos Grid (12 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fontCombos.map((fc) => {
            const isSelected = fontCombo.id === fc.id;

            return (
              <div
                key={fc.id}
                onClick={() => {
                  setFontCombo(fc.id);
                  toast.success(`Applied "${fc.name}" font combination!`);
                }}
                className={`group relative flex flex-col justify-between rounded-3xl p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-brand shadow-md bg-brand/10 border-brand"
                    : "border border-border bg-surface hover:border-brand/40 hover:bg-surface-2 hover:shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Combo Name & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-text">{fc.name}</h3>
                        <span className="rounded-full bg-surface-2 text-text-muted border border-border px-2 py-0.5 text-[10px] font-bold">
                          {fc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        <span className="font-semibold text-text">{fc.headingName}</span> (Headings) +{" "}
                        <span className="font-semibold text-text">{fc.bodyName}</span> (Body)
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-xs">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Specimen Preview Card */}
                  <div className="rounded-2xl border border-border bg-surface-2/80 p-3.5 space-y-1.5">
                    <p
                      className="text-base font-bold text-text leading-snug"
                      style={{ fontFamily: fc.headingFont }}
                    >
                      {fc.preview.heading}
                    </p>
                    <p
                      className="text-xs text-text-muted leading-relaxed"
                      style={{ fontFamily: fc.bodyFont }}
                    >
                      {fc.preview.sub}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-[11.5px] text-text-muted leading-relaxed">
                    {fc.description}
                  </p>
                </div>

                {/* Footer Selection Button */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isSelected ? "text-brand" : "text-text-muted group-hover:text-text"
                    }`}
                  >
                    {isSelected ? "Active Font Combo" : "Select Combo"}
                  </span>
                  <div
                    className={`h-2 w-10 rounded-full transition-all ${
                      isSelected ? "bg-brand" : "bg-border group-hover:bg-border-strong"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

