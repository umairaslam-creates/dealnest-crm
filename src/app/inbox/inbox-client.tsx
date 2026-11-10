"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  Star,
  Trash2,
  Send,
  Plus,
  RefreshCw,
  Archive,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Reply,
  Forward,
  MoreVertical,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Users,
  Handshake,
  Calendar,
  Check,
  Globe,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { sendGmailEmailAction, toggleGoogleConnectionAction } from "@/app/actions/integrations";

export type EmailThread = {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  unread: boolean;
  starred: boolean;
  folder: "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "trash";
  labels: string[];
  dealTitle?: string;
  dealValue?: number;
  contactName?: string;
  contactTitle?: string;
  hasAttachment?: boolean;
};

const SEED_EMAILS: EmailThread[] = [
  {
    id: "email-1",
    senderName: "Fahad Al-Otaibi",
    senderEmail: "fahad.otaibi@aramco.com",
    subject: "RE: Enterprise SoftPOS Deployment Agreement - Final Procurement Review",
    snippet:
      "Hello Ahmad, our executive steering committee approved the $500,000 deployment scope for our eastern distribution terminals. Please send the final countersigned SLA...",
    body: `Dear Ahmad,

Thank you for demonstrating the DEALNEST SoftPOS integration last Tuesday. 

Our executive steering committee has completed their review and officially approved the procurement order for the SoftPOS multi-terminal roll-out ($500,000 annual scope). 

Before we release the purchase order, please provide:
1. The countersigned Master Service Agreement (MSA).
2. Contact details for your dedicated Technical Account Manager.
3. Confirmation of PCI-DSS Level 1 compliance documentation.

We are excited to partner with DEALNEST across our eastern province retail network.

Best regards,
Fahad Al-Otaibi
VP Corporate Procurement & Retail Operations
Saudi Aramco`,
    date: "10:45 AM",
    unread: true,
    starred: true,
    folder: "inbox",
    labels: ["Enterprise Deals", "VIP Clients"],
    dealTitle: "Saudi Aramco Retail SoftPOS Rollout",
    dealValue: 500000,
    contactName: "Fahad Al-Otaibi",
    contactTitle: "VP Procurement",
    hasAttachment: true,
  },
  {
    id: "email-2",
    senderName: "Noura Al-Shehri",
    senderEmail: "noura.shehri@stc.com.sa",
    subject: "Inquiry: Cloud CRM Integration & Telemetry Analytics Suite",
    snippet:
      "Hi Ahmad, We are evaluating enterprise sales pipeline platforms for our regional enterprise account team (85 reps). Can we schedule a technical deep dive this Thursday?",
    body: `Hi Ahmad,

I came across DEALNEST's recent enterprise deployment with SoftPOS and was impressed with the real-time pipeline visibility. 

At STC Enterprise, our enterprise B2B sales division (approx 85 account managers) is currently evaluating replacements for our legacy pipeline tooling. We require:
- Automated lead score calculations.
- Bi-directional Google Calendar and Gmail synchronisation.
- Multi-currency financial forecasting (SAR / USD).

Can we schedule a 45-minute Google Meet demonstration for this Thursday at 2:00 PM AST?

Warm regards,
Noura Al-Shehri
Director of Digital Sales Architecture
STC Enterprise Solutions`,
    date: "Yesterday",
    unread: true,
    starred: false,
    folder: "inbox",
    labels: ["Enterprise Deals", "Hot Inquiries"],
    dealTitle: "STC Cloud CRM Migration",
    dealValue: 320000,
    contactName: "Noura Al-Shehri",
    contactTitle: "Director of Digital Sales",
    hasAttachment: false,
  },
  {
    id: "email-3",
    senderName: "Tariq Mansoor",
    senderEmail: "tariq.mansoor@alrajhibank.com.sa",
    subject: "Contract Negotiation: Payment Processing & SoftPOS Gateway Integration",
    snippet:
      "Ahmad, please find attached our legal department's redline on section 4.2 (data residency within KSA). All other commercial terms are acceptable.",
    body: `Ahmad,

Our legal counsel has concluded their review of the DEALNEST software licensing contract. 

Attached is our redlined document. The primary revision pertains to Clause 4.2 ensuring full compliance with SAMA data residency requirements inside the Kingdom. The commercial discount of 12% across Year 1 and Year 2 has been approved.

Please review and confirm if your legal team can accept these edits by Wednesday noon so we can execute before end of quarter.

Regards,
Tariq Mansoor
Head of Merchant Acquiring & Partnerships
Al Rajhi Banking Group`,
    date: "Sep 19",
    unread: false,
    starred: true,
    folder: "inbox",
    labels: ["Contract Negotiations"],
    dealTitle: "Al Rajhi Merchant Acquiring Gateway",
    dealValue: 750000,
    contactName: "Tariq Mansoor",
    contactTitle: "Head of Merchant Acquiring",
    hasAttachment: true,
  },
  {
    id: "email-4",
    senderName: "Google Calendar",
    senderEmail: "calendar-notification@google.com",
    subject: "Accepted: Technical Architecture Review with STC @ Thu Sep 24, 2026 2pm - 2:45pm",
    snippet:
      "Noura Al-Shehri has accepted this invitation. Google Meet joining info: https://meet.google.com/qxr-mkpv-yzt...",
    body: `Google Calendar Notification:

Noura Al-Shehri has accepted your meeting invitation:
"Technical Architecture Review with STC Enterprise"

When: Thursday, Sep 24, 2026 · 2:00 PM – 2:45 PM AST
Location: Google Meet (https://meet.google.com/qxr-mkpv-yzt)
Guests: 
- ahmad.aziz@mytm.co (Organizer)
- noura.shehri@stc.com.sa (Accepted)
- tech.architect@mytm.co (Accepted)

Attached to DEALNEST Deal: STC Cloud CRM Migration ($320,000).`,
    date: "Sep 18",
    unread: false,
    starred: false,
    folder: "inbox",
    labels: ["Hot Inquiries"],
    dealTitle: "STC Cloud CRM Migration",
    dealValue: 320000,
    contactName: "Noura Al-Shehri",
    hasAttachment: false,
  },
  {
    id: "email-5",
    senderName: "You (Ahmad Aziz)",
    senderEmail: "ahmad.aziz@mytm.co",
    subject: "Proposal: DEALNEST Enterprise Tier Licensing for Saudi Telecom",
    snippet:
      "Dear Noura, As discussed during our discovery session, please find attached our comprehensive commercial proposal for 85 enterprise seats...",
    body: `Dear Noura,

Following our introductory call, I am pleased to submit our formal commercial proposal for the DEALNEST Enterprise Sales Intelligence platform. 

The attached documentation outlines:
- Complete feature roadmap including autonomous AI Copilot.
- Single Sign-On (SSO) and RBAC security architecture.
- 99.95% uptime SLA backed by enterprise support.

I look forward to our technical review this Thursday.

Best regards,
Ahmad Aziz
Head of Enterprise Sales & Partnerships
DEALNEST CRM`,
    date: "Sep 17",
    unread: false,
    starred: false,
    folder: "sent",
    labels: ["Enterprise Deals"],
    dealTitle: "STC Cloud CRM Migration",
    dealValue: 320000,
    contactName: "Noura Al-Shehri",
    hasAttachment: true,
  },
];

