"use client";

import React, { useState } from "react";
import {
  MessageSquareHeart,
  Star,
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { submitFeedback } from "@/app/actions";
import { useToast } from "@/components/toast-context";

type FeedbackItem = {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  createdAt: Date | string;
  user?: { name: string | null } | null;
};

export function FeedbackClient({
  initialFeedback = [],
}: {
  initialFeedback: FeedbackItem[];
}) {
  const toast = useToast();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(initialFeedback);
  const [type, setType] = useState<string>("IMPROVEMENT");
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please describe your feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFeedback({
        type,
        rating,
        message: message.trim(),
      });
      toast.success("Thank you! Your feedback has been recorded.");
      setFeedbackList((prev) => [res as any, ...prev]);
      setMessage("");
    } catch (err) {
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryIcons: Record<string, any> = {
    FEATURE: Lightbulb,
    BUG: Bug,
    IMPROVEMENT: Sparkles,
    QUESTION: HelpCircle,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Welcome Banner */}
      <div className="card p-6 bg-gradient-to-r from-surface to-surface-2 border-border flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-ink to-slate-800 text-white flex items-center justify-center shrink-0 shadow-md">
          <MessageSquareHeart size={24} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-text">Customer Support &amp; Product Feedback</h2>
          <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
            Help us shape the MYTM Sales CRM. Report operational bottlenecks, request new workflow
            automations, or share ideas to empower the sales team.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Left: Feedback Submission Form */}
        <div className="md:col-span-3 card p-5 space-y-4">
          <h3 className="text-[15px] font-semibold text-text">Share Your Feedback</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector pills */}
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-2">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "IMPROVEMENT", label: "Improvement", icon: Sparkles },
                  { id: "FEATURE", label: "New Feature", icon: Lightbulb },
                  { id: "BUG", label: "Issue / Bug", icon: Bug },
                  { id: "QUESTION", label: "Support Query", icon: HelpCircle },
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-[12.5px] font-medium transition-all ${
                        type === cat.id
                          ? "border-ink bg-ink text-white shadow-sm"
                          : "border-border bg-surface hover:bg-surface-2 text-text"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Overall CRM Experience Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded-md text-text-faint hover:text-amber-500 transition-colors"
                  >
                    <Star
                      size={22}
                      className={
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-border-strong"
                      }
                    />
                  </button>
                ))}
                <span className="text-[12px] font-medium text-text-muted ml-2">
                  {rating === 5
                    ? "Excellent ⭐"
                    : rating === 4
                      ? "Very Good"
                      : rating === 3
                        ? "Average"
                        : "Needs Attention"}
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[12.5px] font-medium text-text mb-1.5">
                Your Thoughts or Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what would make your daily prospecting and closing workflow smoother..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-[13px] text-text placeholder:text-text-faint outline-none focus:border-ink focus:ring-1 focus:ring-ink resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ink text-white text-[13px] font-semibold hover:bg-ink-hover shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>Submit to Product Team</span>
            </button>
          </form>
        </div>

        {/* Right: Previously Logged Feedback */}
        <div className="md:col-span-2 card p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text">Team Submissions</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-2 text-text-faint">
              {feedbackList.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1">
            {feedbackList.length === 0 ? (
              <div className="py-12 text-center text-[12.5px] text-text-muted">
                No submissions recorded yet. Be the first to share an idea!
              </div>
            ) : (
              feedbackList.map((item) => {
                const Icon = categoryIcons[item.type] ?? Sparkles;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-border bg-surface-2/40 space-y-1.5 text-[12.5px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-semibold text-ink text-[11.5px] uppercase">
                        <Icon size={12} className="text-accent" />
                        {item.type}
                      </span>
                      <span suppressHydrationWarning className="text-[11px] text-text-faint">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-text leading-snug">{item.message}</p>

                    {item.rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

