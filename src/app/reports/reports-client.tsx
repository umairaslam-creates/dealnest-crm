"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Filter,
  Download,
  Printer,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Users,
  PhoneCall,
  Video,
  Mail,
  FileText,
  Layers,
  Package,
  Search,
  Building2,
  RotateCcw,
  DollarSign,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Briefcase,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Target as TargetIcon,
} from "lucide-react";
import { TargetWithProgress } from "@/app/actions/targets";
import {
  convertCurrency,
  formatCurrency as formatCurrencyLib,
  CurrencyCode,
} from "@/lib/currency";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import { useToast } from "@/components/toast-context";

type Stage = { id: string; name: string; color: string | null; order: number };
type Pipeline = { id: string; name: string; stages: Stage[] };

type Deal = {
  id: string;
  title: string;
  value: number | null;
  currency: string | null;
  status: "OPEN" | "WON" | "LOST";
  stageId: string;
  pipelineId: string;
  productId: string | null;
  ownerId: string | null;
  createdAt: string | Date;
  stage?: { id: string; name: string; color: string | null } | null;
  owner?: { id: string; name: string | null; email?: string } | null;
  product?: { id: string; name: string } | null;
  account?: {
    name: string;
    contacts?: Array<{ id: string; name: string; title?: string | null }>;
  } | null;
  pipeline?: { id: string; name: string } | null;
};

type Lead = {
  id: string;
  contactName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  productInterest: string | null;
  score: string | null;
  stageId: string | null;
  ownerId: string | null;
  createdAt: string | Date;
  stage?: { id: string; name: string } | null;
  owner?: { id: string; name: string | null } | null;
};

