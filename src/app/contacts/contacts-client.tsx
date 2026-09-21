"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Users,
  ChevronRight,
  Handshake,
} from "lucide-react";
import { deleteContact } from "@/app/actions";
import { ContactModal, ContactEntity } from "@/components/contact-modal";
import { ContactDetailDrawer } from "./contact-detail-drawer";
import { useToast } from "@/components/toast-context";

type Contact = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role?: string | null;
  accountId?: string | null;
  account: { name: string; region?: string | null; industry?: string | null; deals?: any[] } | null;
  activities?: any[];
  createdAt?: Date | string;
};
type Account = { id: string; name: string };

export function ContactsClient({
  contacts,
  accounts,
  deals = [],
  tasks = [],
  members = [],
}: {
  contacts: Contact[];
  accounts: Account[];
  deals?: any[];
  tasks?: any[];
  members?: any[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactEntity | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (accountFilter !== "ALL" && c.accountId !== accountFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchTitle = c.title?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchAccount = c.account?.name.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchEmail && !matchPhone && !matchAccount) {
          return false;
        }
      }
      return true;
    });
  }, [contacts, accountFilter, searchQuery]);

  async function handleDelete(contact: Contact) {
    if (!confirm(`Are you sure you want to delete contact "${contact.name}"?`)) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contact deleted.");
      if (selectedContact?.id === contact.id) setSelectedContact(null);
    } catch (err) {
      toast.error("Failed to delete contact.");
    }
  }

  function handleEdit(contact: Contact) {
    setEditingContact({
      id: contact.id,
      name: contact.name,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      accountId: contact.accountId,
    });
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingContact(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Top Metrics Banner (Client Accounts card removed as requested) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-slate-500">Total Stakeholders</p>
            <p className="font-numeric text-[24px] font-bold text-slate-900 mt-0.5">
              {contacts.length}
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Registered decision makers &amp; contacts</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-2xs">
            <Users size={20} />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-emerald-700">Direct Reachability</p>
            <p className="font-numeric text-[24px] font-bold text-emerald-950 mt-0.5">
              {contacts.filter((c) => c.email || c.phone).length}
            </p>
            <p className="text-[11.5px] text-emerald-800/70 mt-0.5">Direct phone or email address active</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Mail size={20} />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Account Filter, Add Contact */}
      <div className="glass-card p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts, title, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-800 transition-colors"
            />
          </div>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] font-medium text-slate-800 outline-none"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-slate-800 shadow-xs transition-all shrink-0"
        >
          <Plus size={14} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="glass-card overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <User size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[14.5px] font-semibold text-slate-900">No contacts found</p>
            <p className="text-[12.5px] text-slate-500 mt-1">
              Try adjusting your search or register a new contact.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Add First Contact</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company / Organization</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((c) => {
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/contacts/${c.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-[12px] shadow-2xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {c.name}
                          </p>
                          <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                            {c.title || "Key Stakeholder"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {c.account?.name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-800 text-[12px] font-medium border border-slate-200/80">
                          <Building size={11} className="text-slate-400" />
                          {c.account.name}
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-medium text-[12.5px]"
                        >
                          <Mail size={12} className="text-slate-400" />
                          <span>{c.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-numeric text-[12.5px]"
                        >
                          <Phone size={12} className="text-slate-400" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(c);
                          }}
                          title="Edit contact"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c);
                          }}
                          title="Delete contact"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight
                          size={14}
                          className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all ml-1"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact Edit/Create Modal */}
      {modalOpen && (
        <ContactModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          contactToEdit={editingContact}
          accounts={accounts}
        />
      )}

      {/* Professional Contact Detail Drawer */}
      {selectedContact && (
        <ContactDetailDrawer
          open={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          contact={selectedContact}
          allDeals={deals}
          allTasks={tasks}
          members={members}
          onEdit={(c) => {
            setSelectedContact(null);
            handleEdit(c);
          }}
        />
      )}
    </div>
  );
}

