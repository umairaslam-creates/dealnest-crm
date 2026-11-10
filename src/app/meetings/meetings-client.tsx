"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Users,
  Video,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Building,
  CalendarCheck,
} from "lucide-react";
import { useToast } from "@/components/toast-context";
import { createMeetingAction, deleteMeetingAction } from "./actions";

export type MeetingEntity = {
  id: string;
  title: string;
  description: string | null;
  meetingType: string;
  startTime: Date | string;
  endTime: Date | string;
  contactId: string | null;
  dealId: string | null;
  userId: string | null;
  googleEventId: string | null;
  location: string | null;
  status: string;
  color: string;
  contact?: { id: string; name: string; title?: string | null; account?: { name: string } | null } | null;
  deal?: { id: string; title: string } | null;
  user?: { id: string; name: string | null } | null;
};

const COLOR_STYLES: Record<
  string,
  { bg: string; border: string; text: string; sub: string; badge: string }
> = {
  blue: {
    bg: "bg-[#eff6ff]",
    border: "border-l-[3.5px] border-[#3b82f6]",
    text: "text-[#1e40af]",
    sub: "text-[#3b82f6]",
    badge: "bg-blue-100/80 text-blue-700",
  },
  yellow: {
    bg: "bg-[#fefce8]",
    border: "border-l-[3.5px] border-[#eab308]",
    text: "text-[#854d0e]",
    sub: "text-[#ca8a04]",
    badge: "bg-amber-100/80 text-amber-800",
  },
  coral: {
    bg: "bg-[#fff1f2]",
    border: "border-l-[3.5px] border-[#f43f5e]",
    text: "text-[#9f1239]",
    sub: "text-[#e11d48]",
    badge: "bg-rose-100/80 text-rose-800",
  },
  green: {
    bg: "bg-[#f0fdf4]",
    border: "border-l-[3.5px] border-[#22c55e]",
    text: "text-[#166534]",
    sub: "text-[#16a34a]",
    badge: "bg-emerald-100/80 text-emerald-800",
  },
  purple: {
    bg: "bg-[#faf5ff]",
    border: "border-l-[3.5px] border-[#a855f7]",
    text: "text-[#6b21a8]",
    sub: "text-[#9333ea]",
    badge: "bg-purple-100/80 text-purple-800",
  },
};

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI"];

