import { Globe2 } from "lucide-react";

const FLAGS: Record<string, string> = {
  "Saudi Arabia": "🇸🇦",
  UAE: "🇦🇪",
  Pakistan: "🇵🇰",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  Denmark: "🇩🇰",
};

type Deal = {
  value: number | null;
  currency: string | null;
  account: { region: string | null } | null;
};

export function TopRegionsCard({ deals }: { deals: Deal[] }) {
  const byRegion = new Map<string, { currency: string; total: number }>();
  for (const d of deals) {
    const region = d.account?.region ?? "Unspecified";
    const entry = byRegion.get(region) ?? { currency: d.currency ?? "SAR", total: 0 };
    entry.total += d.value ?? 0;
    if (!entry.currency) entry.currency = d.currency ?? "SAR";
    byRegion.set(region, entry);
  }

  const rows = [...byRegion.entries()].sort((a, b) => b[1].total - a[1].total);
  const maxTotal = rows.length > 0 ? rows[0][1].total : 1;

  return (
    <div className="card flex flex-col p-5 h-full border border-border bg-surface">
      <div className="flex items-center justify-between pb-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Globe2 size={15} className="text-brand" />
          <span className="text-[14px] font-bold text-text">Pipeline by Geography</span>
        </div>
        <span className="text-[11.5px] font-semibold text-text-muted px-2.5 py-0.5 rounded-full bg-surface-2 border border-border">
          {rows.length} Markets
        </span>
      </div>

      <div className="mt-3.5 space-y-3 flex-1 overflow-y-auto pr-1">
        {rows.length === 0 && (
          <p className="text-[12.5px] text-text-muted py-6 text-center">No regional deal data recorded.</p>
        )}
        {rows.map(([region, { currency, total }], i) => {
          const pct = Math.round((total / (maxTotal || 1)) * 100);
          return (
            <div key={region} className="space-y-1">
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] leading-none">{FLAGS[region] ?? "🏳️"}</span>
                  <span className="font-semibold text-text">{region}</span>
                </div>
                <span className="font-numeric font-bold text-text">
                  {currency} {total.toLocaleString()}
                </span>
              </div>
              {/* Sleek progress indicator */}
              <div className="h-1.5 w-full rounded-full bg-surface-2 border border-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
