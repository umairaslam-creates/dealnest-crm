"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Handshake,
  Users,
  Contact,
  CheckSquare,
  ArrowRight,
  X,
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  Settings,
  MessageSquareHeart,
  Loader2,
} from "lucide-react";
import { searchGlobal } from "@/app/actions";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    deals: any[];
    leads: any[];
    contacts: any[];
    tasks: any[];
  }>({ deals: [], leads: [], contacts: [], tasks: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ deals: [], leads: [], contacts: [], tasks: [] });
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // parent handles toggle
      } else if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ deals: [], leads: [], contacts: [], tasks: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await searchGlobal(query);
        setResults(res);
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const hasQuery = query.trim().length > 0;
  const totalResults =
    results.deals.length +
    results.leads.length +
    results.contacts.length +
    results.tasks.length;

  const quickPages = [
    { label: "Overview", icon: LayoutDashboard, href: "/" },
    { label: "Pipeline Board", icon: KanbanSquare, href: "/pipeline" },
    { label: "All Deals", icon: Handshake, href: "/deals" },
    { label: "Leads Board", icon: Users, href: "/leads" },
    { label: "Contacts Directory", icon: Contact, href: "/contacts" },
    { label: "Tasks Manager", icon: CheckSquare, href: "/tasks" },
    { label: "Reports & Analytics", icon: BarChart3, href: "/reports" },
    { label: "Feedback", icon: MessageSquareHeart, href: "/feedback" },
    { label: "Settings", icon: Settings, href: "/settings/pipelines" },
  ];

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-20 px-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-border-strong bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-2/60">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search deals, leads, contacts, tasks, or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-text placeholder:text-text-faint outline-none font-medium"
          />
          {loading && <Loader2 size={16} className="animate-spin text-accent" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-text-faint hover:text-text p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="rounded border border-border-strong bg-surface px-2 py-0.5 text-[11px] font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/60">
          {hasQuery ? (
            <div>
              {loading && totalResults === 0 ? (
                <div className="p-8 text-center text-[13px] text-text-muted">
                  Searching workspace...
                </div>
              ) : totalResults === 0 ? (
                <div className="p-8 text-center text-[13px] text-text-muted">
                  No records matching &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {results.deals.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                        Deals
                      </div>
                      <div className="space-y-0.5">
                        {results.deals.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => navigateTo(`/deals/${d.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Handshake size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-text truncate group-hover:text-accent">
                                  {d.title}
                                </p>
                                <p className="text-[11.5px] text-text-muted truncate">
                                  {d.account?.name ?? "No Account"} · {d.stage?.name}
                                </p>
                              </div>
                            </div>
                            <span className="font-numeric text-[12.5px] font-medium text-text-muted shrink-0">
                              {d.currency} {d.value?.toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.leads.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                        Leads
                      </div>
                      <div className="space-y-0.5">
                        {results.leads.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => navigateTo(`/leads`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Users size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-text truncate group-hover:text-accent">
                                  {l.contactName}
                                </p>
                                <p className="text-[11.5px] text-text-muted truncate">
                                  {l.company ?? "Individual"} · Stage: {l.stage?.name ?? "Lead"}
                                </p>
                              </div>
                            </div>
                            <ArrowRight size={13} className="text-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.contacts.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                        Contacts
                      </div>
                      <div className="space-y-0.5">
                        {results.contacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => navigateTo(`/contacts`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <Contact size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-text truncate group-hover:text-accent">
                                  {c.name}
                                </p>
                                <p className="text-[11.5px] text-text-muted truncate">
                                  {c.title ? `${c.title} · ` : ""}{c.account?.name ?? c.email}
                                </p>
                              </div>
                            </div>
                            <ArrowRight size={13} className="text-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.tasks.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                        Tasks
                      </div>
                      <div className="space-y-0.5">
                        {results.tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => navigateTo(t.deal ? `/deals/${t.deal.id}` : `/tasks`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <CheckSquare size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[13px] font-medium truncate ${t.done ? "line-through text-text-faint" : "text-text"}`}>
                                  {t.title}
                                </p>
                                <p className="text-[11.5px] text-text-muted truncate">
                                  {t.deal ? `Deal: ${t.deal.title}` : t.lead ? `Lead: ${t.lead.contactName}` : "General task"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
                              {t.priority}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-text-faint uppercase tracking-wider">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-1">
                {quickPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.href}
                      onClick={() => navigateTo(page.href)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[13px] font-medium text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                    >
                      <Icon size={16} className="text-text-faint" />
                      <span>{page.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-surface-2/40 flex items-center justify-between text-[11.5px] text-text-faint">
          <span>Tip: Press ⌘K anywhere to open this search</span>
          <span>DEALNEST Sales Suite</span>
        </div>
      </div>
    </div>
  );
}

