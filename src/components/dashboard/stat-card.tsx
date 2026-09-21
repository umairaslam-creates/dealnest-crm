import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Target,
  Sparkles,
} from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  delta,
  up,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  delta: string;
  up: boolean;
  href?: string;
}) {
  const targetHref =
    href ??
    (label.includes("Pipeline")
      ? "/pipeline"
      : label.includes("Won")
      ? "/deals"
      : label.includes("Active")
      ? "/deals"
      : "/reports");

  const Icon = label.includes("Pipeline")
    ? Target
    : label.includes("Won")
    ? DollarSign
    : label.includes("Active")
    ? Briefcase
    : Sparkles;

  const isBarSparkline = label.includes("Pipeline") || label.includes("Active");
  const isLineSparkline = label.includes("Won");
  const isGauge = label.includes("Win Rate");

  return (
    <Link
      href={targetHref}
      className="group relative flex flex-col justify-between rounded-3xl card border border-border bg-surface p-5 shadow-2xs hover:shadow-md hover:border-brand/40 transition-all duration-200"
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted group-hover:text-text transition-colors">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted group-hover:text-brand group-hover:border-brand/40 transition-colors">
          <Icon size={14} />
        </div>
      </div>

      {/* Main value and Sparkline layout (Inspired by Image 1) */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold font-mono tracking-tight text-text leading-none">
            {value}
          </p>

          <div className="mt-2.5 flex items-center gap-1.5">
            <span
              className={`flex items-center gap-0.5 text-[11px] font-bold ${
                up ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {up ? <ArrowUpRight size={13} strokeWidth={2.5} /> : <ArrowDownRight size={13} strokeWidth={2.5} />}
              <span className="text-text-muted font-medium">{delta} this period</span>
            </span>
          </div>
        </div>

        {/* Mini Sparkline Visualization on the right (Directly from Image 1) */}
        <div className="shrink-0 flex items-end justify-end h-10 w-18 pb-0.5">
          {isBarSparkline && (
            <div className="flex items-end gap-1 h-8">
              {[35, 60, 45, 80, 65, 95].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all ${
                    i >= 4 ? "bg-emerald-500" : "bg-emerald-200"
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          )}

          {isLineSparkline && (
            <svg className="w-16 h-8 overflow-visible" viewBox="0 0 64 32">
              <path
                d="M 2 24 Q 16 28, 24 16 T 44 14 T 62 4"
                fill="none"
                stroke="#4361ee"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="62" cy="4" r="3" fill="#4361ee" />
            </svg>
          )}

          {isGauge && (
            <div className="relative flex items-center justify-center h-9 w-9">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#4361ee]"
                  strokeDasharray="87, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
