"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Calendar,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Zap,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Send,
  CalendarCheck,
  Globe,
} from "lucide-react";
import {
  toggleGoogleConnectionAction,
  saveGoogleIntegrationSettingsAction,
  saveOpenAiSettingsAction,
  testOpenAiConnectionAction,
  saveHubSpotTokenAction,
  syncGoogleCalendarAction,
} from "@/app/actions/integrations";

type GoogleData = {
  configured: boolean;
  connected: boolean;
  email?: string | null;
  settings?: {
    calendarSync: boolean;
    emailSync: boolean;
    autoMeetLinks: boolean;
  };
};

type OpenAiData = {
  configured: boolean;
  settings?: {
    apiKey?: string;
    model: string;
    temperature: number;
    enableCopilot: boolean;
    enableScoring: boolean;
    enableEmailWriter: boolean;
    enableMeetingSummary: boolean;
    maskedKey?: string;
  };
};

type HubSpotData = {
  configured: boolean;
  maskedToken?: string;
};

export function IntegrationsClient({
  google,
  openai,
  hubspot,
  userEmail,
}: {
  google: GoogleData;
  openai: OpenAiData;
  hubspot: HubSpotData;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Google State
  const [googleConnected, setGoogleConnected] = useState(google.connected);
  const [googleEmail, setGoogleEmail] = useState(google.email || userEmail || "ahmad.aziz@mytm.co");
  const [calendarSync, setCalendarSync] = useState(google.settings?.calendarSync ?? true);
  const [emailSync, setEmailSync] = useState(google.settings?.emailSync ?? true);
  const [autoMeet, setAutoMeet] = useState(google.settings?.autoMeetLinks ?? true);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // OpenAI State
  const [apiKey, setApiKey] = useState(openai.settings?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiModel, setAiModel] = useState(openai.settings?.model || "gpt-4o");
  const [temperature, setTemperature] = useState(openai.settings?.temperature ?? 0.7);
  const [enableCopilot, setEnableCopilot] = useState(openai.settings?.enableCopilot ?? true);
  const [enableScoring, setEnableScoring] = useState(openai.settings?.enableScoring ?? true);
  const [enableEmailWriter, setEnableEmailWriter] = useState(openai.settings?.enableEmailWriter ?? true);
  const [enableMeetingSummary, setEnableMeetingSummary] = useState(openai.settings?.enableMeetingSummary ?? true);
  const [testingOpenAi, setTestingOpenAi] = useState(false);
  const [openAiStatusMsg, setOpenAiStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingOpenAi, setSavingOpenAi] = useState(false);

  // HubSpot State
  const [hubSpotToken, setHubSpotToken] = useState(hubspot.maskedToken || "");
  const [showHubSpotToken, setShowHubSpotToken] = useState(false);
  const [hubSpotConnected, setHubSpotConnected] = useState(hubspot.configured);
  const [savingHubSpot, setSavingHubSpot] = useState(false);
  const [hubSpotNotice, setHubSpotNotice] = useState<string | null>(null);

  // Toggle Google Account Connection
  async function handleToggleGoogle(connect: boolean) {
    startTransition(async () => {
      const res = await toggleGoogleConnectionAction(connect, googleEmail);
      if (res.success) {
        setGoogleConnected(connect);
        if (connect) {
          setSyncNotice("Google Workspace account connected successfully.");
        } else {
          setSyncNotice("Google Workspace account disconnected.");
        }
        setTimeout(() => setSyncNotice(null), 3500);
      }
    });
  }

  // Save Google Preferences
  async function handleSaveGoogleSettings() {
    startTransition(async () => {
      await saveGoogleIntegrationSettingsAction({
        calendarSync,
        emailSync,
        autoMeetLinks: autoMeet,
      });
      setSyncNotice("Google Workspace preferences saved.");
      setTimeout(() => setSyncNotice(null), 3000);
    });
  }

  // Trigger Google Calendar Sync
  async function handleSyncCalendar() {
    setSyncingCalendar(true);
    const res = await syncGoogleCalendarAction();
    setSyncingCalendar(false);
    if (res.success) {
      setSyncNotice(res.message || "Google Calendar synchronized successfully.");
      setTimeout(() => setSyncNotice(null), 4000);
    }
  }

  // Test OpenAI Connection
  async function handleTestOpenAi() {
    setTestingOpenAi(true);
    setOpenAiStatusMsg(null);
    const res = await testOpenAiConnectionAction(apiKey, aiModel);
    setTestingOpenAi(false);
    if (res.success) {
      setOpenAiStatusMsg({
        type: "success",
        text: `Active & Verified: ${res.model} (${res.latencyMs}ms latency).`,
      });
    } else {
      setOpenAiStatusMsg({
        type: "error",
        text: res.error || "Connection failed. Please check your API key.",
      });
    }
  }

  // Save OpenAI Configuration
  async function handleSaveOpenAi() {
    setSavingOpenAi(true);
    const res = await saveOpenAiSettingsAction({
      apiKey: apiKey.trim() || undefined,
      model: aiModel,
      temperature,
      enableCopilot,
      enableScoring,
      enableEmailWriter,
      enableMeetingSummary,
    });
    setSavingOpenAi(false);
    if (res.success) {
      setOpenAiStatusMsg({
        type: "success",
        text: "AI intelligence settings saved and active across CRM.",
      });
      setTimeout(() => setOpenAiStatusMsg(null), 4000);
    }
  }

  // Save HubSpot Token
  async function handleSaveHubSpot() {
    if (!hubSpotToken.trim()) return;
    setSavingHubSpot(true);
    const res = await saveHubSpotTokenAction(hubSpotToken.trim());
    setSavingHubSpot(false);
    if (res.success) {
      setHubSpotConnected(true);
      setHubSpotNotice("HubSpot private app token saved and active.");
      setTimeout(() => setHubSpotNotice(null), 4000);
    }
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* 1. GOOGLE WORKSPACE INTEGRATION (GMAIL & CALENDAR) */}
      <div className="rounded-3xl border border-white/10 bg-surface p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[var(--color-brand,#4361ee)] shadow-sm">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-text">Google Workspace Integration</h3>
                <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-bold text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                  Gmail &amp; Calendar
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Connect your account to embed Google Calendar into Meetings and open the full Gmail client inside DEALNEST.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                googleConnected
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-500/10 border-slate-500/20 text-text-muted"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${googleConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span>{googleConnected ? "Connected" : "Not Connected"}</span>
            </span>
          </div>
        </div>

        {syncNotice && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Connection Action Bar */}
        <div className="mt-5 p-4 rounded-2xl bg-surface-2/60 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-text uppercase tracking-wider">Connected Google Account</p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="you@dealnest.co or you@gmail.com"
                className="w-64 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-brand focus:outline-none"
              />
              {googleConnected && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check size={13} /> Active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {googleConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncCalendar}
                  disabled={syncingCalendar}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={13} className={syncingCalendar ? "animate-spin text-brand" : "text-text-muted"} />
                  <span>{syncingCalendar ? "Syncing..." : "Sync Calendar"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGoogle(false)}
                  disabled={pending}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-500 transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleGoogle(true)}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand,#4361ee)] hover:opacity-90 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <Globe size={14} />
                <span>Connect Google Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Toggles & Quick Launch Links */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendar Sync Card */}
          <div className="p-4 rounded-2xl border border-border bg-surface-2/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarCheck size={18} className="text-blue-500" />
                <span className="text-xs font-bold text-text">Google Calendar Integration</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={calendarSync}
                  onChange={(e) => setCalendarSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand,#4361ee)]"></div>
              </label>
            </div>
            <p className="text-[11.5px] text-text-muted leading-relaxed">
              Show appointments in an authentic Google Calendar grid inside the Meetings tab with automated Google Meet video links.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-text-faint">Status: {calendarSync ? "2-Way Live Sync" : "Paused"}</span>
              <Link
                href="/meetings"
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline"
              >
                <span>View Google Calendar</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Gmail Client Card */}
          <div className="p-4 rounded-2xl border border-border bg-surface-2/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail size={18} className="text-rose-500" />
                <span className="text-xs font-bold text-text">Gmail Web Client Inside CRM</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSync}
                  onChange={(e) => setEmailSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand,#4361ee)]"></div>
              </label>
            </div>
            <p className="text-[11.5px] text-text-muted leading-relaxed">
              Open a full Gmail inbox interface right inside the CRM. Send proposals, review threads, and draft with AI assistance.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-text-faint">Status: {emailSync ? "Ready & Active" : "Paused"}</span>
              <Link
                href="/inbox"
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline"
              >
                <span>Open Gmail Inbox</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveGoogleSettings}
            className="rounded-xl border border-border bg-surface hover:bg-surface-2 px-4 py-2 text-xs font-bold text-text transition-all cursor-pointer"
          >
            Save Google Preferences
          </button>
        </div>
      </div>

      {/* 2. OPENAI INTELLIGENCE SUITE */}
      <div className="rounded-3xl border border-white/10 bg-surface p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-text">OpenAI Intelligence &amp; Copilot Engine</h3>
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                  AI Suite
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Configure OpenAI models (`gpt-4o`, `gpt-4o-mini`), adjust AI temperature, and manage autonomous Copilot permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                apiKey || openai.configured
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <Zap size={13} className={apiKey || openai.configured ? "text-amber-500" : "text-emerald-500"} />
              <span>{apiKey || openai.configured ? "OpenAI Connected" : "Local Smart Engine"}</span>
            </span>
          </div>
        </div>

        {openAiStatusMsg && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs flex items-center gap-2 animate-in fade-in ${
              openAiStatusMsg.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            }`}
          >
            {openAiStatusMsg.type === "success" ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-rose-500 shrink-0" />
            )}
            <span>{openAiStatusMsg.text}</span>
          </div>
        )}

        {/* OpenAI Controls Form */}
        <div className="mt-5 space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              OpenAI API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full rounded-2xl border border-border bg-surface-2/60 px-4 py-2.5 pr-24 text-xs font-mono text-text placeholder:text-text-faint focus:border-brand focus:outline-none"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface transition-colors cursor-pointer"
                  title={showApiKey ? "Hide key" : "Show key"}
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={handleTestOpenAi}
                  disabled={testingOpenAi}
                  className="rounded-xl border border-border bg-surface hover:bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-text transition-all cursor-pointer disabled:opacity-60"
                >
                  {testingOpenAi ? "Testing..." : "Test Ping"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-faint mt-1">
              Your key is securely stored in your local environment and used only when you trigger AI actions.
            </p>
          </div>

          {/* Model & Temperature Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                AI Engine Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-xs font-medium text-text focus:border-brand focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o">gpt-4o (Omni Flagship - Recommended)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (Fast &amp; Cost-Effective)</option>
                <option value="gpt-4-turbo">gpt-4-turbo (High Reasoning)</option>
                <option value="o1-preview">o1-preview (Strategic Analysis)</option>
                <option value="dealnest-smart-local">DEALNEST Built-in Local Engine (Offline)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">
                  AI Creativity / Temperature
                </label>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-text font-mono border border-border">
                  {temperature.toFixed(2)} ({temperature < 0.4 ? "Precise" : temperature > 0.7 ? "Creative" : "Balanced"})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-brand,#4361ee)] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-2.5">
              Active AI Capabilities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-surface-2/40 cursor-pointer hover:bg-surface-2/70 transition-colors">
                <input
                  type="checkbox"
                  checked={enableCopilot}
                  onChange={(e) => setEnableCopilot(e.target.checked)}
                  className="rounded text-brand accent-[var(--color-brand,#4361ee)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-text block">Autonomous CRM Copilot (Ctrl+J)</span>
                  <span className="text-[11px] text-text-muted">Create deals, filter leads, and trigger actions by voice/text</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-surface-2/40 cursor-pointer hover:bg-surface-2/70 transition-colors">
                <input
                  type="checkbox"
                  checked={enableScoring}
                  onChange={(e) => setEnableScoring(e.target.checked)}
                  className="rounded text-brand accent-[var(--color-brand,#4361ee)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-text block">Predictive Lead Win Scoring</span>
                  <span className="text-[11px] text-text-muted">Calculate deal velocity and close probability</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-surface-2/40 cursor-pointer hover:bg-surface-2/70 transition-colors">
                <input
                  type="checkbox"
                  checked={enableEmailWriter}
                  onChange={(e) => setEnableEmailWriter(e.target.checked)}
                  className="rounded text-brand accent-[var(--color-brand,#4361ee)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-text block">AI Sales Email Drafter</span>
                  <span className="text-[11px] text-text-muted">Draft enterprise follow-ups and pitches in Gmail client</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-surface-2/40 cursor-pointer hover:bg-surface-2/70 transition-colors">
                <input
                  type="checkbox"
                  checked={enableMeetingSummary}
                  onChange={(e) => setEnableMeetingSummary(e.target.checked)}
                  className="rounded text-brand accent-[var(--color-brand,#4361ee)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-text block">Meeting AI Summarizer</span>
                  <span className="text-[11px] text-text-muted">Generate action items and takeaways from customer calls</span>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveOpenAi}
              disabled={savingOpenAi}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {savingOpenAi ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save AI Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. HUBSPOT MULTI-CLOUD INTEGRATION */}
      <div className="rounded-3xl border border-white/10 bg-surface p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-sm">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-text">HubSpot Integration</h3>
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-[10.5px] font-bold text-orange-500 border border-orange-500/20 uppercase tracking-wider">
                  Sync &amp; Import
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Import contacts and deals from HubSpot or configure a private app token for live 2-way sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                hubSpotConnected
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-500/10 border-slate-500/20 text-text-muted"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${hubSpotConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
              <span>{hubSpotConnected ? "Token Configured" : "CSV Import Ready"}</span>
            </span>
          </div>
        </div>

        {hubSpotNotice && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>{hubSpotNotice}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              HubSpot Private App Token
            </label>
            <div className="relative flex items-center">
              <input
                type={showHubSpotToken ? "text" : "password"}
                value={hubSpotToken}
                onChange={(e) => setHubSpotToken(e.target.value)}
                placeholder="pat-na1-..."
                className="w-full rounded-2xl border border-border bg-surface-2/60 px-4 py-2.5 pr-20 text-xs font-mono text-text placeholder:text-text-faint focus:border-brand focus:outline-none"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHubSpotToken(!showHubSpotToken)}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface transition-colors cursor-pointer"
                >
                  {showHubSpotToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={handleSaveHubSpot}
                  disabled={savingHubSpot}
                  className="rounded-xl border border-border bg-surface hover:bg-surface-2 px-3 py-1 text-xs font-bold text-text transition-all cursor-pointer"
                >
                  {savingHubSpot ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-text-faint mt-1">
              You can also directly import HubSpot CSV/XLSX export spreadsheets from the <strong>Leads → Import from File</strong> menu without requiring any token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
