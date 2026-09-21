"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

export function GaugeCard({
  title,
  value,
  max,
  sub,
  delta,
}: {
  title: string;
  value: number;
  max: number;
  sub: string;
  delta: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="card flex h-full flex-col p-5 border border-border bg-surface">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-[14px] font-bold text-text">{title}</span>
        <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight size={11} />
          {delta}
        </span>
      </div>

      <div className="mt-3">
        <p className="font-numeric text-[26px] font-extrabold text-text tracking-tight">{value}%</p>
        <p className="text-[12px] text-text-muted mt-0.5">{sub}</p>
      </div>

      <div className="relative mx-auto mt-2 h-[120px] w-[190px] flex items-center justify-center">
        {mounted ? (
          <>
            <RadialBarChart
              width={190}
              height={130}
              cx="50%"
              cy="100%"
              innerRadius={65}
              outerRadius={88}
              startAngle={180}
              endAngle={0}
              barSize={10}
              data={[{ value: max }]}
            >
              <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
              <RadialBar dataKey="value" fill="var(--color-border-strong)" cornerRadius={6} />
            </RadialBarChart>
            <div className="absolute inset-0">
              <RadialBarChart
                width={190}
                height={130}
                cx="50%"
                cy="100%"
                innerRadius={65}
                outerRadius={88}
                startAngle={180}
                endAngle={0}
                barSize={10}
                data={[{ value }]}
              >
                <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
                <RadialBar dataKey="value" fill="#10b981" cornerRadius={6} />
              </RadialBarChart>
            </div>
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-text-muted">Attained</span>
              <span className="font-numeric text-[16px] font-bold text-text">{value}%</span>
            </div>
          </>
        ) : (
          <div className="h-full w-full rounded-xl bg-surface-2 animate-pulse" />
        )}
      </div>
    </div>
  );
}
