"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckSquare, Calendar, AlertTriangle, ArrowRight } from "lucide-react";

export function NotificationsPopover({
  open,
  onClose,
  tasks = [],
}: {
  open: boolean;
  onClose: () => void;
  tasks?: any[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const now = new Date();
  const pendingTasks = tasks.filter((t) => !t.done);
  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < now.setHours(0, 0, 0, 0)
  );
  const todayTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div
      ref={ref}
      data-floating-menu="true"
      className="dropdown-menu floating-dropdown absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border px-1">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-text-muted" />
          <span className="text-[13px] font-semibold text-text">Notifications &amp; Tasks</span>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent">
          {pendingTasks.length} pending
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {overdueTasks.length > 0 && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-rose-700 mb-1">
              <AlertTriangle size={13} /> {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""}
            </div>
            <div className="space-y-1">
              {overdueTasks.slice(0, 2).map((t) => (
                <p key={t.id} className="text-[12px] text-rose-900 font-medium truncate">
                  • {t.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {todayTasks.length > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-700 mb-1">
              <Calendar size={13} /> Due Today ({todayTasks.length})
            </div>
            <div className="space-y-1">
              {todayTasks.slice(0, 2).map((t) => (
                <p key={t.id} className="text-[12px] text-amber-900 font-medium truncate">
                  • {t.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length === 0 ? (
          <div className="py-6 text-center text-[12.5px] text-text-muted">
            <CheckSquare size={24} className="mx-auto mb-1.5 text-accent opacity-60" />
            All caught up! No pending tasks.
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider px-1">
              Active To-dos
            </p>
            {pendingTasks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-2 transition-colors text-[12.5px]"
              >
                <span className="font-medium text-text truncate max-w-[190px]">{t.title}</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.5 rounded font-medium ${
                    t.priority === "HIGH"
                      ? "bg-rose-100 text-rose-700"
                      : t.priority === "LOW"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 mt-2 border-t border-border">
        <Link
          href="/tasks"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-surface-2 hover:bg-border text-[12px] font-medium text-text transition-colors"
        >
          <span>Open Tasks Manager</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

