"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createUser, removeUser } from "@/app/actions";

type Member = { id: string; name: string | null; email: string; role: string };

export function TeamClient({ team }: { team: Member[] }) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "REP" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError("Name, email, and a password of at least 6 characters are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role as "ADMIN" | "MANAGER" | "REP",
        });
        setForm({ name: "", email: "", password: "", role: "REP" });
        setAdding(false);
      } catch (e) {
        setError("Could not add user, that email may already exist.");
      }
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-medium text-text">{team.length} team member(s)</p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-ink-hover"
        >
          <Plus size={13} />
          Add user
        </button>
      </div>

      {adding && (
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg border border-dashed border-border-strong p-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded border border-border-strong px-2 py-1.5 text-[13px] outline-none"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded border border-border-strong px-2 py-1.5 text-[13px] outline-none"
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="rounded border border-border-strong px-2 py-1.5 text-[13px] outline-none"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="rounded border border-border-strong px-2 py-1.5 text-[13px] outline-none"
          >
            <option value="REP">Rep</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={handleAdd}
            className="col-span-4 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-accent-fg"
          >
            Create account
          </button>
          {error && <p className="col-span-4 text-[12px] text-danger">{error}</p>}
        </div>
      )}

      <div className="mt-3 divide-y divide-border">
        {team.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2 text-[13px]">
            <div>
              <p className="font-medium text-text">{m.name}</p>
              <p className="text-[12px] text-text-faint">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] text-text-muted">
                {m.role}
              </span>
              <button
                onClick={() => startTransition(() => removeUser(m.id))}
                className="rounded p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