export function InboxClient({
  contacts = [],
  deals = [],
  googleConnected = false,
  googleEmail,
  currentUser,
}: {
  contacts: any[];
  deals: any[];
  googleConnected: boolean;
  googleEmail?: string;
  currentUser?: any;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  // State
  const [emails, setEmails] = useState<EmailThread[]>(SEED_EMAILS);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isGoogleActive, setIsGoogleActive] = useState(googleConnected);

  // Compose Modal State
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeDealId, setComposeDealId] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  // Selected Email
  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) || null,
    [emails, selectedEmailId]
  );

  // Filter emails based on folder, label, search
  const filteredEmails = useMemo(() => {
    return emails.filter((e) => {
      // Folder match
      if (activeFolder === "starred") {
        if (!e.starred) return false;
      } else if (activeFolder === "unread") {
        if (!e.unread) return false;
      } else if (activeFolder !== "all") {
        if (e.folder !== activeFolder && activeFolder !== "inbox") return false;
        if (activeFolder === "inbox" && e.folder !== "inbox") return false;
      }

      // Label match
      if (selectedLabel && !e.labels.includes(selectedLabel)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.senderName.toLowerCase().includes(q) ||
          e.senderEmail.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [emails, activeFolder, selectedLabel, searchQuery]);

  const unreadCount = useMemo(
    () => emails.filter((e) => e.folder === "inbox" && e.unread).length,
    [emails]
  );

  // Toggle Star
  function toggleStar(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
  }

  // Delete Email
  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, folder: "trash" } : item))
    );
    if (selectedEmailId === id) {
      setSelectedEmailId(null);
    }
    toast.success("Email moved to Trash");
  }

  // Toggle Read/Unread
  function handleSelectEmail(email: EmailThread) {
    setSelectedEmailId(email.id);
    if (email.unread) {
      setEmails((prev) =>
        prev.map((item) => (item.id === email.id ? { ...item, unread: false } : item))
      );
    }
  }

  // Send Email Action
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast.error("Please provide both a recipient and a subject.");
      return;
    }

    setSendingEmail(true);
    const res = await sendGmailEmailAction({
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      dealId: composeDealId || undefined,
    });
    setSendingEmail(false);

    if (res.success) {
      const newEmail: EmailThread = {
        id: `email-${Date.now()}`,
        senderName: currentUser?.name || "Ahmad Aziz",
        senderEmail: googleEmail || "ahmad.aziz@mytm.co",
        subject: composeSubject.trim(),
        snippet: composeBody.trim().slice(0, 100) + "...",
        body: composeBody.trim(),
        date: "Just now",
        unread: false,
        starred: false,
        folder: "sent",
        labels: ["Enterprise Deals"],
        dealTitle: deals.find((d) => d.id === composeDealId)?.title || "Commercial Deal",
      };
      setEmails((prev) => [newEmail, ...prev]);
      toast.success(res.message || "Email sent via Gmail successfully.");
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } else {
      toast.error(res.error || "Failed to dispatch email.");
    }
  }

  // AI Draft Assistance
  function handleAiDraft(type: "followup" | "pitch" | "negotiation" | "confirm") {
    setAiDrafting(true);
    setTimeout(() => {
      setAiDrafting(false);
      if (type === "followup") {
        setComposeSubject("Follow-up: DEALNEST Software Integration & Next Milestones");
        setComposeBody(
          `Dear Partner,\n\nI hope you are having a productive week.\n\nI wanted to follow up on our discussion regarding the DEALNEST platform. We have prepared the deployment architecture documents and would love to review any open questions from your executive team.\n\nCould we connect for a brief 15-minute call this week?\n\nWarm regards,\n${currentUser?.name || "Ahmad Aziz"}`
        );
      } else if (type === "negotiation") {
        setComposeSubject("RE: Commercial Terms & SLA Review");
        setComposeBody(
          `Dear Colleague,\n\nThank you for sharing your feedback on the contract terms. We have reviewed your redline revisions with our executive leadership.\n\nWe are pleased to confirm that we can accommodate your data residency requirements and warranty terms. I have updated the attached schedule accordingly.\n\nLooking forward to finalizing the agreement.\n\nBest regards,\n${currentUser?.name || "Ahmad Aziz"}`
        );
      } else if (type === "pitch") {
        setComposeSubject("Strategic Partnership: Modern Sales Pipeline Intelligence with DEALNEST");
        setComposeBody(
          `Hello,\n\nI noticed your organization's recent expansion in enterprise merchant operations. At DEALNEST, we help high-growth sales teams automate pipeline execution and elevate deal velocity through real-time telemetry.\n\nI would welcome the opportunity to share a quick 10-minute overview of how we supported similar initiatives.\n\nBest,\n${currentUser?.name || "Ahmad Aziz"}`
        );
      } else {
        setComposeSubject("Confirmation: Scheduled Google Meet Strategy Session");
        setComposeBody(
          `Hello,\n\nThis email confirms our upcoming strategy meeting scheduled on Google Meet.\n\nAgenda:\n1. Overview of business requirements\n2. DEALNEST system demonstration\n3. Q&A and next steps\n\nLooking forward to speaking soon.\n\nBest,\n${currentUser?.name || "Ahmad Aziz"}`
        );
      }
      toast.success("AI draft generated successfully.");
    }, 450);
  }

  // 1-Click Connect Google
  async function handleConnectGoogle() {
    startTransition(async () => {
      const res = await toggleGoogleConnectionAction(true, googleEmail);
      if ((res as any).redirectUrl) {
        window.location.href = (res as any).redirectUrl;
        return;
      }
      if (res.success) {
        setIsGoogleActive(true);
        toast.success("Google Workspace Gmail connected.");
      }
    });
  }

  return (
    <div className="flex flex-col h-full space-y-3 font-sans">
      {/* Google Connection Header Banner */}
      {!isGoogleActive && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500 font-bold shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Connect Your Google Workspace Account</p>
              <p className="text-[11px] text-text-muted">
                Sync live emails directly with your deals, contacts, and appointments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand,#4361ee)] hover:opacity-90 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            <Globe size={13} />
            <span>Connect Gmail</span>
          </button>
        </div>
      )}

      {/* Main Gmail Shell */}
      <div className="flex-1 flex flex-col md:flex-row rounded-3xl border border-white/10 bg-surface shadow-md overflow-hidden min-h-[640px]">
        {/* Left Gmail Sidebar */}
        <div className="w-full md:w-60 shrink-0 border-r border-border bg-surface-2/30 p-3.5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Authentic Google Compose Button */}
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="w-full flex items-center gap-3 rounded-2xl bg-[var(--color-brand,#4361ee)] hover:opacity-95 text-white px-4 py-3 text-xs font-bold shadow-md shadow-indigo-400/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Plus size={14} strokeWidth={3} />
              </div>
              <span className="text-[13px] tracking-wide">Compose</span>
            </button>

            {/* Folder Navigation */}
            <div className="space-y-0.5">
              {[
                { id: "inbox", label: "Inbox", icon: Mail, badge: unreadCount },
                { id: "starred", label: "Starred", icon: Star },
                { id: "sent", label: "Sent", icon: Send },
                { id: "drafts", label: "Drafts", icon: Paperclip },
                { id: "trash", label: "Trash", icon: Trash2 },
              ].map((f) => {
                const Icon = f.icon;
                const isActive = activeFolder === f.id && selectedLabel === null;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveFolder(f.id);
                      setSelectedLabel(null);
                      setSelectedEmailId(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-brand/10 text-brand font-bold"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className={isActive ? "text-brand" : "text-text-muted"} />
                      <span>{f.label}</span>
                    </div>
                    {f.badge ? (
                      <span className="rounded-full bg-brand text-white text-[10px] font-bold px-2 py-0.5">
                        {f.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* CRM Deal Labels */}
            <div className="pt-3 border-t border-border">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-text-faint px-3 mb-2">
                CRM Labels
              </span>
              <div className="space-y-0.5">
                {[
                  { id: "Enterprise Deals", color: "bg-blue-500" },
                  { id: "Hot Inquiries", color: "bg-amber-400" },
                  { id: "Contract Negotiations", color: "bg-purple-500" },
                  { id: "VIP Clients", color: "bg-emerald-500" },
                ].map((lbl) => {
                  const isSelected = selectedLabel === lbl.id;
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => {
                        setSelectedLabel(lbl.id);
                        setSelectedEmailId(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-surface-2 text-text font-bold"
                          : "text-text-muted hover:bg-surface-2/60 hover:text-text"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${lbl.color} shrink-0`} />
                      <span className="truncate">{lbl.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account Status Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-faint px-1">
            <span className="truncate">{googleEmail || "ahmad.aziz@mytm.co"}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          </div>
        </div>

        {/* Center/Right Area: Email List or Email Reader Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Top Mail Toolbar & Search */}
          <div className="flex items-center justify-between gap-3 p-3.5 border-b border-border bg-surface-2/20">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in mail by sender, subject, or snippet..."
                  className="w-full rounded-2xl border border-border bg-surface px-3.5 py-1.5 pl-9 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.success("Inbox refreshed.")}
                className="p-2 text-text-muted hover:text-text rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              {selectedEmailId && (
                <button
                  type="button"
                  onClick={() => setSelectedEmailId(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text px-2 py-1 rounded-lg hover:bg-surface-2"
                >
                  <ArrowLeft size={13} />
                  <span>Back to List</span>
                </button>
              )}
            </div>
          </div>

          {/* View Container */}
          {selectedEmail ? (
            /* EMAIL THREAD DETAIL VIEW */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 animate-in fade-in duration-100">
              {/* Email Subject Heading */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-bold text-text tracking-tight flex items-center gap-2">
                    <span>{selectedEmail.subject}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {selectedEmail.labels.map((lbl) => (
                      <span
                        key={lbl}
                        className="rounded-md bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => toggleStar(selectedEmail.id, e)}
                    className="p-1.5 text-text-muted hover:text-amber-400 rounded-lg"
                  >
                    <Star
                      size={16}
                      className={selectedEmail.starred ? "fill-amber-400 text-amber-400" : ""}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(selectedEmail.id, e)}
                    className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg"
                    title="Delete Email"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* CRM Context Pill Card */}
              {selectedEmail.dealTitle && (
                <div className="p-3.5 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand font-bold">
                      <Handshake size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{selectedEmail.dealTitle}</span>
                        {selectedEmail.dealValue && (
                          <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-numeric">
                            SAR {selectedEmail.dealValue.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">
                        Linked Contact: {selectedEmail.contactName} ({selectedEmail.contactTitle || "Stakeholder"})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/deals"
                      className="rounded-xl border border-brand/30 bg-surface px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
                    >
                      View Deal
                    </Link>
                    <Link
                      href="/meetings"
                      className="rounded-xl bg-[var(--color-brand,#4361ee)] text-white px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Schedule Meeting
                    </Link>
                  </div>
                </div>
              )}

              {/* Sender Info Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-indigo-500 text-white font-bold text-sm shadow-xs">
                    {selectedEmail.senderName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text flex items-center gap-2">
                      <span>{selectedEmail.senderName}</span>
                      <span className="text-[11px] font-normal text-text-muted">
                        &lt;{selectedEmail.senderEmail}&gt;
                      </span>
                    </p>
                    <p className="text-[10.5px] text-text-faint">to me (ahmad.aziz@mytm.co)</p>
                  </div>
                </div>
                <span className="text-xs font-numeric text-text-muted">{selectedEmail.date}</span>
              </div>

              {/* Message Body Content */}
              <div className="p-4 rounded-2xl bg-surface-2/30 border border-border text-xs text-text leading-relaxed whitespace-pre-wrap">
                {selectedEmail.body}
              </div>

              {/* Quick Reply Bar */}
              <div className="p-4 rounded-2xl border border-border bg-surface-2/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Reply size={14} className="text-brand" />
                    <span>Quick Reply to {selectedEmail.senderName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeTo(selectedEmail.senderEmail);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      handleAiDraft("negotiation");
                      setComposeOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Draft Reply with AI</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder={`Write your reply to ${selectedEmail.senderName}...`}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text placeholder:text-text-faint focus:border-brand focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success("Draft saved.")}
                    className="rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Reply dispatched via Gmail.")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-white px-4 py-1.5 text-xs font-bold hover:opacity-90"
                  >
                    <Send size={13} />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EMAIL LIST VIEW */
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 text-center p-6 text-text-muted">
                  <Mail size={36} className="text-text-faint mb-2" />
                  <p className="text-sm font-bold text-text">No emails found in this folder</p>
                  <p className="text-xs text-text-faint mt-1">Try switching folders or clearing search query.</p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`flex items-center justify-between gap-3 p-3.5 hover:bg-surface-2/60 cursor-pointer transition-colors ${
                      email.unread ? "bg-surface-2/40 font-bold" : ""
                    }`}
                  >
                    {/* Left: Star + Sender */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 sm:max-w-xs">
                      <button
                        type="button"
                        onClick={(e) => toggleStar(email.id, e)}
                        className="text-text-muted hover:text-amber-400 p-0.5"
                      >
                        <Star
                          size={15}
                          className={email.starred ? "fill-amber-400 text-amber-400" : ""}
                        />
                      </button>

                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-xs truncate ${
                            email.unread ? "font-bold text-text" : "font-medium text-text-muted"
                          }`}
                        >
                          {email.senderName}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Subject & Snippet */}
                    <div className="min-w-0 flex-1 flex items-center gap-2 truncate">
                      {email.labels.slice(0, 1).map((lbl) => (
                        <span
                          key={lbl}
                          className="shrink-0 rounded-md bg-brand/10 border border-brand/20 px-1.5 py-0.2 text-[9.5px] font-bold text-brand"
                        >
                          {lbl}
                        </span>
                      ))}
                      <span
                        className={`text-xs truncate ${
                          email.unread ? "font-bold text-text" : "font-medium text-text"
                        }`}
                      >
                        {email.subject}
                      </span>
                      <span className="text-xs text-text-faint truncate hidden sm:inline">
                        — {email.snippet}
                      </span>
                    </div>

                    {/* Right: Clip + Date */}
                    <div className="flex items-center gap-2 shrink-0 text-right">
                      {email.hasAttachment && (
                        <Paperclip size={13} className="text-text-muted shrink-0" />
                      )}
                      <span className="text-[11px] font-numeric font-medium text-text-muted">
                        {email.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING GMAIL COMPOSE MODAL */}
      {composeOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg rounded-3xl border border-white/20 bg-[#0e1019]/95 text-slate-100 shadow-[0_20px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/[0.08]">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Mail size={14} className="text-[var(--color-brand,#4361ee)]" />
              <span>New Message (Gmail)</span>
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="p-1 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSendEmail} className="p-4 space-y-3">
            {/* To Input with Contact Quick Pick */}
            <div>
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1.5">
                <span className="text-xs text-slate-400 w-10">To:</span>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="client@company.com"
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Quick Contacts Pills */}
              {contacts.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
                  <span className="text-[10px] text-slate-500 shrink-0">CRM Contacts:</span>
                  {contacts.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setComposeTo(c.email || `${c.name.toLowerCase().replace(" ", ".")}@company.com`)}
                      className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] px-2 py-0.5 text-[10px] text-slate-300 font-medium shrink-0 cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject Input */}
            <div className="border-b border-white/[0.08] pb-1.5">
              <input
                type="text"
                required
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-transparent text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* AI Sales Assist Toolbar */}
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <Sparkles size={13} />
                <span>AI Sales Drafter:</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAiDraft("followup")}
                  className="rounded-lg bg-white/[0.08] hover:bg-white/[0.16] px-2 py-1 text-[10.5px] font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Follow-up
                </button>
                <button
                  type="button"
                  onClick={() => handleAiDraft("negotiation")}
                  className="rounded-lg bg-white/[0.08] hover:bg-white/[0.16] px-2 py-1 text-[10.5px] font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Negotiation
                </button>
                <button
                  type="button"
                  onClick={() => handleAiDraft("pitch")}
                  className="rounded-lg bg-white/[0.08] hover:bg-white/[0.16] px-2 py-1 text-[10.5px] font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Pitch
                </button>
                <button
                  type="button"
                  onClick={() => handleAiDraft("confirm")}
                  className="rounded-lg bg-white/[0.08] hover:bg-white/[0.16] px-2 py-1 text-[10.5px] font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Confirm Meeting
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <textarea
                rows={7}
                required
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your email here or click an AI template above..."
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Linked Deal Selector */}
            {deals.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08]">
                <span className="text-[11px] text-slate-400 shrink-0">Link to Deal:</span>
                <select
                  value={composeDealId}
                  onChange={(e) => setComposeDealId(e.target.value)}
                  className="flex-1 rounded-xl bg-white/[0.05] border border-white/[0.1] px-2 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">No deal attached</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} {d.value ? `(SAR ${d.value.toLocaleString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Discard Draft"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="submit"
                disabled={sendingEmail}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand,#4361ee)] hover:bg-[#3a56d4] text-white px-5 py-2 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
