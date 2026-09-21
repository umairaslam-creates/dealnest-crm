"use client";

import React, { useState } from "react";
import { X, User, Building, Mail, Phone, Briefcase, Loader2 } from "lucide-react";
import { createContact, updateContact } from "@/app/actions";
import { useToast } from "./toast-context";

export type ContactEntity = {
  id: string;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  accountId?: string | null;
};

export function ContactModal({
  open,
  onClose,
  contactToEdit,
  accounts = [],
}: {
  open: boolean;
  onClose: () => void;
  contactToEdit?: ContactEntity | null;
  accounts?: { id: string; name: string }[];
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(contactToEdit?.name ?? "");
  const [title, setTitle] = useState(contactToEdit?.title ?? "");
  const [email, setEmail] = useState(contactToEdit?.email ?? "");
  const [phone, setPhone] = useState(contactToEdit?.phone ?? "");
  const [accountId, setAccountId] = useState(contactToEdit?.accountId ?? "");
  const [newAccountName, setNewAccountName] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Contact name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (contactToEdit) {
        await updateContact(contactToEdit.id, {
          name: name.trim(),
          title: title.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          accountId: accountId || null,
        });
        toast.success("Contact updated successfully!");
      } else {
        await createContact({
          name: name.trim(),
          title: title.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          accountId: accountId || undefined,
          newAccountName: !accountId && newAccountName.trim() ? newAccountName.trim() : undefined,
        });
        toast.success("Contact added successfully!");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the contact.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-border-strong bg-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              {contactToEdit ? "Edit Contact" : "Add New Contact"}
            </h2>
            <p className="text-[12px] text-text-muted">
              {contactToEdit ? "Update contact information" : "Save key stakeholder and company decision maker"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-faint hover:bg-surface hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
              <User size={13} className="text-text-muted" /> Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Noura Al-Shehri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
              <Briefcase size={13} className="text-text-muted" /> Job Title / Role
            </label>
            <input
              type="text"
              placeholder="e.g. Chief Technology Officer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Mail size={13} className="text-text-muted" /> Email Address
              </label>
              <input
                type="email"
                placeholder="noura@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
                <Phone size={13} className="text-text-muted" /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="+966 55 987 6543"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none focus:border-ink"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text mb-1.5">
              <Building size={13} className="text-text-muted" /> Account / Company
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-ink"
            >
              <option value="">No account (or type new below)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {!accountId && (
            <div>
              <input
                type="text"
                placeholder="New Company name (creates account automatically)"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-text outline-none"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[13px] font-medium text-white hover:bg-ink-hover disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {contactToEdit ? "Save Changes" : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

