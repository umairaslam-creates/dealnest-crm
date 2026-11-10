"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Handshake,
  ChevronsUpDown,
  Wand2,
  Filter,
  User,
  KanbanSquare,
  Package,
  Globe,
  Zap,
  Trophy,
  XCircle,
  FolderInput,
  Users,
  Box,
  Activity,
  ListChecks,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { ExportButton } from "@/components/app-shell";
import { toggleTask } from "@/app/actions";
import { useToast } from "@/components/toast-context";
import { TargetWithProgress } from "@/app/actions/targets";

export type TimeframeOption =
  | "ALL_TIME"
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "THIS_QUARTER"
  | "YTD"
  | "CUSTOM";

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  ALL_TIME: "All Time",
  TODAY: "Today",
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  THIS_MONTH: "This Month",
  THIS_QUARTER: "This Quarter (Q1 2026)",
  YTD: "Year to Date (2026)",
  CUSTOM: "Custom Date Range",
};

const TIMEFRAME_CONFIG: { id: TimeframeOption; label: string; icon: any }[] = [
  { id: "ALL_TIME", label: "All Time", icon: Globe },
  { id: "TODAY", label: "Today", icon: Calendar },
  { id: "LAST_7_DAYS", label: "Last 7 Days", icon: Zap },
  { id: "LAST_30_DAYS", label: "Last 30 Days", icon: Clock },
  { id: "THIS_MONTH", label: "This Month", icon: Calendar },
  { id: "THIS_QUARTER", label: "This Quarter (Q1 2026)", icon: TrendingUp },
  { id: "YTD", label: "Year to Date (2026)", icon: Sparkles },
  { id: "CUSTOM", label: "Custom Date Range", icon: SlidersHorizontal },
];

export type CardId =
  | "stats"
  | "daily_brief"
  | "upcoming_meetings"
  | "next_actions"
  | "recent_deals";

export type CardConfig = {
  id: CardId;
  title: string;
  description: string;
  defaultSpan: 1 | 2 | 3;
  currentSpan: 1 | 2 | 3;
  height?: number;
  visible: boolean;
};

const DEFAULT_CARDS: CardConfig[] = [
  {
    id: "stats",
    title: "Financial KPI Metrics",
    description: "Open pipeline, won revenue, active deals count, and win rate",
    defaultSpan: 3,
    currentSpan: 3,
    height: 140,
    visible: true,
  },
  {
    id: "daily_brief",
    title: "Daily Meeting Brief",
    description: "Yesterday's outcomes and today's customer conversations",
    defaultSpan: 2,
    currentSpan: 2,
    height: 360,
    visible: true,
  },
  {
    id: "upcoming_meetings",
    title: "Upcoming Meetings",
    description: "Scheduled customer meetings and preparation status",
    defaultSpan: 1,
    currentSpan: 1,
    height: 360,
    visible: true,
  },
  {
    id: "next_actions",
    title: "Recommended Next Steps",
    description: "Prioritized actions from meetings, replies and overdue tasks",
    defaultSpan: 3,
    currentSpan: 3,
    height: 320,
    visible: true,
  },
  {
    id: "recent_deals",
    title: "Active Opportunities",
    description: "Top deals currently open in negotiation stages",
    defaultSpan: 1,
    currentSpan: 1,
    height: 300,
    visible: true,
  },
];

const QUOTA_TARGET = 2_000_000; // SAR

