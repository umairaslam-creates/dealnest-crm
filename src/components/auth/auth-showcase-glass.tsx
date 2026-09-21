"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Building2,
  CheckCircle2,
  BarChart3,
  Layers,
  Palette,
  ArrowUpRight,
  Lock,
  Users,
} from "lucide-react";
import { THEMES, useTheme } from "@/components/theme-context";

const FEATURE_THEMES = [
  {
    id: "glass-navy",
    name: "Deep Navy",
    badge: "Enterprise",
    color: "#38bdf8",
    bgClass: "from-sky-500/20 via-blue-600/10 to-transparent",
  },
  {
    id: "glass-obsidian",
    name: "Obsidian Onyx",
    badge: "Fintech",
    color: "#00f59b",
    bgClass: "from-emerald-500/20 via-teal-600/10 to-transparent",
  },
  {
    id: "glass-twilight",
    name: "Twilight Violet",
    badge: "Modern AI",
    color: "#a855f7",
    bgClass: "from-purple-500/20 via-indigo-600/10 to-transparent",
  },
  {
    id: "glass-emerald",
    name: "Emerald Sea",
    badge: "Wealth",
    color: "#10b981",
    bgClass: "from-emerald-500/20 via-green-600/10 to-transparent",
  },
  {
    id: "glass-sunset",
    name: "Golden Sunset",
    badge: "Luxury",
    color: "#f59e0b",
    bgClass: "from-amber-500/20 via-orange-600/10 to-transparent",
  },
];

const SAMPLE_DEALS = [
  {
    name: "Apex Global Cloud Infrastructure",
    company: "Apex Tech Enterprises",
    amount: "$640,000",
    stage: "Contract Closing",
    probability: "94%",
    tag: "Enterprise Tier",
    lead: "Ahmad Aziz",
  },
  {
    name: "OmniAI Security & Compliance Suite",
    company: "Omni Financial Group",
    amount: "$1,250,000",
    stage: "Executive Review",
    probability: "88%",
    tag: "Fintech",
    lead: "Sara Khaled",
  },
  {
    name: "FinPay Cross-Border POS Gateway",
    company: "FinPay Middle East",
    amount: "$480,000",
    stage: "Proposal Accepted",
    probability: "96%",
    tag: "Commercial Banking",
    lead: "Omar Sami",
  },
];

export function AuthShowcaseGlass() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"pipeline" | "governance" | "analytics">("pipeline");

  const currentHighlight =
    FEATURE_THEMES.find((t) => t.id === theme.id) || FEATURE_THEMES[0];

  return (
    <div className="relative w-full h-full p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-hidden select-none">
      {/* Dynamic Theme Glow Orb in Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-[540px] h-[540px] rounded-full blur-[110px] opacity-40 transition-colors duration-700"
          style={{ backgroundColor: currentHighlight.color }}
        />
        <div className="absolute -bottom-32 -left-20 w-[460px] h-[460px] rounded-full bg-indigo-600/20 blur-[100px] opacity-50" />
      </div>

      {/* Top Header: Brand Vision & Value Proposition */}
      <div className="relative z-10 space-y-4 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.06] px-4 py-1.5 backdrop-blur-xl shadow-lg">
          <Sparkles size={13} style={{ color: currentHighlight.color }} className="animate-pulse" />
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-200">
            Enterprise Sales Intelligence
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-[1.18]">
          The revenue engine built for{" "}
          <span
            className="bg-clip-text text-transparent transition-all duration-500"
            style={{
              backgroundImage: `linear-gradient(135deg, #ffffff 30%, ${currentHighlight.color} 100%)`,
            }}
          >
            multi-million dollar deals.
          </span>
        </h2>

        <p className="text-[13.5px] sm:text-[14.5px] text-slate-300 font-medium leading-relaxed">
          From cold prospect qualification to board-level contract signatures. Enforce strict
          department governance with a single verified Team Lead per division.
        </p>

        {/* Interactive Live Theme Switcher */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Palette size={12} className="text-slate-300" />
            <span>Switch Live Glassmorphism Theme</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {FEATURE_THEMES.map((t) => {
              const isActive = theme.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-xl scale-105"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-xs transition-transform group-hover:scale-125"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.name}</span>
                  {isActive && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/10 text-white">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center: Precision Frosted Glass Intelligence Card */}
      <div className="relative z-10 my-8 w-full max-w-xl">
        <div className="rounded-3xl border border-white/[0.14] bg-[#0c0d16]/75 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-3xl relative overflow-hidden transition-all duration-500">
          {/* Subtle Ambient Shimmer */}
          <div
            className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${currentHighlight.bgClass}`}
          />

          {/* Card Top Nav Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("pipeline")}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                  activeTab === "pipeline"
                    ? "bg-white/15 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Pipeline ($4.85M)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("governance")}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                  activeTab === "governance"
                    ? "bg-white/15 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Team Lead Governance
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync</span>
            </div>
          </div>

          {/* TAB 1: Live Deals Pipeline */}
          {activeTab === "pipeline" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Executive Metrics Header */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Pipeline
                  </span>
                  <div className="text-[16px] sm:text-[18px] font-black text-white">$4.85M</div>
                  <span className="text-[10px] font-semibold text-emerald-400">+34.2% QoQ</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Win Rate
                  </span>
                  <div className="text-[16px] sm:text-[18px] font-black text-white">94.8%</div>
                  <span className="text-[10px] font-semibold text-sky-400">AI Scored</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Cycle Speed
                  </span>
                  <div className="text-[16px] sm:text-[18px] font-black text-white">18 Days</div>
                  <span className="text-[10px] font-semibold text-amber-400">-40% Faster</span>
                </div>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2">
                {SAMPLE_DEALS.map((deal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-white truncate">
                          {deal.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                          {deal.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{deal.company}</span>
                        <span>•</span>
                        <span className="text-slate-300">Owner: {deal.lead}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[13.5px] font-black text-white">{deal.amount}</div>
                      <div className="text-[10.5px] font-bold text-emerald-400 flex items-center justify-end gap-1">
                        <span>{deal.stage}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Department Governance Rule */}
          {activeTab === "governance" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <span>DEALNEST Strict 1 Team Lead Policy</span>
                </div>
                <span>
                  Each corporate division has exactly 1 Team Lead. New colleagues signup as Team
                  Members and enter a secure approval queue until verified.
                </span>
              </div>

              <div className="space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💼</span>
                    <div>
                      <span className="font-bold text-white">Sales &amp; Revenue</span>
                      <span className="block text-[11px] text-slate-400">Team Lead: Ahmad Aziz</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Lead Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-sky-500/20 bg-sky-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⚙️</span>
                    <div>
                      <span className="font-bold text-white">Engineering &amp; Tech</span>
                      <span className="block text-[11px] text-slate-400">No Lead Registered Yet</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Lead Available
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🚀</span>
                    <div>
                      <span className="font-bold text-white">Growth &amp; Marketing</span>
                      <span className="block text-[11px] text-slate-400">No Lead Registered Yet</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Lead Available
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Trust, Compliance & Security Badges */}
      <div className="relative z-10 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-[11.5px] text-slate-400 font-semibold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Lock size={12} className="text-amber-400" />
            <span>256-bit TLS Encryption</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>SOC-2 Type II Certified</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 hidden sm:inline-flex">
            <Users size={12} className="text-sky-400" />
            <span>Multi-Tenant Architecture</span>
          </span>
        </div>

        <div className="text-slate-500 text-[11px]">
          DEALNEST Enterprise Platform © 2026
        </div>
      </div>
    </div>
  );
}

