"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Handshake,
  Users,
  User,
  Trash2,
  Edit2,
  MoreVertical,
} from "lucide-react";
import { toggleTask, deleteTask } from "@/app/actions";
import { TaskModal, TaskEntity } from "@/components/task-modal";
import { useToast } from "@/components/toast-context";

type TaskWithRelations = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: Date | string | null;
  done: boolean;
  dealId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  createdAt: Date | string;
  deal?: { id: string; title: string; account?: { name: string } | null } | null;
  lead?: { id: string; contactName: string; company?: string | null } | null;
  owner?: { id: string; name: string | null } | null;
};

export function TasksClient({
  initialTasks,
  deals,
  leads,
  members,
}: {
  initialTasks: TaskWithRelations[];
  deals: { id: string; title: string }[];
  leads: { id: string; contactName: string; company?: string | null }[];
  members: { id: string; name: string | null }[];
}) {
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "overdue" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskEntity | null>(null);

  // Keep local state in sync when server revalidates
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  // Stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter(
    (t) => !t.done && t.dueDate && new Date(t.dueDate).getTime() < todayStart
  ).length;
  const dueTodayCount = tasks.filter((t) => {
    if (t.done || !t.dueDate) return false;
    const time = new Date(t.dueDate).getTime();
    return time >= todayStart && time < todayEnd;
  }).length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchDeal = t.deal?.title.toLowerCase().includes(q);
        const matchLead = t.lead?.contactName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDeal && !matchLead) return false;
      }

      // Priority
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
        return false;
      }

      // Tabs
      const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;
      if (activeTab === "completed") return t.done;
      if (t.done) return false; // Other tabs only show incomplete

      if (activeTab === "today") {
        return dueTime !== null && dueTime >= todayStart && dueTime < todayEnd;
      }
      if (activeTab === "overdue") {
        return dueTime !== null && dueTime < todayStart;
      }
      if (activeTab === "upcoming") {
        return dueTime !== null && dueTime >= todayEnd;
      }

      return true; // "all"
    });
  }, [tasks, activeTab, priorityFilter, searchQuery, todayStart, todayEnd]);

  async function handleToggle(taskId: string, currentDone: boolean) {
    const nextDone = !currentDone;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: nextDone } : t))
    );

    try {
      await toggleTask(taskId, nextDone);
      toast.success(nextDone ? "Task marked as completed! 🎉" : "Task reopened.");
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: currentDone } : t))
      );
      toast.error("Failed to update task.");
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
      toast.success("Task deleted.");
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  }

  function handleEdit(task: TaskWithRelations) {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      done: task.done,
      dealId: task.dealId,
      leadId: task.leadId,
      ownerId: task.ownerId,
    });
    setModalOpen(true);
  }

  function handleNewTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-text-muted">Total Tasks</p>
            <p className="text-[22px] font-bold text-text mt-0.5">{totalCount}</p>
            <p className="text-[11px] text-text-faint mt-0.5">{completedCount} completed</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <CheckSquare size={18} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-amber-700">Due Today</p>
            <p className="text-[22px] font-bold text-amber-950 mt-0.5">{dueTodayCount}</p>
            <p className="text-[11px] text-amber-800/70 mt-0.5">Urgent attention</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-rose-700">Overdue</p>
            <p className="text-[22px] font-bold text-rose-950 mt-0.5">{overdueCount}</p>
            <p className="text-[11px] text-rose-800/70 mt-0.5">Past deadline</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-emerald-700">Completion Rate</p>
            <p className="text-[22px] font-bold text-emerald-950 mt-0.5">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </p>
            <p className="text-[11px] text-emerald-800/70 mt-0.5">Progress overall</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, Filters, New Task */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl w-full md:w-auto">
          {(
            [
              { id: "all", label: "All Open" },
              { id: "today", label: `Today (${dueTodayCount})` },
              { id: "upcoming", label: "Upcoming" },
              { id: "overdue", label: `Overdue (${overdueCount})` },
              { id: "completed", label: `Completed (${completedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-surface text-text shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Priority filter & Add Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-text-faint" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 py-1.5 text-[12.5px] text-text placeholder:text-text-faint outline-none focus:border-ink transition-colors"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] font-medium text-text outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={handleNewTask}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-ink-hover shadow-sm transition-all shrink-0"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task List Table / Rows */}
      <div className="card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare size={36} className="mx-auto mb-2 text-text-faint/60" />
            <p className="text-[14.5px] font-medium text-text">No tasks found</p>
            <p className="text-[12.5px] text-text-muted mt-1">
              {searchQuery || priorityFilter !== "ALL" || activeTab !== "all"
                ? "Try clearing filters to see more tasks."
                : "You have no tasks in this view. Great job!"}
            </p>
            <button
              onClick={handleNewTask}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-ink-hover transition-colors"
            >
              <Plus size={14} />
              <span>Create a task</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((t) => {
              const isOverdue =
                !t.done && t.dueDate && new Date(t.dueDate).getTime() < todayStart;
              const isDueToday =
                !t.done &&
                t.dueDate &&
                new Date(t.dueDate).getTime() >= todayStart &&
                new Date(t.dueDate).getTime() < todayEnd;

              return (
                <div
                  key={t.id}
                  className={`p-3.5 flex items-start gap-3.5 hover:bg-surface-2/60 transition-colors group ${
                    t.done ? "opacity-60 bg-surface-2/20" : ""
                  }`}
                >
                  {/* Custom animated checkbox */}
                  <button
                    onClick={() => handleToggle(t.id, t.done)}
                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                      t.done
                        ? "bg-accent border-accent text-white"
                        : "border-border-strong bg-surface hover:border-ink"
                    }`}
                  >
                    {t.done && <CheckCircle2 size={14} />}
                  </button>

                  {/* Main Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-[13.5px] font-medium leading-snug ${
                          t.done ? "line-through text-text-faint" : "text-text"
                        }`}
                      >
                        {t.title}
                      </p>

                      {/* Priority Tag */}
                      <span
                        className={`text-[10.5px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                          t.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : t.priority === "LOW"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-[12.5px] text-text-muted mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 mt-2 text-[12px] text-text-faint flex-wrap">
                      {/* Due date */}
                      {t.dueDate ? (
                        <span
                          suppressHydrationWarning
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? "text-rose-600"
                              : isDueToday
                                ? "text-amber-600"
                                : "text-text-muted"
                          }`}
                        >
                          <Calendar size={12} />
                          {new Date(t.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {isOverdue && " (Overdue)"}
                          {isDueToday && " (Today)"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-text-faint">
                          <Calendar size={12} /> No due date
                        </span>
                      )}

                      {/* Associated Deal */}
                      {t.deal && (
                        <Link
                          href={`/deals/${t.deal.id}`}
                          className="flex items-center gap-1 text-emerald-700 hover:underline font-medium"
                        >
                          <Handshake size={12} />
                          <span>Deal: {t.deal.title}</span>
                        </Link>
                      )}

                      {/* Associated Lead */}
                      {t.lead && (
                        <Link
                          href={`/leads`}
                          className="flex items-center gap-1 text-blue-700 hover:underline font-medium"
                        >
                          <Users size={12} />
                          <span>Lead: {t.lead.contactName}</span>
                        </Link>
                      )}

                      {/* Assignee */}
                      {t.owner && (
                        <span className="flex items-center gap-1 text-text-muted">
                          <User size={12} />
                          <span>{t.owner.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(t)}
                      title="Edit task"
                      className="p-1.5 rounded-lg text-text-faint hover:bg-surface hover:text-text transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      title="Delete task"
                      className="p-1.5 rounded-lg text-text-faint hover:bg-surface hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal Window */}
      {modalOpen && (
        <TaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          taskToEdit={editingTask}
          deals={deals}
          leads={leads}
          members={members}
        />
      )}
    </div>
  );
}

