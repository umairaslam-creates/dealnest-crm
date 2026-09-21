"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings/pipelines", label: "Pipelines & Stages" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/theme", label: "Theme & Branding" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-3 flex gap-1 px-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            pathname === t.href
              ? "bg-ink text-white"
              : "border border-border bg-surface text-text-muted hover:bg-surface-2"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