export function DashboardClient({
  deals = [],
  leads = [],
  tasks = [],
  meetings = [],
  pipelines = [],
  members = [],
  products = [],
  targets = [],
}: {
  deals: any[];
  leads: any[];
  tasks: any[];
  meetings: any[];
  pipelines?: any[];
  members?: any[];
  products?: any[];
  targets?: TargetWithProgress[];
}) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  const activeRevenueTarget = useMemo(() => {
    return targets.find((t) => t.type === "REVENUE_QUOTA");
  }, [targets]);

  const activeQuotaTargetVal = activeRevenueTarget ? activeRevenueTarget.targetValue : 2_000_000;
  const activeQuotaCurrency = activeRevenueTarget ? activeRevenueTarget.currency : "SAR";
  const [timeframe, setTimeframe] = useState<TimeframeOption>("ALL_TIME");
  const [timeframeDropdown, setTimeframeDropdown] = useState(false);
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Advanced functional filters
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("ALL");
  const [pipelineDropdown, setPipelineDropdown] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("ALL");
  const [ownerDropdown, setOwnerDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("ALL");
  const [productDropdown, setProductDropdown] = useState(false);

  // Cards layout configuration
  const [cards, setCards] = useState<CardConfig[]>(DEFAULT_CARDS);
  const [customizing, setCustomizing] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);

  // Drag and drop state
  const [draggedCardIdx, setDraggedCardIdx] = useState<number | null>(null);
  const [dragOverCardIdx, setDragOverCardIdx] = useState<number | null>(null);

  // Drag-to-Resize State across all 8 handles (4 edges + 4 corners)
  const gridRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    id: CardId;
    handle: "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw";
    startX: number;
    startY: number;
    startSpan: 1 | 2 | 3;
    startHeight: number;
    liveSpan: 1 | 2 | 3;
    liveHeight: number;
    colWidth: number;
  } | null>(null);

  // Global Pointer Listeners for Live Drag-to-Resize
  useEffect(() => {
    if (!resizing) return;

    function handleMouseMove(e: MouseEvent) {
      setResizing((prev) => {
        if (!prev) return null;
        const deltaX = e.clientX - prev.startX;
        const deltaY = e.clientY - prev.startY;

        let nextSpan = prev.startSpan;
        const step = Math.max(90, prev.colWidth * 0.38);

        if (["e", "se", "ne"].includes(prev.handle)) {
          if (deltaX > step && prev.startSpan < 3) {
            const added = Math.ceil((deltaX - 15) / prev.colWidth);
            nextSpan = Math.min(3, prev.startSpan + added) as 1 | 2 | 3;
          } else if (deltaX < -step && prev.startSpan > 1) {
            const removed = Math.ceil((-deltaX - 15) / prev.colWidth);
            nextSpan = Math.max(1, prev.startSpan - removed) as 1 | 2 | 3;
          }
        } else if (["w", "sw", "nw"].includes(prev.handle)) {
          if (-deltaX > step && prev.startSpan < 3) {
            const added = Math.ceil((-deltaX - 15) / prev.colWidth);
            nextSpan = Math.min(3, prev.startSpan + added) as 1 | 2 | 3;
          } else if (-deltaX < -step && prev.startSpan > 1) {
            const removed = Math.ceil((deltaX - 15) / prev.colWidth);
            nextSpan = Math.max(1, prev.startSpan - removed) as 1 | 2 | 3;
          }
        }

        let nextHeight = prev.startHeight;
        if (["s", "se", "sw"].includes(prev.handle)) {
          nextHeight = Math.max(180, Math.min(750, prev.startHeight + deltaY));
        } else if (["n", "ne", "nw"].includes(prev.handle)) {
          nextHeight = Math.max(180, Math.min(750, prev.startHeight - deltaY));
        }

        return {
          ...prev,
          liveSpan: nextSpan,
          liveHeight: Math.round(nextHeight),
        };
      });
    }

    function handleMouseUp() {
      if (!resizing) return;
      const { id, liveSpan, liveHeight } = resizing;
      setCards((prevCards) => {
        const next = prevCards.map((c) =>
          c.id === id ? { ...c, currentSpan: liveSpan, height: liveHeight } : c
        );
        saveCards(next);
        return next;
      });
      setResizing(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  // Click outside to close any open filter dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setTimeframeDropdown(false);
        setPipelineDropdown(false);
        setOwnerDropdown(false);
        setStatusDropdown(false);
        setProductDropdown(false);
      }
    }
    if (timeframeDropdown || pipelineDropdown || ownerDropdown || statusDropdown || productDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [timeframeDropdown, pipelineDropdown, ownerDropdown, statusDropdown, productDropdown]);

  function handleResizeStart(
    e: React.MouseEvent,
    card: CardConfig,
    handle: "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw"
  ) {
    e.preventDefault();
    e.stopPropagation();
    const gridWidth = gridRef.current?.getBoundingClientRect().width || 1200;
    const colWidth = gridWidth / 3;
    const startHeight = card.height || (card.id === "stats" ? 140 : 300);

    setResizing({
      id: card.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startSpan: card.currentSpan,
      startHeight,
      liveSpan: card.currentSpan,
      liveHeight: startHeight,
      colWidth,
    });
  }

  function setCardSpan(cardId: CardId, span: 1 | 2 | 3) {
    const next = cards.map((c) => (c.id === cardId ? { ...c, currentSpan: span } : c));
    saveCards(next);
  }

  function cycleCardHeight(cardId: CardId) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c;
      const currentH = c.height || 300;
      let nextH = 300;
      if (currentH < 260) nextH = 330;
      else if (currentH < 380) nextH = 460;
      else nextH = 240;
      return { ...c, height: nextH };
    });
    saveCards(next);
    toast.info("Card height adjusted.");
  }

  function autoFitCard(cardId: CardId) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const nextSpan = card.currentSpan === 3 ? 1 : 3;
    setCardSpan(cardId, nextSpan as 1 | 2 | 3);
    toast.info(`Card set to ${nextSpan === 3 ? "Full Row (3 Columns)" : "1 Column"}`);
  }

  function autoFitAllGaps() {
    const visible = cards.filter((c) => c.visible);
    const hasOneCol = visible.some((c) => c.currentSpan === 1);
    const updated = cards.map((c) => {
      if (!c.visible) return c;
      if (c.currentSpan === 2 && !hasOneCol) {
        return { ...c, currentSpan: 3 as const };
      }
      return c;
    });
    saveCards(updated);
    toast.success("Auto-packed: empty gaps filled.");
  }

  // Load saved customization
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("mytm_dashboard_customization_v2");
      if (saved) {
        const parsed: { id: CardId; currentSpan: 1 | 2 | 3; height?: number; visible: boolean }[] = JSON.parse(saved);
        const merged = parsed
          .map((item) => {
            const def = DEFAULT_CARDS.find((d) => d.id === item.id);
            if (!def) return null;
            return {
              ...def,
              currentSpan: item.currentSpan,
              height: item.height || def.height || 300,
              visible: item.visible,
            };
          })
          .filter(Boolean) as CardConfig[];

        // Append any new card defaults
        DEFAULT_CARDS.forEach((d) => {
          if (!merged.some((m) => m.id === d.id)) merged.push(d);
        });
        setCards(merged);
      }
    } catch (e) {}
  }, []);

  function saveCards(newCards: CardConfig[]) {
    setCards(newCards);
    try {
      const state = newCards.map((c) => ({
        id: c.id,
        currentSpan: c.currentSpan,
        height: c.height,
        visible: c.visible,
      }));
      localStorage.setItem("mytm_dashboard_customization_v2", JSON.stringify(state));
    } catch (e) {}
  }

  // Drag and drop card reordering
  function handleDragStart(index: number) {
    setDraggedCardIdx(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragOverCardIdx !== index) {
      setDragOverCardIdx(index);
    }
  }

  function handleDrop(index: number) {
    if (draggedCardIdx === null || draggedCardIdx === index) {
      setDraggedCardIdx(null);
      setDragOverCardIdx(null);
      return;
    }
    const next = [...cards];
    const [removed] = next.splice(draggedCardIdx, 1);
    next.splice(index, 0, removed);
    saveCards(next);
    setDraggedCardIdx(null);
    setDragOverCardIdx(null);
    toast.info("Dashboard layout updated.");
  }

  function toggleExpandCard(cardId: CardId) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c;
      const nextSpan = c.currentSpan === 3 ? 1 : ((c.currentSpan + 1) as 1 | 2 | 3);
      return { ...c, currentSpan: nextSpan };
    });
    saveCards(next);
  }

  function hideCard(cardId: CardId) {
    const next = cards.map((c) => (c.id === cardId ? { ...c, visible: false } : c));
    saveCards(next);
    toast.info("Widget removed. You can re-add it from '+ Add Widget'.");
  }

  function toggleCardVisibility(cardId: CardId) {
    const next = cards.map((c) => (c.id === cardId ? { ...c, visible: !c.visible } : c));
    saveCards(next);
  }

  function resetLayout() {
    saveCards(DEFAULT_CARDS);
    toast.success("Dashboard reset to default layout.");
  }

  function applyPreset(preset: "executive" | "revenue" | "operations") {
    let next = [...DEFAULT_CARDS];
    if (preset === "executive") {
      next = next.map((c) => ({
        ...c,
        visible: ["stats", "daily_brief", "upcoming_meetings", "next_actions"].includes(c.id),
      }));
    } else if (preset === "revenue") {
      next = next.map((c) => ({
        ...c,
        visible: ["stats", "next_actions", "recent_deals"].includes(c.id),
      }));
    } else {
      next = next.map((c) => ({ ...c, visible: true }));
    }
    saveCards(next);
    toast.success(`Applied ${preset.toUpperCase()} preset.`);
  }

  // Multi-dimensional filtering logic
  const now = new Date();

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // 1. Date timeframe filter
      if (timeframe === "CUSTOM") {
        const dealTime = new Date(d.createdAt).getTime();
        if (customFrom) {
          const fromTime = new Date(customFrom).setHours(0, 0, 0, 0);
          if (dealTime < fromTime) return false;
        }
        if (customTo) {
          const toTime = new Date(customTo).setHours(23, 59, 59, 999);
          if (dealTime > toTime) return false;
        }
      } else if (timeframe !== "ALL_TIME") {
        let cutoffDate = new Date();
        if (timeframe === "TODAY") {
          cutoffDate.setHours(0, 0, 0, 0);
        } else if (timeframe === "LAST_7_DAYS") {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (timeframe === "LAST_30_DAYS") {
          cutoffDate.setDate(now.getDate() - 30);
        } else if (timeframe === "THIS_MONTH") {
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeframe === "THIS_QUARTER") {
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          cutoffDate = new Date(now.getFullYear(), quarterMonth, 1);
        } else if (timeframe === "YTD") {
          cutoffDate = new Date(now.getFullYear(), 0, 1);
        }
        if (new Date(d.createdAt).getTime() < cutoffDate.getTime()) return false;
      }

      // 2. Pipeline filter
      if (selectedPipelineId !== "ALL" && d.pipelineId !== selectedPipelineId) {
        return false;
      }

      // 3. Sales Rep / Owner filter
      if (selectedOwnerId !== "ALL" && d.ownerId !== selectedOwnerId) {
        return false;
      }

      // 4. Deal status filter
      if (selectedStatus !== "ALL" && d.status !== selectedStatus) {
        return false;
      }

      // 5. Product filter
      if (selectedProductId !== "ALL" && d.productId !== selectedProductId) {
        return false;
      }

      return true;
    });
  }, [
    deals,
    timeframe,
    customFrom,
    customTo,
    selectedPipelineId,
    selectedOwnerId,
    selectedStatus,
    selectedProductId,
  ]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Date filter
      if (timeframe === "CUSTOM") {
        const leadTime = new Date(l.createdAt).getTime();
        if (customFrom) {
          const fromTime = new Date(customFrom).setHours(0, 0, 0, 0);
          if (leadTime < fromTime) return false;
        }
        if (customTo) {
          const toTime = new Date(customTo).setHours(23, 59, 59, 999);
          if (leadTime > toTime) return false;
        }
      } else if (timeframe !== "ALL_TIME") {
        let cutoffDate = new Date();
        if (timeframe === "TODAY") cutoffDate.setHours(0, 0, 0, 0);
        else if (timeframe === "LAST_7_DAYS") cutoffDate.setDate(now.getDate() - 7);
        else if (timeframe === "LAST_30_DAYS") cutoffDate.setDate(now.getDate() - 30);
        else if (timeframe === "THIS_MONTH") cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (timeframe === "THIS_QUARTER") {
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          cutoffDate = new Date(now.getFullYear(), quarterMonth, 1);
        } else if (timeframe === "YTD") cutoffDate = new Date(now.getFullYear(), 0, 1);
        if (new Date(l.createdAt).getTime() < cutoffDate.getTime()) return false;
      }

      // Owner filter
      if (selectedOwnerId !== "ALL" && l.ownerId !== selectedOwnerId) return false;
      return true;
    });
  }, [leads, timeframe, customFrom, customTo, selectedOwnerId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedOwnerId !== "ALL" && t.ownerId !== selectedOwnerId) return false;
      return true;
    });
  }, [tasks, selectedOwnerId]);

  const activeFilterCount =
    (timeframe !== "ALL_TIME" ? 1 : 0) +
    (selectedPipelineId !== "ALL" ? 1 : 0) +
    (selectedOwnerId !== "ALL" ? 1 : 0) +
    (selectedStatus !== "ALL" ? 1 : 0) +
    (selectedProductId !== "ALL" ? 1 : 0);

  function resetAllFilters() {
    setTimeframe("ALL_TIME");
    setCustomFrom("");
    setCustomTo("");
    setSelectedPipelineId("ALL");
    setSelectedOwnerId("ALL");
    setSelectedStatus("ALL");
    setSelectedProductId("ALL");
    toast.info("All dashboard filters reset to default.");
  }

  // Derived metrics
  const openDeals = filteredDeals.filter((d) => d.status === "OPEN");
  const wonDeals = filteredDeals.filter((d) => d.status === "WON");
  const lostDeals = filteredDeals.filter((d) => d.status === "LOST");
  const closedCount = wonDeals.length + lostDeals.length;

  const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const yesterdayMeetings = meetings.filter((meeting) => {
    const start = new Date(meeting.startTime);
    return start >= startOfYesterday && start < startOfToday && meeting.status !== "CANCELLED";
  });
  const todayMeetings = meetings.filter((meeting) => {
    const start = new Date(meeting.startTime);
    return start >= startOfToday && start < startOfTomorrow && meeting.status !== "CANCELLED";
  });
  const upcomingMeetings = meetings
    .filter((meeting) => new Date(meeting.startTime) >= startOfTomorrow && meeting.status !== "CANCELLED")
    .slice(0, 6);
  const openTasks = filteredTasks.filter((task) => !task.done);
  const todayStart = startOfToday.getTime();

  const stats = [
    {
      label: "Open Pipeline",
      value: `SAR ${(openPipelineValue / 1000).toFixed(0)}K`,
      sub: `Across ${openDeals.length} active deal${openDeals.length === 1 ? "" : "s"}`,
      delta: `${openDeals.length}`,
      up: true,
      href: "/pipeline",
    },
    {
      label: "Won Revenue",
      value: `SAR ${(wonValue / 1000).toFixed(0)}K`,
      sub: `${wonDeals.length} deal${wonDeals.length === 1 ? "" : "s"} closed`,
      delta: `${wonDeals.length}`,
      up: true,
      href: "/deals",
    },
    {
      label: "Active Deals",
      value: String(openDeals.length),
      sub: `${filteredDeals.length} total opportunities`,
      delta: `${openDeals.length}`,
      up: true,
      href: "/deals",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: `${wonDeals.length} won / ${lostDeals.length} lost`,
      delta: `${closedCount}`,
      up: winRate >= 50,
      href: "/reports",
    },
  ];

  // Lead sources
  const bySource = new Map<string, number>();
  for (const l of filteredLeads) {
    const key = l.source ?? "Direct Outreach";
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }
  const sourceEntries = [...bySource.entries()];

  // Pipeline growth trend calculation
  const WEEKS = 8;
  const weekStart = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay();
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - day);
    return copy;
  };
  const buckets: { start: Date; value: number }[] = [];
  const firstWeek = weekStart(now);
  firstWeek.setDate(firstWeek.getDate() - 7 * (WEEKS - 1));
  for (let i = 0; i < WEEKS; i++) {
    const start = new Date(firstWeek);
    start.setDate(start.getDate() + i * 7);
    buckets.push({ start, value: 0 });
  }
  for (const d of filteredDeals) {
    const created = weekStart(new Date(d.createdAt));
    const bucket = buckets.find((b) => b.start.getTime() === created.getTime());
    if (bucket) bucket.value += d.value ?? 0;
    else if (created.getTime() < firstWeek.getTime()) buckets[0].value += d.value ?? 0;
  }
  let running = 0;
  const pipelineTrend = buckets.map((b) => {
    running += b.value;
    return {
      day: b.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value: running,
    };
  });

  const suggestedActions = openTasks
    .sort((a, b) => {
      const priorityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const priorityDiff = (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.dueDate || 8640000000000000).getTime() - new Date(b.dueDate || 8640000000000000).getTime();
    })
    .slice(0, 8);

  const meetingAccount = (meeting: any) =>
    meeting.contact?.account?.name || meeting.contact?.name || meeting.deal?.title || meeting.title;

  const meetingOutcome = (meeting: any) => {
    const description = String(meeting.description || "");
    const outcome = description.match(/Outcome:\s*([^\n]+)/i)?.[1];
    return outcome || (meeting.status === "COMPLETED" ? "Meeting completed; follow-up required." : "Prepare agenda and confirm attendees.");
  };

  // Helper function to map span to Tailwind grid classes
  function getSpanClass(span: 1 | 2 | 3) {
    if (span === 3) return "col-span-1 md:col-span-3";
    if (span === 2) return "col-span-1 md:col-span-2";
    return "col-span-1";
  }

  return (
    <div className="space-y-4">
      {/* Top Customization & Filter Control Header */}
      <div
        ref={filterBarRef}
        className={`relative card p-3 flex flex-col lg:flex-row items-center justify-between gap-2.5 shadow-sm select-none border border-border bg-surface-2/80 backdrop-blur-xl ${
          timeframeDropdown || pipelineDropdown || ownerDropdown || statusDropdown || productDropdown
            ? "z-50"
            : "z-30"
        }`}
      >
        {/* Left: Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* 1. Date Range Dropdown */}
          <div className={`relative ${timeframeDropdown ? "z-50" : "z-10"}`}>
            <button
              onClick={() => {
                setTimeframeDropdown(!timeframeDropdown);
                setPipelineDropdown(false);
                setOwnerDropdown(false);
                setStatusDropdown(false);
                setProductDropdown(false);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-2xs transition-colors cursor-pointer ${
                timeframe !== "ALL_TIME"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <Calendar size={13} className="text-brand shrink-0" />
              <span>
                {timeframe === "CUSTOM" && customFrom && customTo
                  ? `${customFrom} → ${customTo}`
                  : TIMEFRAME_LABELS[timeframe]}
              </span>
              <ChevronDown size={12} className="text-text-muted shrink-0" />
            </button>

            {timeframeDropdown && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute left-0 top-full mt-1.5 z-[100] w-64 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                onClick={() => setTimeframeDropdown(false)}
              >
                {TIMEFRAME_CONFIG.map((item) => {
                  const Icon = item.icon;
                  const isSelected = timeframe === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTimeframe(item.id);
                        if (item.id !== "CUSTOM") {
                          toast.info(`Filtered dashboard to ${item.label}`);
                        }
                      }}
                      className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "active-selected bg-brand text-white font-bold"
                          : "text-text hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={14} className={isSelected ? "text-white shrink-0" : "text-brand shrink-0"} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isSelected && <Check size={12} className="text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1b. Inline Custom Date Inputs (when CUSTOM is chosen) */}
          {timeframe === "CUSTOM" && (
            <div className="flex items-center gap-1.5 rounded-xl border border-brand/40 bg-surface px-2.5 py-1 text-[11px] shadow-2xs">
              <span className="font-semibold text-text-muted">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-text font-bold focus:outline-none text-[11px] cursor-pointer"
              />
              <span className="font-semibold text-text-muted">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-text font-bold focus:outline-none text-[11px] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomFrom("");
                  setCustomTo("");
                  setTimeframe("ALL_TIME");
                }}
                className="text-text-faint hover:text-text ml-1"
                title="Clear custom dates"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* 2. Pipeline Filter Dropdown */}
          <div className={`relative ${pipelineDropdown ? "z-50" : "z-10"}`}>
            <button
              onClick={() => {
                setPipelineDropdown(!pipelineDropdown);
                setTimeframeDropdown(false);
                setOwnerDropdown(false);
                setStatusDropdown(false);
                setProductDropdown(false);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-2xs transition-colors cursor-pointer ${
                selectedPipelineId !== "ALL"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <KanbanSquare size={13} className="text-brand shrink-0" />
              <span>
                {selectedPipelineId === "ALL"
                  ? "All Pipelines"
                  : pipelines.find((p) => p.id === selectedPipelineId)?.name || "Pipeline"}
              </span>
              <ChevronDown size={12} className="text-text-muted shrink-0" />
            </button>

            {pipelineDropdown && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute left-0 top-full mt-1.5 z-[100] w-60 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                onClick={() => setPipelineDropdown(false)}
              >
                <button
                  onClick={() => setSelectedPipelineId("ALL")}
                  className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                    selectedPipelineId === "ALL"
                      ? "active-selected bg-brand text-white font-bold"
                      : "text-text hover:bg-brand/10 hover:text-brand"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <KanbanSquare size={14} className={selectedPipelineId === "ALL" ? "text-white shrink-0" : "text-brand shrink-0"} />
                    <span className="truncate">All Pipelines</span>
                  </div>
                  {selectedPipelineId === "ALL" && <Check size={12} className="text-white shrink-0" />}
                </button>
                {pipelines.map((p) => {
                  const isSelected = selectedPipelineId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPipelineId(p.id);
                        toast.info(`Filtered to ${p.name}`);
                      }}
                      className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "active-selected bg-brand text-white font-bold"
                          : "text-text hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderInput size={14} className={isSelected ? "text-white shrink-0" : "text-brand shrink-0"} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {isSelected && <Check size={12} className="text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Sales Rep / Owner Filter Dropdown */}
          <div className={`relative ${ownerDropdown ? "z-50" : "z-10"}`}>
            <button
              onClick={() => {
                setOwnerDropdown(!ownerDropdown);
                setTimeframeDropdown(false);
                setPipelineDropdown(false);
                setStatusDropdown(false);
                setProductDropdown(false);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-2xs transition-colors cursor-pointer ${
                selectedOwnerId !== "ALL"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <User size={13} className="text-brand shrink-0" />
              <span>
                {selectedOwnerId === "ALL"
                  ? "All Sales Reps"
                  : members.find((m) => m.id === selectedOwnerId)?.name || "Owner"}
              </span>
              <ChevronDown size={12} className="text-text-muted shrink-0" />
            </button>

            {ownerDropdown && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute left-0 top-full mt-1.5 z-[100] w-60 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                onClick={() => setOwnerDropdown(false)}
              >
                <button
                  onClick={() => setSelectedOwnerId("ALL")}
                  className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                    selectedOwnerId === "ALL"
                      ? "active-selected bg-brand text-white font-bold"
                      : "text-text hover:bg-brand/10 hover:text-brand"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users size={14} className={selectedOwnerId === "ALL" ? "text-white shrink-0" : "text-brand shrink-0"} />
                    <span className="truncate">All Sales Reps</span>
                  </div>
                  {selectedOwnerId === "ALL" && <Check size={12} className="text-white shrink-0" />}
                </button>
                {members.map((m) => {
                  const isSelected = selectedOwnerId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedOwnerId(m.id);
                        toast.info(`Filtered to ${m.name}`);
                      }}
                      className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "active-selected bg-brand text-white font-bold"
                          : "text-text hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <User size={14} className={isSelected ? "text-white shrink-0" : "text-brand shrink-0"} />
                        <span className="truncate">{m.name}</span>
                      </div>
                      {isSelected && <Check size={12} className="text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Deal Status Filter Dropdown */}
          <div className={`relative ${statusDropdown ? "z-50" : "z-10"}`}>
            <button
              onClick={() => {
                setStatusDropdown(!statusDropdown);
                setTimeframeDropdown(false);
                setPipelineDropdown(false);
                setOwnerDropdown(false);
                setProductDropdown(false);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-2xs transition-colors cursor-pointer ${
                selectedStatus !== "ALL"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
              }`}
            >
              <Activity size={13} className="text-brand shrink-0" />
              <span>
                {selectedStatus === "ALL"
                  ? "All Statuses"
                  : selectedStatus === "OPEN"
                  ? "Open Deals"
                  : selectedStatus === "WON"
                  ? "Closed Won"
                  : "Lost Deals"}
              </span>
              <ChevronDown size={12} className="text-text-muted shrink-0" />
            </button>

            {statusDropdown && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute left-0 top-full mt-1.5 z-[100] w-52 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                onClick={() => setStatusDropdown(false)}
              >
                {[
                  { id: "ALL", label: "All Statuses", icon: Activity },
                  { id: "OPEN", label: "Open Deals", icon: Clock },
                  { id: "WON", label: "Closed Won", icon: Trophy },
                  { id: "LOST", label: "Lost Deals", icon: XCircle },
                ].map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStatus(s.id);
                        toast.info(`Filtered to ${s.label}`);
                      }}
                      className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "active-selected bg-brand text-white font-bold"
                          : "text-text hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={14} className={isSelected ? "text-white shrink-0" : "text-brand shrink-0"} />
                        <span className="truncate">{s.label}</span>
                      </div>
                      {isSelected && <Check size={12} className="text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Product Filter Dropdown (if products provided) */}
          {products.length > 0 && (
            <div className={`relative ${productDropdown ? "z-50" : "z-10"}`}>
              <button
                onClick={() => {
                  setProductDropdown(!productDropdown);
                  setTimeframeDropdown(false);
                  setPipelineDropdown(false);
                  setOwnerDropdown(false);
                  setStatusDropdown(false);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-2xs transition-colors cursor-pointer ${
                  selectedProductId !== "ALL"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
                }`}
              >
                <Package size={13} className="text-brand shrink-0" />
                <span>
                  {selectedProductId === "ALL"
                    ? "All Products"
                    : products.find((p) => p.id === selectedProductId)?.name || "Product"}
                </span>
                <ChevronDown size={12} className="text-text-muted shrink-0" />
              </button>

              {productDropdown && (
                <div
                  data-floating-menu="true"
                  style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                  className="dropdown-menu floating-dropdown absolute left-0 top-full mt-1.5 z-[100] w-60 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                  onClick={() => setProductDropdown(false)}
                >
                  <button
                    onClick={() => setSelectedProductId("ALL")}
                    className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                      selectedProductId === "ALL"
                        ? "active-selected bg-brand text-white font-bold"
                        : "text-text hover:bg-brand/10 hover:text-brand"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Package size={14} className={selectedProductId === "ALL" ? "text-white shrink-0" : "text-brand shrink-0"} />
                      <span className="truncate">All Products</span>
                    </div>
                    {selectedProductId === "ALL" && <Check size={12} className="text-white shrink-0" />}
                  </button>
                  {products.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedProductId(prod.id);
                          toast.info(`Filtered to ${prod.name}`);
                        }}
                        className={`menu-option w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "active-selected bg-brand text-white font-bold"
                            : "text-text hover:bg-brand/10 hover:text-brand"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Box size={14} className={isSelected ? "text-white shrink-0" : "text-brand shrink-0"} />
                          <span className="truncate">{prod.name}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active Filter Indicator & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 pl-1">
              <span className="rounded-full bg-brand/15 border border-brand/30 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </span>
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-text-muted hover:text-rose-500 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
                title="Reset all filters to default"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Quick Presets Pills */}
          <div className="hidden xl:flex items-center gap-1 bg-surface border border-border p-1 rounded-xl shadow-2xs ml-1">
            <button
              onClick={() => applyPreset("executive")}
              className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all cursor-pointer"
            >
              Executive
            </button>
            <button
              onClick={() => applyPreset("revenue")}
              className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all cursor-pointer"
            >
              Revenue
            </button>
            <button
              onClick={() => applyPreset("operations")}
              className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all cursor-pointer"
            >
              All Widgets
            </button>
          </div>
        </div>

        {/* Right: Customization Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          <ExportButton label="Export Dashboard" />

          {/* Auto-Pack Gaps Button */}
          <button
            onClick={autoFitAllGaps}
            title="Auto-pack layout: expands single widgets to eliminate empty spaces"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-text hover:border-brand/40 hover:bg-surface-2 shadow-sm transition-colors cursor-pointer"
          >
            <Wand2 size={13} className="text-brand shrink-0" />
            <span>Auto-Pack Gaps</span>
          </button>

          {/* Add Widget Button */}
          <button
            onClick={() => setWidgetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-text hover:border-brand/40 hover:bg-surface-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={13} className="text-brand shrink-0" />
            <span>Add Widget</span>
          </button>

          {/* Reorder / Customization Mode Toggle */}
          <button
            onClick={() => {
              setCustomizing(!customizing);
              if (!customizing) {
                toast.info("Customization active: drag corners/edges to resize, or drag to reorder.");
              }
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all shadow-sm cursor-pointer ${
              customizing
                ? "bg-brand text-white shadow-brand/30 ring-2 ring-brand/50"
                : "border border-border bg-surface text-text hover:border-brand/40 hover:bg-surface-2"
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>{customizing ? "Finish Editing" : "Customize"}</span>
          </button>

          {customizing && (
            <button
              onClick={resetLayout}
              title="Reset to default layout"
              className="p-1.5 rounded-xl border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 shadow-sm cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Customizable Drag-and-Drop & Resizable Card Grid with Dense Auto-Flow */}
      <div
        ref={gridRef}
        className="relative z-0 grid grid-cols-1 md:grid-cols-3 gap-3.5 pb-6 [grid-auto-flow:dense]"
      >
        {cards
          .filter((c) => c.visible)
          .map((cardConfig, index) => {
            const isResizingThis = resizing?.id === cardConfig.id;
            const effectiveSpan = isResizingThis ? resizing.liveSpan : cardConfig.currentSpan;
            const effectiveHeight = isResizingThis
              ? resizing.liveHeight
              : cardConfig.height || (cardConfig.id === "stats" ? 140 : 300);
            const isDragging = draggedCardIdx === index;
            const isOver = dragOverCardIdx === index;

            return (
              <div
                key={cardConfig.id}
                draggable={customizing && !resizing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                className={`relative group/card transition-all duration-200 ${getSpanClass(
                  effectiveSpan
                )} ${isDragging ? "opacity-40 scale-95" : ""} ${
                  isOver ? "ring-2 ring-emerald-500 rounded-2xl bg-emerald-50/20" : ""
                } ${
                  isResizingThis
                    ? "ring-2 ring-emerald-400 shadow-2xl z-30 select-none scale-[1.008]"
                    : ""
                }`}
              >
                {/* Live Resize Dimension Indicator */}
                {isResizingThis && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xl flex items-center gap-1.5 pointer-events-none animate-in fade-in">
                    <Sparkles size={12} className="text-emerald-200" />
                    <span>
                      {effectiveSpan} Col{effectiveSpan > 1 ? "s" : ""} (
                      {effectiveSpan === 3
                        ? "Full Row"
                        : `${Math.round((effectiveSpan / 3) * 100)}% width`}
                      ) × {effectiveHeight}px
                    </span>
                  </div>
                )}

                {/* 8-Direction Drag-to-Resize Handles (Corners & Edges) - ONLY in Editable Mode */}
                {customizing && (
                  <div className="animate-in fade-in duration-150">
                    {/* East (Right Edge) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "e")}
                      title="Drag right edge to expand or shrink width"
                      className="absolute -right-1 top-4 bottom-4 w-3.5 cursor-ew-resize z-20 group/h flex items-center justify-center hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-r-xl transition-colors"
                    >
                      <div className="w-1 h-8 rounded-full bg-white/40 group-hover/h:bg-emerald-400 transition-all shadow-sm" />
                    </div>

                    {/* West (Left Edge) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "w")}
                      title="Drag left edge to expand or shrink width"
                      className="absolute -left-1 top-4 bottom-4 w-3.5 cursor-ew-resize z-20 group/h flex items-center justify-center hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-l-xl transition-colors"
                    >
                      <div className="w-1 h-8 rounded-full bg-white/40 group-hover/h:bg-emerald-400 transition-all shadow-sm" />
                    </div>

                    {/* South (Bottom Edge) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "s")}
                      title="Drag bottom edge to adjust height"
                      className="absolute -bottom-1 left-4 right-4 h-3.5 cursor-ns-resize z-20 group/h flex items-center justify-center hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-b-xl transition-colors"
                    >
                      <div className="h-1 w-12 rounded-full bg-white/40 group-hover/h:bg-emerald-400 transition-all shadow-sm" />
                    </div>

                    {/* North (Top Edge) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "n")}
                      title="Drag top edge to adjust height"
                      className="absolute -top-1 left-4 right-4 h-3.5 cursor-ns-resize z-20 group/h flex items-center justify-center hover:bg-emerald-500/20 active:bg-emerald-500/40 rounded-t-xl transition-colors"
                    >
                      <div className="h-1 w-12 rounded-full bg-white/40 group-hover/h:bg-emerald-400 transition-all shadow-sm" />
                    </div>

                    {/* South-East (Bottom-Right Corner) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "se")}
                      title="Drag corner to adjust width & height"
                      className="absolute -bottom-1 -right-1 w-6 h-6 cursor-nwse-resize z-30 group/h flex items-end justify-end p-1 hover:scale-125 transition-transform"
                    >
                      <div className="w-2.5 h-2.5 rounded-br-sm border-r-2 border-b-2 border-white/70 group-hover/h:border-emerald-400 shadow-md" />
                    </div>

                    {/* South-West (Bottom-Left Corner) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "sw")}
                      title="Drag corner to adjust width & height"
                      className="absolute -bottom-1 -left-1 w-6 h-6 cursor-nesw-resize z-30 group/h flex items-end justify-start p-1 hover:scale-125 transition-transform"
                    >
                      <div className="w-2.5 h-2.5 rounded-bl-sm border-l-2 border-b-2 border-white/70 group-hover/h:border-emerald-400 shadow-md" />
                    </div>

                    {/* North-East (Top-Right Corner) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "ne")}
                      title="Drag corner to adjust width & height"
                      className="absolute -top-1 -right-1 w-6 h-6 cursor-nesw-resize z-30 group/h flex items-start justify-end p-1 hover:scale-125 transition-transform"
                    >
                      <div className="w-2.5 h-2.5 rounded-tr-sm border-r-2 border-t-2 border-white/70 group-hover/h:border-emerald-400 shadow-md" />
                    </div>

                    {/* North-West (Top-Left Corner) */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cardConfig, "nw")}
                      title="Drag corner to adjust width & height"
                      className="absolute -top-1 -left-1 w-6 h-6 cursor-nwse-resize z-30 group/h flex items-start justify-start p-1 hover:scale-125 transition-transform"
                    >
                      <div className="w-2.5 h-2.5 rounded-tl-sm border-l-2 border-t-2 border-white/70 group-hover/h:border-emerald-400 shadow-md" />
                    </div>
                  </div>
                )}

                {/* Card Action & Resize Toolbar - ONLY in Editable Mode */}
                {customizing && (
                  <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl text-white shadow-xl transition-all duration-200 border border-white/10 animate-in fade-in">
                    {/* Drag to reorder */}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-white"
                      title="Drag to reposition widget"
                    >
                      <GripVertical size={13} />
                    </div>

                    {/* 1x, 2x, 3x Span selector pills */}
                    <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        onClick={() => setCardSpan(cardConfig.id, 1)}
                        title="Compact width (1 Column)"
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          effectiveSpan === 1
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        1x
                      </button>
                      <button
                        onClick={() => setCardSpan(cardConfig.id, 2)}
                        title="Standard width (2 Columns)"
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          effectiveSpan === 2
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        2x
                      </button>
                      <button
                        onClick={() => setCardSpan(cardConfig.id, 3)}
                        title="Full row width (3 Columns)"
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          effectiveSpan === 3
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        3x
                      </button>
                    </div>

                    {/* Auto-Fit / Fill Row */}
                    <button
                      onClick={() => autoFitCard(cardConfig.id)}
                      title="Auto-fit: expand to fill remaining row space"
                      className="p-1 text-slate-300 hover:text-emerald-400 hover:bg-white/10 rounded"
                    >
                      <Maximize2 size={12} />
                    </button>

                    {/* Cycle Height */}
                    <button
                      onClick={() => cycleCardHeight(cardConfig.id)}
                      title="Adjust height (Compact, Standard, Tall)"
                      className="p-1 text-slate-300 hover:text-cyan-400 hover:bg-white/10 rounded"
                    >
                      <ChevronsUpDown size={12} />
                    </button>

                    {/* Remove Widget */}
                    <button
                      onClick={() => hideCard(cardConfig.id)}
                      title="Remove widget from dashboard"
                      className="p-1 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* CARD CONTENT RENDERING */}
                {cardConfig.id === "stats" && (
                  <div
                    style={{ minHeight: `${effectiveHeight}px` }}
                    className={`grid gap-3 h-full ${
                      effectiveSpan === 1
                        ? "grid-cols-1 overflow-y-auto"
                        : effectiveSpan === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 md:grid-cols-4"
                    }`}
                  >
                    {stats.map((s) => (
                      <StatCard key={s.label} {...s} />
                    ))}
                  </div>
                )}

                {cardConfig.id === "daily_brief" && (
                  <div
                    style={{ height: `${effectiveHeight}px` }}
                    className="glass-card flex flex-col p-5 h-full w-full border border-border bg-surface"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-brand" />
                        <span className="text-[14px] font-bold text-text">Daily Meeting Brief</span>
                      </div>
                      <Link href="/meetings" className="text-[11.5px] font-bold text-brand hover:underline">Open calendar →</Link>
                    </div>
                    <div className={`mt-4 grid gap-5 overflow-y-auto pr-1 ${effectiveSpan === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                      {[
                        { label: "Yesterday", items: yesterdayMeetings, accent: "bg-slate-400" },
                        { label: "Today", items: todayMeetings, accent: "bg-brand" },
                      ].map((group) => (
                        <section key={group.label}>
                          <div className="mb-2.5 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${group.accent}`} />
                            <h3 className="text-[12px] font-bold uppercase text-text-muted">{group.label}</h3>
                            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-text-muted">{group.items.length}</span>
                          </div>
                          <div className="space-y-2">
                            {group.items.length === 0 ? (
                              <p className="rounded-lg border border-dashed border-border p-3 text-[12px] text-text-muted">No meetings recorded.</p>
                            ) : group.items.map((meeting: any) => (
                              <div key={meeting.id} className="rounded-lg border border-border bg-surface-2 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-[12.5px] font-bold text-text">{meetingAccount(meeting)}</p>
                                  <time className="shrink-0 text-[10.5px] font-semibold text-brand">{new Date(meeting.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                                </div>
                                <p className="mt-1 text-[11.5px] leading-5 text-text-muted">• {meetingOutcome(meeting)}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                )}

                {cardConfig.id === "upcoming_meetings" && (
                  <div style={{ height: `${effectiveHeight}px` }} className="glass-card flex h-full w-full flex-col border border-border bg-surface p-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand" />
                        <span className="text-[14px] font-bold text-text">Upcoming Meetings</span>
                      </div>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-bold text-brand">{upcomingMeetings.length}</span>
                    </div>
                    <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                      {upcomingMeetings.length === 0 ? (
                        <div className="py-10 text-center text-[12px] text-text-muted">
                          <CalendarDays size={24} className="mx-auto mb-2 opacity-50" />
                          No future meetings recorded.
                        </div>
                      ) : (
                        upcomingMeetings.map((meeting: any) => (
                          <div key={meeting.id} className="rounded-lg border border-border bg-surface-2 p-3">
                            <p className="text-[12.5px] font-bold text-text">{meetingAccount(meeting)}</p>
                            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                              <Clock size={11} className="text-brand" />
                              <span>{new Date(meeting.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                              <span>•</span>
                              <span>{new Date(meeting.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-text-muted">{meetingOutcome(meeting)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {cardConfig.id === "next_actions" && (
                  <div style={{ height: `${effectiveHeight}px` }} className="glass-card flex h-full w-full flex-col border border-border bg-surface p-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <ListChecks size={16} className="text-brand" />
                        <div>
                          <h3 className="text-[14px] font-bold text-text">Recommended Next Steps</h3>
                          <p className="text-[10.5px] text-text-muted">Priority order for the sales team</p>
                        </div>
                      </div>
                      <Link href="/tasks" className="flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline">All tasks <ArrowRight size={12} /></Link>
                    </div>
                    <div className={`mt-3 grid flex-1 gap-2 overflow-y-auto pr-1 ${effectiveSpan === 1 ? "grid-cols-1" : effectiveSpan === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                      {suggestedActions.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[12.5px] text-text-muted">
                          <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                          No open actions. Add the next commitment from each customer conversation.
                        </div>
                      ) : suggestedActions.map((task, taskIndex) => {
                        const overdue = task.dueDate && new Date(task.dueDate).getTime() < todayStart;
                        return (
                          <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${overdue ? "bg-rose-500/15 text-rose-500" : "bg-brand/10 text-brand"}`}>{taskIndex + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-bold text-text">{task.title}</p>
                              {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-text-muted">{task.description}</p>}
                              <div className="mt-2 flex items-center gap-2 text-[10.5px] font-semibold">
                                <span className={task.priority === "HIGH" ? "text-rose-500" : "text-amber-500"}>{task.priority}</span>
                                {task.dueDate && <span className={overdue ? "text-rose-500" : "text-text-muted"}>{overdue ? "Overdue" : "Due"} {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cardConfig.id === "recent_deals" && (
                  <div
                    style={{ height: `${effectiveHeight}px` }}
                    className="glass-card flex flex-col p-5 h-full w-full border border-border bg-surface"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                      <div>
                        <h3 className="text-sm font-bold text-text">Key Opportunities &amp; Key Accounts</h3>
                        <p className="text-[11px] text-text-muted">High-priority deals progressing this week</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/pipeline"
                          className="flex items-center gap-1 text-xs font-bold text-brand hover:underline ml-1"
                        >
                          <span>View all</span>
                          <TrendingUp size={13} />
                        </Link>
                      </div>
                    </div>

                    <div
                      className={`mt-4 flex-1 overflow-y-auto pr-1 grid gap-3.5 ${
                        effectiveSpan === 1
                          ? "grid-cols-1"
                          : effectiveSpan === 2
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
                      {openDeals.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-[12.5px] text-text-muted">
                          <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500 opacity-60" />
                          No open opportunities matching the active filters.
                        </div>
                      ) : (
                        openDeals.slice(0, effectiveSpan === 1 ? 2 : 3).map((d) => {
                          const initials = (d.account?.name || d.title || "MY")
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("");
                          return (
                            <Link
                              key={d.id}
                              href={`/deals/${d.id}`}
                              className="group flex flex-col justify-between rounded-2xl bg-surface-2 border border-border p-4 shadow-2xs hover:shadow-sm hover:border-brand/40 transition-all duration-150"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-xs shadow-2xs">
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-text group-hover:text-brand truncate transition-colors">
                                    {d.account?.name || d.title}
                                  </p>
                                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                                    {d.title}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[10.5px] text-text-muted">
                                <div className="flex items-center gap-1 font-medium">
                                  <Clock size={11} className="text-text-muted" />
                                  <span>Target: {d.expectedClose ? new Date(d.expectedClose).toLocaleDateString() : "Active"}</span>
                                </div>
                                <span className="font-mono font-bold text-text">
                                  SAR {(d.value || 0).toLocaleString()}
                                </span>
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Widget Catalog Modal (Add/Remove Cards) */}
      {widgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-text">Dashboard Widget Catalog</h2>
                <p className="text-[12.5px] text-text-muted mt-0.5">
                  Customize the cards visible on your command center.
                </p>
              </div>
              <button
                onClick={() => setWidgetModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2 hover:bg-surface-2/80 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-[13px] font-bold text-text">{c.title}</p>
                    <p className="text-[11.5px] text-text-muted mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleCardVisibility(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                      c.visible
                        ? "bg-brand text-white shadow-2xs"
                        : "border border-border bg-surface text-text hover:bg-surface-2"
                    }`}
                  >
                    {c.visible ? "Active" : "+ Add"}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={resetLayout}
                className="text-[12px] font-medium text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setWidgetModalOpen(false)}
                className="rounded-xl bg-brand px-4 py-2 text-[12.5px] font-bold text-white hover:bg-brand/90 shadow-xs cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

