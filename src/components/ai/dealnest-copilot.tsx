"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Minimize2,
  Maximize2,
  Palette,
  Zap,
} from "lucide-react";
import { useTheme } from "@/components/theme-context";
import { CopilotResponse } from "@/lib/ai/copilot-engine";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  actionExecuted?: string;
  badges?: Array<{
    label: string;
    type: "success" | "info" | "warning" | "metric";
  }>;
  navigationPath?: string;
  themeId?: string;
  timestamp: Date;
}

const INITIAL_SUGGESTIONS = [
  "What is our total pipeline summary?",
  "Create a $500k deal for Apex Cloud in Negotiation",
  "Create a hot lead for Sarah at Stripe with email sarah@stripe.com",
  "Show all hot leads in the CRM",
  "Move deal Apex Cloud to Won",
  "Switch theme to Obsidian Onyx",
  "Take me to the reports dashboard",
];

export function DealNestCopilot() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "copilot",
      content:
        "Greetings! I am your **DEALNEST Autonomous AI Assistant**.\n\n" +
        "I have direct control over your leads, pipeline, deals, tasks, reports, and workspace settings. " +
        "Tell me what you'd like done, or click one of the quick commands below!",
      timestamp: new Date(),
      badges: [{ label: "Autonomous CRM Agent", type: "info" }],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Keyboard shortcut (Cmd+J / Ctrl+J)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || inputQuery).trim();
    if (!query || isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsPending(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const data: CopilotResponse = await res.json();

      // If action included theme change, apply it live!
      if (data.themeId) {
        setTheme(data.themeId);
      }

      // If action included navigation, route immediately after short delay
      if (data.navigationPath) {
        router.refresh();
      }

      const copilotMessage: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        content: data.reply || "Task processed successfully.",
        actionExecuted: data.actionExecuted,
        badges: data.badges,
        navigationPath: data.navigationPath,
        themeId: data.themeId,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, copilotMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-err-${Date.now()}`,
          sender: "copilot",
          content: `⚠️ Failed to execute task: ${err.message || "Network error."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "copilot",
        content: "Chat history cleared. What task can I execute for you next?",
        timestamp: new Date(),
        badges: [{ label: "Autonomous CRM Agent", type: "info" }],
      },
    ]);
  }

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Always visible in bottom-right) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full border border-amber-500/40 bg-[#0c0d16]/95 px-4 py-3 shadow-[0_12px_40px_rgba(245,158,11,0.3)] backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:border-amber-400 cursor-pointer"
            title="Open DEALNEST AI Copilot (⌘J / Ctrl+J)"
          >
            {/* Glowing Diamond Icon */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/30 to-cyan-500/30 border border-amber-400/50 shadow-inner">
              <Sparkles size={16} className="text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>

            <div className="text-left hidden sm:block">
              <span className="block text-[13px] font-black tracking-tight text-white flex items-center gap-1.5">
                <span>AI Copilot</span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30">
                  Ctrl+J
                </span>
              </span>
              <span className="block text-[10px] font-medium text-slate-400">
                Autonomous CRM Assistant
              </span>
            </div>
          </button>
        )}
      </div>

      {/* COPILOT CHAT DRAWER / WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[460px] h-[86vh] sm:h-[680px] max-h-[90vh] flex flex-col rounded-[28px] border border-white/[0.16] bg-[#0c0d16]/95 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/30 to-cyan-500/30 border border-amber-400/50 shadow-sm text-amber-300">
                <Sparkles size={17} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[14px] font-black tracking-tight text-white">DEALNEST Copilot</h3>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[10.5px] font-semibold text-amber-400/90 uppercase tracking-wider">
                  Autonomous CRM Control
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Copilot (⌘J)"
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "copilot" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-[13px] leading-relaxed shadow-lg ${
                    msg.sender === "user"
                      ? "bg-white/15 text-white border border-white/20 rounded-br-xs"
                      : "bg-[#141522]/85 text-slate-100 border border-white/[0.1] rounded-bl-xs backdrop-blur-xl"
                  }`}
                >
                  {/* Action Badges */}
                  {msg.badges && msg.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.badges.map((b, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            b.type === "success"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : b.type === "metric"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content (Markdown-like formatting) */}
                  <div className="whitespace-pre-line space-y-1.5 font-medium">
                    {msg.content}
                  </div>

                  {/* Quick Action Navigation Link */}
                  {msg.navigationPath && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          router.push(msg.navigationPath!);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <span>Open destination page</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white border border-white/20 mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-center gap-2.5 text-slate-400 text-[12.5px] pl-2 animate-pulse">
                <Loader2 size={16} className="text-amber-400 animate-spin" />
                <span>DEALNEST Copilot is executing your request across CRM...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.01] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="shrink-0 text-amber-400 font-bold">⚡ Quick Prompts:</span>
              {INITIAL_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] px-2.5 py-1 text-[11.5px] text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#0c0d16]"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Give DEALNEST Copilot any task..."
                disabled={isPending}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-4 pr-12 text-[13px] text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isPending}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                title="Execute Command"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[10.5px] text-slate-400">
              <span>Press <kbd className="px-1 py-0.2 rounded bg-white/10 text-white font-bold">Ctrl+J</kbd> anytime to toggle</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck size={11} />
                <span>Direct DB Mutation Ready</span>
              </span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

