"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, CalendarPlus, X } from "lucide-react";
import { sendDealEmail, scheduleDealMeeting } from "@/app/actions";

export function DealQuickActions({ dealId, googleConnected }: { dealId: string; googleConnected: boolean }) {
  const [open, setOpen] = useState<"email" | "meeting" | null>(null);
  const [pending, startTransition] = useTransition();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [when, setWhen] = useState("");
  const [result, setResult] = useState<string | null>(null);

  if (!googleConnected) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-text-faint">
        <Mail size={13} />
        Connect Google in{" "}
        <Link href="/settings/integrations" className="underline hover:text-accent">
          Settings &gt; Integrations
        </Link>{" "}
        to email or schedule from here.
      </div>
    );
  }

  function closeAll() {
    setOpen(null);
    setResult(null);
  }

  function handleSendEmail() {
    if (!to.trim() || !subject.trim()) return;
    startTransition(async () => {
      const res = await sendDealEmail({ dealId, to: to.trim(), subject: subject.trim(), body });
      setResult(res.ok ? "Email sent." : `Couldn't send: ${res.reason}`);
      if (res.ok) {
        setTo("");
        setSubject("");
        setBody("");
      }
    });
  }

  function handleScheduleMeeting() {
    if (!summary.trim() || !when) return;
    const start = new Date(when);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    startTransition(async () => {
      const res = await scheduleDealMeeting({
        dealId,
        summary: summary.trim(),
        attendeeEmail: to.trim() || undefined,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      });
      setResult(res.ok ? "Meeting scheduled on your calendar." : `Couldn't schedule: ${res.reason}`);
      if (res.ok) {
        setSummary("");
        setWhen("");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setOpen("email")}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-text-muted hover:border-accent hover:text-accent"
      >
        <Mail size={13} />
        Email
      </button>
      <button
        onClick={() => setOpen("meeting")}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-text-muted hover:border-accent hover:text-accent"
      >
        <CalendarPlus size={13} />
        Schedule meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-text">
                {open === "email" ? "Send an email" : "Schedule a meeting"}
              </p>
              <button onClick={closeAll} className="text-text-faint hover:text-text">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              <input
                placeholder="Contact email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
              />
              {open === "email" ? (
                <>
                  <input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
                  />
                  <textarea
                    placeholder="Message"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={pending}
                    className="w-full rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
                  >
                    {pending ? "Sending..." : "Send"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    placeholder="Meeting title"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
                  />
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="w-full rounded-md border border-border-strong px-2.5 py-1.5 text-[13px] outline-none"
                  />
                  <button
                    onClick={handleScheduleMeeting}
                    disabled={pending}
                    className="w-full rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-60"
                  >
                    {pending ? "Scheduling..." : "Schedule"}
                  </button>
                </>
              )}
              {result && <p className="text-[12px] text-text-muted">{result}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