type Activity = {
  id: string;
  type: "CALL" | "MEETING" | "NOTE" | "EMAIL";
  notes: string | null;
  occurredAt: string | Date;
  dealId: string | null;
  leadId: string | null;
  contactId: string | null;
  userId: string | null;
  user?: { id: string; name: string | null; email?: string } | null;
  contact?: {
    id: string;
    name: string;
    title?: string | null;
    account?: { name: string } | null;
  } | null;
  lead?: {
    id: string;
    contactName: string;
    company: string | null;
    productInterest: string | null;
  } | null;
  deal?: {
    id: string;
    title: string;
    account?: { name: string } | null;
    product?: { id: string; name: string } | null;
  } | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

const CHART_COLORS = [
  "#4361ee",
  "#06d6a0",
  "#f72585",
  "#7209b7",
  "#3a0ca3",
  "#4cc9f0",
  "#f8961e",
  "#f9c74f",
  "#90be6d",
  "#43aa8b",
];

function formatCurrency(amount: number, currency: string = "SAR"): string {
  return formatCurrencyLib(amount, currency);
}

function formatDateDisplay(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeDisplay(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function ReportsClient({
  deals,
  leads,
  activities,
  meetings = [],
  products,
  members,
  pipelines,
  targets = [],
}: {
  deals: Deal[];
  leads: Lead[];
  activities: Activity[];
  meetings?: any[];
  products: Product[];
  members: Member[];
  pipelines: Pipeline[];
  targets?: TargetWithProgress[];
}) {
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("SAR");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedRepId, setSelectedRepId] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>("");

  // Helper to test if a date matches the chosen period
  const isDateInRange = useMemo(() => {
    const now = new Date();

    return (dateInput: Date | string | null | undefined): boolean => {
      if (!dateInput) return false;
      const target = new Date(dateInput);

      if (periodPreset === "all") return true;

      if (periodPreset === "this_month") {
        return (
          target.getFullYear() === now.getFullYear() &&
          target.getMonth() === now.getMonth()
        );
      }

      if (periodPreset === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          target.getFullYear() === lastMonth.getFullYear() &&
          target.getMonth() === lastMonth.getMonth()
        );
      }

      if (periodPreset === "this_quarter") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const targetQuarter = Math.floor(target.getMonth() / 3);
        return (
          target.getFullYear() === now.getFullYear() &&
          targetQuarter === currentQuarter
        );
      }

      if (periodPreset === "this_year") {
        return target.getFullYear() === now.getFullYear();
      }

      if (periodPreset === "custom") {
        if (customStartDate && target < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (target > end) return false;
        }
        return true;
      }

      return true;
    };
  }, [periodPreset, customStartDate, customEndDate]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (!isDateInRange(d.createdAt)) return false;
      if (selectedRepId !== "all" && d.ownerId !== selectedRepId) return false;
      if (selectedProductId !== "all" && d.productId !== selectedProductId) return false;
      if (selectedPipelineId !== "all" && d.pipelineId !== selectedPipelineId) return false;
      return true;
    });
  }, [deals, isDateInRange, selectedRepId, selectedProductId, selectedPipelineId]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!isDateInRange(l.createdAt)) return false;
      if (selectedRepId !== "all" && l.ownerId !== selectedRepId) return false;
      if (selectedProductId !== "all") {
        const prod = products.find((p) => p.id === selectedProductId);
        if (
          !l.productInterest ||
          !prod ||
          !l.productInterest.toLowerCase().includes(prod.name.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    });
  }, [leads, isDateInRange, selectedRepId, selectedProductId, products]);

  // Unified touchpoints: merge activities and calendar meetings
  const allTouchpoints = useMemo(() => {
    const fromMeetings: Activity[] = (meetings || []).map((m: any) => ({
      id: m.id,
      type: "MEETING" as const,
      notes: `${m.title}${m.description ? ` — ${m.description}` : ""}`,
      occurredAt: m.startTime,
      dealId: m.dealId,
      leadId: null,
      contactId: m.contactId,
      userId: m.userId,
      user: m.user,
      contact: m.contact,
      deal: m.deal,
      lead: null,
    }));

    const existingIds = new Set(activities.map((a) => a.id));
    const uniqueFromMeetings = fromMeetings.filter((m) => !existingIds.has(m.id));

    return [...activities, ...uniqueFromMeetings].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [activities, meetings]);

  // Filtered Activities / Meetings
  const filteredActivities = useMemo(() => {
    return allTouchpoints.filter((a) => {
      if (!isDateInRange(a.occurredAt)) return false;
      if (selectedRepId !== "all" && a.userId !== selectedRepId) return false;

      // Product filtering on activities
      if (selectedProductId !== "all") {
        const prod = products.find((p) => p.id === selectedProductId);
        const matchDealProduct = a.deal?.product?.id === selectedProductId;
        const matchLeadProduct =
          prod &&
          a.lead?.productInterest?.toLowerCase().includes(prod.name.toLowerCase());
        if (!matchDealProduct && !matchLeadProduct) return false;
      }

      // Activity Type filtering
      if (activityTypeFilter !== "all" && a.type !== activityTypeFilter) {
        return false;
      }

      return true;
    });
  }, [allTouchpoints, isDateInRange, selectedRepId, selectedProductId, activityTypeFilter, products]);

  // Filtered Ledger (with search query)
  const ledgerActivities = useMemo(() => {
    if (!ledgerSearchQuery.trim()) return filteredActivities;
    const q = ledgerSearchQuery.toLowerCase();
    return filteredActivities.filter((a) => {
      const contactName =
        a.contact?.name?.toLowerCase() || a.lead?.contactName?.toLowerCase() || "";
      const companyName =
        a.deal?.account?.name?.toLowerCase() ||
        a.contact?.account?.name?.toLowerCase() ||
        a.lead?.company?.toLowerCase() ||
        "";
      const productName =
        a.deal?.product?.name?.toLowerCase() ||
        a.lead?.productInterest?.toLowerCase() ||
        "";
      const repName = a.user?.name?.toLowerCase() || "";
      const notes = a.notes?.toLowerCase() || "";

      return (
        contactName.includes(q) ||
        companyName.includes(q) ||
        productName.includes(q) ||
        repName.includes(q) ||
        notes.includes(q)
      );
    });
  }, [filteredActivities, ledgerSearchQuery]);

  // Aggregate KPI Metrics
  const kpis = useMemo(() => {
    const openDeals = filteredDeals.filter((d) => d.status === "OPEN");
    const wonDeals = filteredDeals.filter((d) => d.status === "WON");
    const lostDeals = filteredDeals.filter((d) => d.status === "LOST");
    const closedDeals = wonDeals.length + lostDeals.length;

    const totalOpenValue = openDeals.reduce((sum, d) => {
      const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
      return sum + converted;
    }, 0);
    const totalWonValue = wonDeals.reduce((sum, d) => {
      const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
      return sum + converted;
    }, 0);
    const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0;
    const avgDealSize =
      filteredDeals.length > 0
        ? Math.round(
            filteredDeals.reduce((sum, d) => {
              const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
              return sum + converted;
            }, 0) / filteredDeals.length
          )
        : 0;

    const meetingsCount = filteredActivities.filter((a) => a.type === "MEETING").length;
    const callsCount = filteredActivities.filter((a) => a.type === "CALL").length;

    return {
      totalOpenValue,
      totalWonValue,
      openCount: openDeals.length,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      closedCount: closedDeals,
      winRate,
      avgDealSize,
      meetingsCount,
      callsCount,
      totalActivities: filteredActivities.length,
      leadsCount: filteredLeads.length,
    };
  }, [filteredDeals, filteredActivities, filteredLeads, displayCurrency]);

  // Chart Data: Pipeline Coverage by Stage
  const stageChartData = useMemo(() => {
    const stageMap = new Map<string, { count: number; value: number }>();
    for (const d of filteredDeals.filter((d) => d.status === "OPEN")) {
      const stageName = d.stage?.name || "Unassigned";
      const curr = stageMap.get(stageName) || { count: 0, value: 0 };
      curr.count += 1;
      const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
      curr.value += converted;
      stageMap.set(stageName, curr);
    }
    return Array.from(stageMap.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }));
  }, [filteredDeals, displayCurrency]);

  // Chart Data: Performance by Sales Rep (Won vs Open Value)
  const repPerformanceData = useMemo(() => {
    const repMap = new Map<
      string,
      {
        repName: string;
        wonValue: number;
        openValue: number;
        wonCount: number;
        openCount: number;
        meetings: number;
      }
    >();

    for (const d of filteredDeals) {
      const repName = d.owner?.name || "Unassigned";
      const entry = repMap.get(repName) || {
        repName,
        wonValue: 0,
        openValue: 0,
        wonCount: 0,
        openCount: 0,
        meetings: 0,
      };

      const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
      if (d.status === "WON") {
        entry.wonValue += converted;
        entry.wonCount += 1;
      } else if (d.status === "OPEN") {
        entry.openValue += converted;
        entry.openCount += 1;
      }
      repMap.set(repName, entry);
    }

    // Count meetings for each rep
    for (const a of filteredActivities) {
      const repName = a.user?.name || "Unassigned";
      if (a.type === "MEETING") {
        const entry = repMap.get(repName);
        if (entry) entry.meetings += 1;
      }
    }

    return Array.from(repMap.values()).sort((a, b) => b.wonValue - a.wonValue);
  }, [filteredDeals, filteredActivities, displayCurrency]);

  // Chart Data: Product Distribution
  const productDistributionData = useMemo(() => {
    const prodMap = new Map<string, { name: string; value: number; count: number }>();

    for (const d of filteredDeals) {
      const prodName = d.product?.name || "Other / Custom";
      const entry = prodMap.get(prodName) || { name: prodName, value: 0, count: 0 };
      const converted = convertCurrency(d.value, d.currency || "SAR", displayCurrency);
      entry.value += converted;
      entry.count += 1;
      prodMap.set(prodName, entry);
    }

    return Array.from(prodMap.values()).filter((p) => p.value > 0);
  }, [filteredDeals, displayCurrency]);

  // Chart Data: Activities by Type
  const activityDistributionData = useMemo(() => {
    const map: Record<string, number> = {
      "Demo / Meeting": 0,
      "Phone Call": 0,
      "Email Sent": 0,
      "Internal Note": 0,
    };

    for (const a of filteredActivities) {
      if (a.type === "MEETING") map["Demo / Meeting"] += 1;
      else if (a.type === "CALL") map["Phone Call"] += 1;
      else if (a.type === "EMAIL") map["Email Sent"] += 1;
      else if (a.type === "NOTE") map["Internal Note"] += 1;
    }

    return [
      { name: "Demo / Meeting", count: map["Demo / Meeting"], color: "#4361ee" },
      { name: "Phone Call", count: map["Phone Call"], color: "#06d6a0" },
      { name: "Email Sent", count: map["Email Sent"], color: "#f72585" },
      { name: "Internal Note", count: map["Internal Note"], color: "#7209b7" },
    ].filter((item) => item.count > 0);
  }, [filteredActivities]);

  // Period Label for exports and display
  const periodLabel = useMemo(() => {
    switch (periodPreset) {
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "this_quarter":
        return "This Quarter";
      case "this_year":
        return "This Year (YTD)";
      case "custom":
        return `Custom (${customStartDate || "Start"} to ${customEndDate || "Now"})`;
      default:
        return "All Time";
    }
  }, [periodPreset, customStartDate, customEndDate]);

  // Reset Filters
  function handleResetFilters() {
    setPeriodPreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedRepId("all");
    setSelectedProductId("all");
    setSelectedPipelineId("all");
    setActivityTypeFilter("all");
    setLedgerSearchQuery("");
    toast.success("Filters reset to default.");
  }

  // Export to Excel (.xlsx)
  function handleExportExcel() {
    try {
      const wb = XLSX.utils.book_new();

      // 1. KPI Overview Sheet
      const kpiRows = [
        { Metric: "Report Generated On", Value: new Date().toLocaleString() },
        { Metric: "Report Period Filter", Value: periodLabel },
        {
          Metric: "Selected Rep Filter",
          Value:
            selectedRepId === "all"
              ? "All Sales Reps"
              : members.find((m) => m.id === selectedRepId)?.name || selectedRepId,
        },
        {
          Metric: "Selected Product Filter",
          Value:
            selectedProductId === "all"
              ? "All Products"
              : products.find((p) => p.id === selectedProductId)?.name || selectedProductId,
        },
        { Metric: "Total Pipeline Value (Open)", Value: `SAR ${kpis.totalOpenValue.toLocaleString()}` },
        { Metric: "Closed Won Revenue", Value: `SAR ${kpis.totalWonValue.toLocaleString()}` },
        { Metric: "Win Rate %", Value: `${kpis.winRate}%` },
        { Metric: "Total Deals", Value: filteredDeals.length },
        { Metric: "Deals Won", Value: kpis.wonCount },
        { Metric: "Deals Lost", Value: kpis.lostCount },
        { Metric: "Open Deals", Value: kpis.openCount },
        { Metric: "Average Deal Size", Value: `SAR ${kpis.avgDealSize.toLocaleString()}` },
        { Metric: "Total Leads Filtered", Value: filteredLeads.length },
        { Metric: "Meetings & Demos Conducted", Value: kpis.meetingsCount },
        { Metric: "Total Customer Activities", Value: filteredActivities.length },
      ];
      const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
      XLSX.utils.book_append_sheet(wb, wsKpi, "KPI Overview");

      // 2. Meetings & Demos Ledger Sheet
      const meetingRows = filteredActivities.map((a) => {
        const contactPerson =
          a.contact?.name || a.lead?.contactName || "—";
        const companyName =
          a.deal?.account?.name ||
          a.contact?.account?.name ||
          a.lead?.company ||
          "—";
        const productName =
          a.deal?.product?.name || a.lead?.productInterest || "—";
        const repName = a.user?.name || "Unassigned";

        return {
          "Date & Time": new Date(a.occurredAt).toLocaleString(),
          "Activity Type": a.type,
          "Contact / Person": contactPerson,
          "Company / Account": companyName,
          "Product / Interest": productName,
          "Conducted By (Sales Rep)": repName,
          "Meeting Notes / Outcome": a.notes || "",
        };
      });
      const wsMeetings = XLSX.utils.json_to_sheet(meetingRows);
      XLSX.utils.book_append_sheet(wb, wsMeetings, "Meetings & Demos Ledger");

      // 3. Deals Performance Sheet
      const dealRows = filteredDeals.map((d) => ({
        "Deal Title": d.title,
        Company: d.account?.name || "Independent",
        "Primary Contact": d.account?.contacts?.[0]?.name || "—",
        Product: d.product?.name || "—",
        "Sales Rep": d.owner?.name || "Unassigned",
        Pipeline: d.pipeline?.name || "Main Pipeline",
        Stage: d.stage?.name || "—",
        Status: d.status,
        "Value (SAR)": d.value ?? 0,
        "Created Date": formatDateDisplay(d.createdAt),
      }));
      const wsDeals = XLSX.utils.json_to_sheet(dealRows);
      XLSX.utils.book_append_sheet(wb, wsDeals, "Deals Performance");

      // 4. Leads Summary Sheet
      const leadRows = filteredLeads.map((l) => ({
        "Contact Name": l.contactName,
        Company: l.company || "—",
        Email: l.email || "—",
        Phone: l.phone || "—",
        "Product Interest": l.productInterest || "—",
        Source: l.source || "—",
        "Lead Score / Temp": l.score || "—",
        "Assigned Rep": l.owner?.name || "Unassigned",
        Stage: l.stage?.name || "—",
        "Created Date": formatDateDisplay(l.createdAt),
      }));
      const wsLeads = XLSX.utils.json_to_sheet(leadRows);
      XLSX.utils.book_append_sheet(wb, wsLeads, "Leads Summary");

      // 5. Rep Performance Summary Sheet
      const repRows = repPerformanceData.map((r) => ({
        "Sales Rep": r.repName,
        "Won Revenue (SAR)": r.wonValue,
        "Open Pipeline (SAR)": r.openValue,
        "Deals Won": r.wonCount,
        "Deals Open": r.openCount,
        "Meetings Conducted": r.meetings,
      }));
      const wsReps = XLSX.utils.json_to_sheet(repRows);
      XLSX.utils.book_append_sheet(wb, wsReps, "Sales Rep Breakdown");

      // Generate filename
      const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `MYTM_Sales_Report_${cleanPeriod}_${dateStr}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export Excel report.");
    }
  }

  // Print / PDF Graphical Report
  function handlePrintReport() {
    window.print();
  }

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Print styles injection for clean PDF / Print output */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav,
          aside,
          header,
          .no-print,
          button:not(.print-include) {
            display: none !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
          }
          .print-break-before {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Top Controls: Title, Period, and Export Actions */}
      <div className="card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-brand h-5 w-5" />
            <h2 className="text-base font-bold text-text">Advanced Sales Analytics & Reports</h2>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Active Filter: <strong className="text-text font-semibold">{periodLabel}</strong> •{" "}
            {filteredDeals.length} Deals • {kpis.meetingsCount} Meetings & Demos • {filteredLeads.length} Leads
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Switcher */}
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-1 text-xs font-bold">
            <span className="text-[11px] text-text-muted px-2 font-medium">Currency:</span>
            <button
              onClick={() => setDisplayCurrency("SAR")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                displayCurrency === "SAR"
                  ? "bg-surface text-brand shadow-sm font-extrabold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span>🇸🇦 SAR (﷼)</span>
            </button>
            <button
              onClick={() => setDisplayCurrency("USD")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                displayCurrency === "USD"
                  ? "bg-surface text-brand shadow-sm font-extrabold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <span>🇺🇸 USD ($)</span>
            </button>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-text shadow-sm transition-all"
            title="Print or Save as PDF"
          >
            <Printer size={14} className="text-brand" />
            <span>Export Graphical (PDF)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-ink)",
              color: "var(--color-ink-fg, #ffffff)",
            }}
            title="Download multi-sheet Excel workbook"
          >
            <Download size={14} />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3.5 no-print bg-surface-2/60 border-border shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-text uppercase tracking-wider">
          <Filter size={13} className="text-brand" />
          <span>Multi-Dimensional Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Date Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Date Period
            </label>
            <div className="relative">
              <Calendar size={13} className="absolute left-2.5 top-2.5 text-text-faint" />
              <select
                value={periodPreset}
                onChange={(e) => setPeriodPreset(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year (YTD)</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>
          </div>

          {/* 2. Sales Rep Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Sales Rep / Owner
            </label>
            <div className="relative">
              <Users size={13} className="absolute left-2.5 top-2.5 text-text-faint" />
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="all">All Sales Reps</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Product Catalog Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Product / Solution
            </label>
            <div className="relative">
              <Package size={13} className="absolute left-2.5 top-2.5 text-text-faint" />
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Pipeline Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Sales Pipeline
            </label>
            <div className="relative">
              <Layers size={13} className="absolute left-2.5 top-2.5 text-text-faint" />
              <select
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="all">All Pipelines</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Activity Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Activity Type
            </label>
            <div className="relative">
              <Video size={13} className="absolute left-2.5 top-2.5 text-text-faint" />
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs font-semibold text-text outline-none focus:border-brand"
              >
                <option value="all">All Activities</option>
                <option value="MEETING">Meetings & Demos Only</option>
                <option value="CALL">Phone Calls Only</option>
                <option value="EMAIL">Emails Only</option>
                <option value="NOTE">Internal Notes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker when "custom" is selected */}
        {periodPreset === "custom" && (
          <div className="pt-2 border-t border-border flex items-center gap-3 flex-wrap animate-in fade-in">
            <span className="text-xs font-semibold text-text-muted">Specify Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-faint">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1 text-xs text-text outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-faint">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-1 text-xs text-text outline-none focus:border-brand"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Highlights Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Pipeline Value */}
        <div className="card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Open Pipeline
            </span>
            <DollarSign size={14} className="text-brand" />
          </div>
          <p className="font-numeric text-lg font-extrabold text-text">
            {formatCurrency(kpis.totalOpenValue, displayCurrency)}
          </p>
          <p className="text-[10.5px] text-text-faint">{kpis.openCount} open deals</p>
        </div>

        {/* Won Revenue */}
        <div className="card p-3.5 space-y-1 bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Closed Won
            </span>
            <CheckCircle2 size={14} />
          </div>
          <p className="font-numeric text-lg font-extrabold text-emerald-600">
            {formatCurrency(kpis.totalWonValue, displayCurrency)}
          </p>
          <p className="text-[10.5px] text-emerald-600/70">{kpis.wonCount} won deals</p>
        </div>

        {/* Win Rate */}
        <div className="card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Win Rate</span>
            <TrendingUp size={14} className="text-brand" />
          </div>
          <p className="font-numeric text-lg font-extrabold text-text">{kpis.winRate}%</p>
          <p className="text-[10.5px] text-text-faint">
            {kpis.wonCount} won / {kpis.closedCount} closed
          </p>
        </div>

        {/* Meetings & Demos Conducted */}
        <div className="card p-3.5 space-y-1 bg-indigo-500/5 border-indigo-500/20">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Demos & Meetings
            </span>
            <Video size={14} />
          </div>
          <p className="font-numeric text-lg font-extrabold text-indigo-600">
            {kpis.meetingsCount}
          </p>
          <p className="text-[10.5px] text-indigo-600/70">
            {kpis.totalActivities} total touches
          </p>
        </div>

        {/* Active Leads */}
        <div className="card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Leads Tracked
            </span>
            <Users size={14} className="text-brand" />
          </div>
          <p className="font-numeric text-lg font-extrabold text-text">{kpis.leadsCount}</p>
          <p className="text-[10.5px] text-text-faint">In active period</p>
        </div>

        {/* Average Deal Value */}
        <div className="card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Deal</span>
            <Briefcase size={14} className="text-brand" />
          </div>
          <p className="font-numeric text-lg font-extrabold text-text">
            {formatCurrency(kpis.avgDealSize, displayCurrency)}
          </p>
          <p className="text-[10.5px] text-text-faint">Across all stages</p>
        </div>
      </div>

      {/* Active Targets & Quotas Overview Ribbon */}
      {targets.length > 0 && (
        <div className="card p-4 border border-border bg-gradient-to-r from-brand/5 via-surface to-surface shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-brand/10 text-brand">
                <TargetIcon size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">Active Targets &amp; Quotas Progress</h3>
                <p className="text-[11px] text-text-muted">Live attainment tracked against operational targets</p>
              </div>
            </div>
            <Link
              href="/targets"
              className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              <span>Manage Targets &amp; Goals</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {targets.slice(0, 3).map((target) => {
              const isRevenue = target.type === "REVENUE_QUOTA";
              const targetVal = isRevenue
                ? formatCurrency(convertCurrency(target.targetValue, target.currency, displayCurrency), displayCurrency)
                : `${target.targetValue.toLocaleString()}`;
              const actualVal = isRevenue
                ? formatCurrency(convertCurrency(target.currentValue, target.currency, displayCurrency), displayCurrency)
                : `${target.currentValue.toLocaleString()}`;

              return (
                <div key={target.id} className="p-3 rounded-xl border border-border bg-surface-2/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-text truncate">{target.title}</span>
                    <span className="font-numeric text-xs font-bold text-brand">{target.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        target.percentage >= 100 ? "bg-emerald-500" : target.percentage >= 75 ? "bg-brand" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, target.percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-text-muted">
                    <span>{actualVal} / {targetVal}</span>
                    <span className="font-medium text-text-faint">{target.daysLeft}d left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Pipeline Value by Stage */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13.5px] font-bold text-text">Pipeline Value by Stage</h3>
              <p className="text-[11px] text-text-muted">
                Distribution of open pipeline across active deal stages
              </p>
            </div>
            <span className="text-xs font-bold text-brand font-numeric">
              {formatCurrency(kpis.totalOpenValue, displayCurrency)}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {isMounted ? (
              stageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${displayCurrency} ${Number(val).toLocaleString()}`, "Pipeline Value"]}
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="value" fill="#4361ee" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-faint">
                  No open deals in selected period.
                </div>
              )
            ) : (
              <div className="h-full bg-surface-2/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        {/* Chart 2: Won Revenue vs Open Pipeline by Sales Rep */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13.5px] font-bold text-text">Rep Performance (Won vs Open)</h3>
              <p className="text-[11px] text-text-muted">
                Closed revenue and active pipeline managed by each team member
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {isMounted ? (
              repPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={repPerformanceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="repName"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${displayCurrency} ${Number(val).toLocaleString()}`,
                        name === "wonValue" ? "Won Revenue" : "Open Pipeline",
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar
                      name="Won Revenue"
                      dataKey="wonValue"
                      fill="#06d6a0"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Open Pipeline"
                      dataKey="openValue"
                      fill="#4361ee"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-faint">
                  No deals assigned in selected period.
                </div>
              )
            ) : (
              <div className="h-full bg-surface-2/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        {/* Chart 3: Product Revenue Distribution */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13.5px] font-bold text-text">Product Revenue Breakdown</h3>
              <p className="text-[11px] text-text-muted">
                Deal value distribution by product solution
              </p>
            </div>
            <PieIcon size={16} className="text-brand" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {isMounted ? (
              productDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name, percent }) =>
                        `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {productDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        `SAR ${Number(val).toLocaleString()}`,
                        "Deal Value",
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-text-faint">No product data for selected period.</p>
              )
            ) : (
              <div className="h-full w-full bg-surface-2/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        {/* Chart 4: Touchpoints & Activities by Type */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13.5px] font-bold text-text">Customer Engagement Mix</h3>
              <p className="text-[11px] text-text-muted">
                Breakdown of {kpis.totalActivities} customer interactions
              </p>
            </div>
            <Video size={16} className="text-brand" />
          </div>

          <div className="h-64 w-full pt-2">
            {isMounted ? (
              activityDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityDistributionData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(val: any) => [val, "Interactions"]}
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {activityDistributionData.map((entry, index) => (
                        <Cell key={`act-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-faint">
                  No activity logged in selected period.
                </div>
              )
            ) : (
              <div className="h-full bg-surface-2/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>
      </div>

      {/* MEETINGS & DEMOS CONDUCTED LEDGER TABLE (Core User Request) */}
      <div className="card p-4 space-y-3 print-break-before">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Video className="text-brand h-4 w-4" />
              <h3 className="text-sm font-bold text-text">
                Meetings & Product Demos Conducted Ledger
              </h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Comprehensive log showing who held the meeting/demo, with whom, company, product, date & notes
            </p>
          </div>

          {/* Ledger Search Input */}
          <div className="relative w-full sm:w-64 no-print">
            <Search size={13} className="absolute left-3 top-2.5 text-text-faint" />
            <input
              type="text"
              placeholder="Search meetings, reps, companies..."
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-faint outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-border/70 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2/70 text-text-muted border-b border-border/70 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Date & Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Contact / Person</th>
                <th className="py-2.5 px-3">Company / Account</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Held By (Rep)</th>
                <th className="py-2.5 px-3.5">Meeting Notes / Agenda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ledgerActivities.length > 0 ? (
                ledgerActivities.map((act) => {
                  const contactName =
                    act.contact?.name || act.lead?.contactName || "—";
                  const contactHref = act.contact
                    ? `/contacts/${act.contact.id}`
                    : act.lead
                    ? `/leads/${act.lead.id}`
                    : null;
                  const companyName =
                    act.deal?.account?.name ||
                    act.contact?.account?.name ||
                    act.lead?.company ||
                    "—";
                  const productName =
                    act.deal?.product?.name || act.lead?.productInterest || "—";
                  const repName = act.user?.name || "Unassigned";

                  const isMeeting = act.type === "MEETING";
                  const isCall = act.type === "CALL";
                  const isEmail = act.type === "EMAIL";

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-surface-2/50 transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-text">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-text-faint shrink-0" />
                          <span>{formatDateTimeDisplay(act.occurredAt)}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isMeeting ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10.5px] font-bold text-indigo-600 border border-indigo-500/20">
                            <Video size={10} />
                            <span>Demo / Meeting</span>
                          </span>
                        ) : isCall ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 border border-emerald-500/20">
                            <PhoneCall size={10} />
                            <span>Call</span>
                          </span>
                        ) : isEmail ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-pink-500/10 px-2 py-0.5 text-[10.5px] font-bold text-pink-600 border border-pink-500/20">
                            <Mail size={10} />
                            <span>Email</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-500/10 px-2 py-0.5 text-[10.5px] font-bold text-slate-600 border border-slate-500/20">
                            <FileText size={10} />
                            <span>Note</span>
                          </span>
                        )}
                      </td>

                      {/* Contact / Person (Clickable) */}
                      <td className="py-2.5 px-3 font-semibold text-text">
                        {contactHref ? (
                          <Link
                            href={contactHref}
                            className="inline-flex items-center gap-1 hover:text-brand hover:underline transition-colors"
                            title="View person profile"
                          >
                            <span>{contactName}</span>
                            <ExternalLink size={10} className="text-text-faint" />
                          </Link>
                        ) : (
                          <span>{contactName}</span>
                        )}
                      </td>

                      {/* Company / Account */}
                      <td className="py-2.5 px-3 text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={11} className="text-text-faint shrink-0" />
                          <span>{companyName}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-2.5 px-3">
                        {productName !== "—" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 border border-border text-[11px] font-medium text-text">
                            <Package size={10} className="text-brand shrink-0" />
                            <span>{productName}</span>
                          </span>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>

                      {/* Conducted By (Rep) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-bold">
                            {repName.charAt(0)}
                          </div>
                          <span className="font-medium text-text">{repName}</span>
                        </div>
                      </td>

                      {/* Meeting Notes */}
                      <td className="py-2.5 px-3.5 max-w-xs truncate text-text-muted" title={act.notes || ""}>
                        {act.notes ? (
                          <span>{act.notes}</span>
                        ) : (
                          <span className="text-text-faint italic">No notes logged</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-faint">
                    No customer meetings or touchpoints found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Rep Performance Breakdown Table */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text">Sales Team Performance Summary</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Revenue generated, open pipeline, and meeting volume per sales representative
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-border/70 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2/70 text-text-muted border-b border-border/70 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Sales Representative</th>
                <th className="py-2.5 px-3">Deals Managed</th>
                <th className="py-2.5 px-3">Deals Won</th>
                <th className="py-2.5 px-3">Meetings Held</th>
                <th className="py-2.5 px-3">Win Rate</th>
                <th className="py-2.5 px-3 text-right">Won Revenue</th>
                <th className="py-2.5 px-3.5 text-right">Open Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {repPerformanceData.length > 0 ? (
                repPerformanceData.map((r) => {
                  const totalClosed = r.wonCount; // simplistic for rep row
                  const repRate =
                    r.wonCount + r.openCount > 0
                      ? Math.round((r.wonCount / (r.wonCount + r.openCount)) * 100)
                      : 0;

                  return (
                    <tr key={r.repName} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-text">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xs font-bold">
                            {r.repName.charAt(0)}
                          </div>
                          <span>{r.repName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-numeric text-text-muted">
                        {r.wonCount + r.openCount}
                      </td>
                      <td className="py-2.5 px-3 font-numeric font-semibold text-emerald-600">
                        {r.wonCount}
                      </td>
                      <td className="py-2.5 px-3 font-numeric font-semibold text-indigo-600">
                        {r.meetings}
                      </td>
                      <td className="py-2.5 px-3 font-numeric text-text font-medium">
                        {repRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-numeric font-bold text-emerald-600">
                        {formatCurrency(r.wonValue)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-numeric font-semibold text-text">
                        {formatCurrency(r.openValue)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-text-faint">
                    No sales rep activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
