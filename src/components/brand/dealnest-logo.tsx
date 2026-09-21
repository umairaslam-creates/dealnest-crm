import React from "react";
import Link from "next/link";

interface DealNestLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  href?: string;
  className?: string;
}

export function DealNestLogo({
  size = "md",
  showSubtitle = true,
  href,
  className = "",
}: DealNestLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  const titleSizes = {
    sm: "text-[15px]",
    md: "text-[17px]",
    lg: "text-[21px]",
    xl: "text-[26px]",
  };

  const subtitleSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-[11px]",
    xl: "text-[12px]",
  };

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Glowing Diamond Nest Emblem */}
      <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-amber-500/10 border border-amber-500/30 bg-slate-950 ${iconSizes[size]}`}>
        <img
          src="/images/dealnest-logo.png"
          alt="DEALNEST Logo"
          className="h-full w-full object-cover scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className={`font-black tracking-tight flex items-center gap-0.5 ${titleSizes[size]}`}>
          <span className="text-white">DEAL</span>
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            NEST
          </span>
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </div>
        {showSubtitle && (
          <span className={`font-medium tracking-wider text-slate-400 uppercase ${subtitleSizes[size]}`}>
            Enterprise Sales Intelligence
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

