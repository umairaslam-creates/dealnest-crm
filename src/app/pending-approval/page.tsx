import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "../logout-action";
import { DealNestLogo } from "@/components/brand/dealnest-logo";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const session = await auth();
  const user = session?.user as any;

  // Lookup the department Team Lead if available
  let teamLeadName = "your Department Team Lead";
  if (user?.companyDomain && user?.department) {
    const lead = await db.query.users.findFirst({
      where: and(
        eq(users.companyDomain, user.companyDomain),
        eq(users.department, user.department),
        eq(users.orgRole, "TEAM_LEAD")
      ),
      columns: { name: true, email: true },
    });
    if (lead?.name) {
      teamLeadName = lead.name;
    }
  }

  const isApproved = user?.status === "ACTIVE";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 font-sans text-slate-100">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Glowing aura */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
          <DealNestLogo size="md" showSubtitle={false} />
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11.5px] font-semibold text-amber-300">
            <Clock size={13} className="animate-pulse" />
            Verification Queue
          </span>
        </div>

        {isApproved ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-[22px] font-bold text-white">You&apos;re Approved! 🎉</h1>
            <p className="mt-2 text-[13.5px] text-slate-300">
              Your Team Lead has authorized your CRM workspace account. You are ready to start
              collaborating.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[14px] font-bold text-slate-950 shadow-lg hover:bg-emerald-400 transition-all active:scale-[0.98]"
              >
                <span>Enter Workspace</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-amber-200">
                  Account Pending Team Lead Approval
                </h2>
                <p className="text-[12px] text-amber-300/80">
                  Request routed to {teamLeadName}
                </p>
              </div>
            </div>

            <p className="text-[13.5px] leading-relaxed text-slate-300">
              Welcome, <span className="font-semibold text-white">{user?.name || user?.email}</span>!
              Your organization account has been submitted under the{" "}
              <span className="font-bold text-amber-300">{user?.department || "Corporate"}</span>{" "}
              department for{" "}
              <span className="font-mono font-semibold text-white">@{user?.companyDomain || "company.com"}</span>.
            </p>

            <div className="my-5 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-white">{user?.department || "Sales"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Role:</span>
                <span className="font-semibold text-white">{user?.orgRole || "Representative"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approving Lead:</span>
                <span className="font-semibold text-amber-300">{teamLeadName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Pending Review
                </span>
              </div>
            </div>

            <p className="text-[12.5px] text-slate-400">
              Once {teamLeadName} approves your registration in their{" "}
              <span className="text-white font-medium">Manage Team</span> portal, you will be
              instantly granted access to leads, pipelines, and tasks.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/pending-approval"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-[13px] font-semibold text-white border border-white/10 transition-all"
              >
                <RefreshCw size={14} />
                <span>Check Status</span>
              </Link>
              <form action={logoutAction} className="sm:flex-shrink-0">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 px-4 py-2.5 text-[13px] font-semibold text-rose-300 border border-rose-500/30 transition-all"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