function formatGoogleDate(value: Date | string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleCalendarUrl(meeting: MeetingEntity) {
  const details = [
    meeting.description,
    meeting.contact?.name ? `Contact: ${meeting.contact.name}` : "",
    meeting.contact?.account?.name ? `Account: ${meeting.contact.account.name}` : "",
    meeting.deal?.title ? `Deal: ${meeting.deal.title}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates: `${formatGoogleDate(meeting.startTime)}/${formatGoogleDate(meeting.endTime)}`,
    details,
    location: meeting.location || "Google Meet",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function MeetingsClient({
  initialMeetings,
  contacts = [],
  deals = [],
  googleConnected = false,
  googleEmail,
}: {
  initialMeetings: MeetingEntity[];
  contacts: any[];
  deals: any[];
  googleConnected: boolean;
  googleEmail?: string;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [meetingsList, setMeetingsList] = useState<MeetingEntity[]>(initialMeetings);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [calendarViewMode, setCalendarViewMode] = useState<"google" | "classic">("google");

  // Week navigation state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEntity | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Compute Monday of active week
  const monday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff + currentWeekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentWeekOffset]);

  const friday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 4);
    return d;
  }, [monday]);

  const weekLabel = useMemo(() => {
    const monStr = monday.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const friStr = friday.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${monStr} – ${friStr}`;
  }, [monday, friday]);

  // Filter contacts in left pane
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (!contactSearch.trim()) return true;
      const q = contactSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.account?.name && c.account.name.toLowerCase().includes(q))
      );
    });
  }, [contacts, contactSearch]);

  // Filter meetings by selected contact
  const displayedMeetings = useMemo(() => {
    return meetingsList.filter((m) => {
      if (!selectedContactId) return true;
      return m.contactId === selectedContactId;
    });
  }, [meetingsList, selectedContactId]);

  function handleDeleteMeeting(id: string) {
    if (!confirm("Are you sure you want to cancel and remove this meeting?")) return;
    startTransition(async () => {
      try {
        await deleteMeetingAction(id);
        setMeetingsList((prev) => prev.filter((m) => m.id !== id));
        setSelectedMeeting(null);
        toast.success("Meeting removed successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete meeting");
      }
    });
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header Controls (Modeled directly after Image 5) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Week Date Navigator */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-3 py-1.5 shadow-2xs">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 px-1 font-numeric">
              <Calendar size={13} className="text-[#4361ee]" />
              {weekLabel}
            </span>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Next Week"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {currentWeekOffset !== 0 && (
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold text-[#4361ee] shadow-2xs">
            <CalendarCheck size={13} />
            <span>No-login Google add links</span>
          </div>

          {/* Google Calendar Mode vs Classic CRM View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCalendarViewMode("google")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-xs font-bold cursor-pointer ${
                calendarViewMode === "google"
                  ? "bg-white dark:bg-slate-900 text-[var(--color-brand,#4361ee)] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Calendar size={13} className="text-blue-500" />
              <span>Google Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarViewMode("classic")}
              className={`px-3 py-1 rounded-full transition-all text-xs font-bold cursor-pointer ${
                calendarViewMode === "classic"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>CRM Schedule</span>
            </button>
          </div>

          {/* Day / Week / Month Toggle Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 rounded-full transition-all capitalize cursor-pointer ${
                  viewMode === v
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* "+ Schedule Meeting" Button */}
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-300/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>+ Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Main Container: Left Contacts Pane + Right Weekly Grid (Inspired by Image 5) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-[580px]">
        {/* Left Pane: Contacts We Have Meetings With */}
        <div className="w-full md:w-72 shrink-0 flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-2xs p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts or clients..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Meeting Contacts ({contacts.length})
            </span>
            {selectedContactId && (
              <button
                onClick={() => setSelectedContactId(null)}
                className="text-[11px] font-semibold text-[#4361ee] hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-2 pr-0.5">
            <button
              onClick={() => setSelectedContactId(null)}
              className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all ${
                selectedContactId === null
                  ? "bg-indigo-50/80 border border-indigo-100 shadow-2xs"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4361ee] text-white text-xs font-bold shrink-0">
                <Users size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">All Scheduled Contacts</p>
                <p className="text-[10.5px] text-slate-400">{meetingsList.length} appointments</p>
              </div>
            </button>

            {filteredContacts.map((contact) => {
              const initials = contact.name
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const isSelected = selectedContactId === contact.id;
              const contactMeetingsCount = meetingsList.filter(
                (m) => m.contactId === contact.id
              ).length;

              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all ${
                    isSelected
                      ? "bg-indigo-50/80 border border-indigo-200/80 shadow-2xs"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-slate-100 to-indigo-100 text-[#4361ee] text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{contact.name}</p>
                    <p className="text-[10.5px] text-slate-400 truncate">
                      {contact.title || contact.account?.name || "Client Partner"}
                    </p>
                  </div>
                  {contactMeetingsCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {contactMeetingsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Weekly Scheduler Grid (Exact Layout of Image 5) */}
        <div className="flex-1 flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Day Headers Row */}
          <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/60 text-center text-xs font-bold text-slate-500 py-3">
            <div className="text-slate-400 font-normal text-[11px]">TIME</div>
            {DAYS_OF_WEEK.map((dayName, dayIdx) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + dayIdx);
              const isToday =
                new Date().toDateString() === d.toDateString();

              return (
                <div key={dayName} className="flex flex-col items-center justify-center">
                  <span className={`text-[11px] font-bold tracking-wider ${isToday ? "text-[#4361ee]" : "text-slate-600"}`}>
                    {dayName}
                  </span>
                  <span className={`text-[10.5px] font-numeric mt-0.5 ${isToday ? "font-bold text-[#4361ee]" : "text-slate-400"}`}>
                    {d.getDate()} {d.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Rows by Hours */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {HOURS.map((hour) => {
              const hourLabel =
                hour === 12
                  ? "12 pm"
                  : hour > 12
                  ? `${hour - 12} pm`
                  : `${hour} am`;

              return (
                <div key={hour} className="grid grid-cols-6 min-h-[85px] divide-x divide-slate-100">
                  {/* Time label */}
                  <div className="p-2.5 text-[11px] font-bold text-slate-400 font-numeric flex items-start justify-center">
                    {hourLabel}
                  </div>

                  {/* Day cells (0 = Mon, 1 = Tue, ..., 4 = Fri) */}
                  {DAYS_OF_WEEK.map((_, dayIdx) => {
                    // Match meetings falling on this day and hour
                    const dayDate = new Date(monday);
                    dayDate.setDate(monday.getDate() + dayIdx);

                    const cellMeetings = displayedMeetings.filter((m) => {
                      const mStart = new Date(m.startTime);
                      return (
                        mStart.getFullYear() === dayDate.getFullYear() &&
                        mStart.getMonth() === dayDate.getMonth() &&
                        mStart.getDate() === dayDate.getDate() &&
                        mStart.getHours() === hour
                      );
                    });

                    return (
                      <div key={dayIdx} className="p-1.5 space-y-1 relative group hover:bg-slate-50/40 transition-colors">
                        {cellMeetings.map((meeting) => {
                          const style = COLOR_STYLES[meeting.color] || COLOR_STYLES.blue;
                          const startStr = new Date(meeting.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const endStr = new Date(meeting.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={meeting.id}
                              onClick={() => setSelectedMeeting(meeting)}
                              className={`p-2 rounded-xl text-left cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.01] transition-all ${style.bg} ${style.border}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-bold text-[11.5px] leading-tight truncate ${style.text}`}>
                                  {meeting.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 mt-1 font-numeric text-[10px] font-semibold">
                                <Clock size={10} className={style.sub} />
                                <span className={style.sub}>
                                  {startStr} – {endStr}
                                </span>
                              </div>

                              {meeting.location === "Google Meet" && (
                                <div className="flex items-center gap-1 mt-1 text-[9.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 rounded-md px-1.5 py-0.5 w-fit">
                                  <Video size={10} />
                                  <span>Google Meet</span>
                                </div>
                              )}

                              {meeting.description && (
                                <p className={`text-[10px] line-clamp-1 mt-0.5 ${style.text} opacity-90`}>
                                  {meeting.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    COLOR_STYLES[selectedMeeting.color]?.bg || "bg-indigo-50"
                  } ${COLOR_STYLES[selectedMeeting.color]?.text || "text-indigo-600"}`}
                >
                  <Video size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{selectedMeeting.title}</h3>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={14} className="text-slate-400" />
                <span className="font-numeric font-bold">
                  {new Date(selectedMeeting.startTime).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(selectedMeeting.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {selectedMeeting.contact && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  <span>
                    Contact:{" "}
                    <strong className="text-slate-900">{selectedMeeting.contact.name}</strong>{" "}
                    {selectedMeeting.contact.account && `(${selectedMeeting.contact.account.name})`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                <span>{selectedMeeting.location || "Google Meet"}</span>
              </div>

              {selectedMeeting.description && (
                <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 text-slate-700">
                  <p className="font-semibold text-slate-900 mb-0.5">Meeting Agenda / Notes:</p>
                  <p className="whitespace-pre-wrap">{selectedMeeting.description}</p>
                </div>
              )}

              <a
                href={selectedMeeting.googleEventId || googleCalendarUrl(selectedMeeting)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#4361ee] font-semibold hover:underline"
              >
                <ExternalLink size={13} />
                <span>
                  {selectedMeeting.googleEventId ? "View in Google Calendar" : "Add to Google Calendar"}
                </span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                disabled={isPending}
                className="flex items-center gap-1 rounded-full text-rose-600 hover:bg-rose-50 px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <Trash2 size={13} />
                <span>Cancel Meeting</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-4 py-1.5 text-xs font-bold text-white shadow-2xs"
                >
                  <Video size={13} />
                  <span>Join Google Meet</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {scheduleModalOpen && (
          <ScheduleMeetingModal
            contacts={contacts}
            deals={deals}
            onClose={() => setScheduleModalOpen(false)}
          onCreated={(newMeeting) => {
            setMeetingsList((prev) => [...prev, newMeeting]);
            setScheduleModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ScheduleMeetingModal({
  contacts = [],
  deals = [],
  onClose,
  onCreated,
}: {
  contacts: any[];
  deals: any[];
  onClose: () => void;
  onCreated: (meeting: MeetingEntity) => void;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactId, setContactId] = useState(contacts[0]?.id || "");
  const [dealId, setDealId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:45");
  const [color, setColor] = useState("blue");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Meeting title and date are required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("contactId", contactId);
      formData.append("dealId", dealId);
      formData.append("date", date);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      formData.append("color", color);

      try {
        const res = await createMeetingAction(formData);
        const contactObj = contacts.find((c) => c.id === contactId);

        onCreated({
          id: res.id,
          title,
          description,
          meetingType: "DEMO",
          startTime: new Date(`${date}T${startTime}:00`),
          endTime: new Date(`${date}T${endTime}:00`),
          contactId: contactId || null,
          dealId: dealId || null,
          userId: null,
          googleEventId: null,
          location: "Google Meet",
          status: "SCHEDULED",
          color,
          contact: contactObj,
        });
        toast.success("Meeting scheduled successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to schedule meeting");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#4361ee]">
              <Calendar size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Schedule New Appointment</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Meeting Title / Agenda *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart POS Hardware Demo & SLA Negotiation"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Contact / Client
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.account?.name ? `(${c.account.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Associated Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="">None / General Inquiry</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Tag (Blue, Yellow, Coral, Green, Purple from inspiration screenshot) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Appointment Color Tag
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: "blue", label: "Demo", color: "bg-blue-500" },
                { id: "yellow", label: "Strategy", color: "bg-amber-400" },
                { id: "coral", label: "Urgent", color: "bg-rose-500" },
                { id: "green", label: "Follow-up", color: "bg-emerald-500" },
                { id: "purple", label: "Negotiation", color: "bg-purple-500" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border transition-all ${
                    color === c.id
                      ? "border-slate-800 bg-slate-100 ring-1 ring-slate-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                  <span className="capitalize">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description &amp; Agenda
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline meeting discussion points, deliverables, or dial-in notes..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-[#4361ee]" />
              <div>
                <p className="text-xs font-bold text-slate-900">Google Calendar ready</p>
                <p className="text-[10.5px] text-slate-500">
                  After saving, open the meeting and click Add to Google Calendar. No connection required.
                </p>
              </div>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#4361ee] hover:bg-[#3a56d4] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-300/30 disabled:opacity-50"
            >
              {isPending ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
