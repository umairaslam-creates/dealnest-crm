"use client";

import React, { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Sparkles, DollarSign } from "lucide-react";

const PALETTE = ["#4361ee", "#10b981", "#f59e0b", "#6366f1", "#94a3b8"];

export function DonutCard({
  sources,
  totalLeads,
}: {
  sources: [string, number][];
  totalLeads: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = sources.map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="flex flex-col justify-between rounded-3xl card border border-border bg-surface p-5 shadow-2xs h-full">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Revenue Source Distribution
        </span>
        <span className="text-[11px] font-bold text-text-muted px-2.5 py-0.5 rounded-full bg-surface-2 border border-border">
          {totalLeads} Deals &amp; Inquiries
        </span>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
        {/* Donut with center icon (Image 1 style) */}
        <div className="relative h-[130px] w-[130px] shrink-0 flex items-center justify-center">
          {mounted && data.length > 0 ? (
            <PieChart width={130} height={130}>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                startAngle={90}
                endAngle={450}
                paddingAngle={4}
                cornerRadius={6}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <div className="h-full w-full rounded-full bg-surface-2 animate-pulse" />
          )}

          {/* Center bag icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 border border-border text-brand shadow-inner">
              <DollarSign size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Legend with percentages (Image 1 style) */}
        <div className="min-w-0 flex-1 space-y-2 w-full">
          {data.slice(0, 5).map((d) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="truncate text-text font-medium">{d.name}</span>
                </div>
                <span className="font-mono font-bold text-text shrink-0 ml-2">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation alert box (Directly from Image 1) */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-brand/10 border border-brand/20 px-3 py-2 text-[11.5px] text-brand font-semibold backdrop-blur-md">
        <Sparkles size={14} className="shrink-0 text-brand" />
        <span>Your POS &amp; Payment Gateway revenue is climbing up by 18%!</span>
      </div>
    </div>
  );
}
