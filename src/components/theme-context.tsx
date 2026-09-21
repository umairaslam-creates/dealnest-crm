"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeConfig = {
  id: string;
  name: string;
  category:
    | "Glassmorphism & Frosted"
    | "Modern Pastel"
    | "Vibrant Fintech"
    | "Dark & Obsidian"
    | "Luxury Enterprise"
    | "Minimalist";
  fontFamily: string;
  fontName: string;
  isDark?: boolean;
  isGlass?: boolean;
  palette: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    borderStrong: string;
    brand: string;
    brandHover: string;
    accent: string;
    accentSoft: string;
    text: string;
    textMuted: string;
    sidebarBg: string;
    sidebarActive: string;
    sidebarActiveText: string;
  };
};

export const THEMES: ThemeConfig[] = [
  // ---------- GLASSMORPHISM & FROSTED SECTION (7 Dedicated Themes) ----------
  {
    id: "glass-navy",
    name: "Glassmorphism Deep Navy (Your Image Inspo)",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Outfit', system-ui, sans-serif",
    fontName: "Outfit",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#071329",
      surface: "rgba(13, 27, 56, 0.65)",
      surface2: "rgba(20, 38, 76, 0.7)",
      border: "rgba(255, 255, 255, 0.2)",
      borderStrong: "rgba(255, 255, 255, 0.38)",
      brand: "#38bdf8",
      brandHover: "#0284c7",
      accent: "#facc15",
      accentSoft: "rgba(250, 204, 21, 0.2)",
      text: "#ffffff",
      textMuted: "#94a3b8",
      sidebarBg: "rgba(10, 20, 42, 0.72)",
      sidebarActive: "#38bdf8",
      sidebarActiveText: "#071329",
    },
  },
  {
    id: "glass-obsidian",
    name: "Glassmorphism Obsidian Onyx",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontName: "Space Grotesk",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#030712",
      surface: "rgba(17, 24, 39, 0.62)",
      surface2: "rgba(31, 41, 55, 0.68)",
      border: "rgba(255, 255, 255, 0.16)",
      borderStrong: "rgba(255, 255, 255, 0.35)",
      brand: "#00f59b",
      brandHover: "#10b981",
      accent: "#38bdf8",
      accentSoft: "rgba(6, 78, 59, 0.3)",
      text: "#f9fafb",
      textMuted: "#9ca3af",
      sidebarBg: "rgba(15, 23, 42, 0.75)",
      sidebarActive: "#00f59b",
      sidebarActiveText: "#030712",
    },
  },
  {
    id: "glass-twilight",
    name: "Glassmorphism Twilight Violet",
    category: "Glassmorphism & Frosted",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontName: "DM Sans",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#0f0728",
      surface: "rgba(34, 16, 70, 0.64)",
      surface2: "rgba(46, 23, 94, 0.7)",
      border: "rgba(216, 180, 254, 0.25)",
      borderStrong: "rgba(216, 180, 254, 0.42)",
      brand: "#a855f7",
      brandHover: "#9333ea",
      accent: "#f43f5e",
      accentSoft: "rgba(244, 63, 94, 0.2)",
      text: "#fdf4ff",
      textMuted: "#c084fc",
      sidebarBg: "rgba(24, 12, 50, 0.75)",
      sidebarActive: "#a855f7",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "glass-emerald",
    name: "Glassmorphism Emerald Sea",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontName: "Inter",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#021a14",
      surface: "rgba(6, 44, 34, 0.65)",
      surface2: "rgba(10, 60, 46, 0.72)",
      border: "rgba(167, 243, 208, 0.22)",
      borderStrong: "rgba(167, 243, 208, 0.38)",
      brand: "#10b981",
      brandHover: "#059669",
      accent: "#34d399",
      accentSoft: "rgba(52, 211, 153, 0.18)",
      text: "#ecfdf5",
      textMuted: "#6ee7b7",
      sidebarBg: "rgba(4, 30, 23, 0.75)",
      sidebarActive: "#10b981",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "glass-ruby",
    name: "Glassmorphism Crimson Ruby",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Lexend', system-ui, sans-serif",
    fontName: "Lexend",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#1a050d",
      surface: "rgba(55, 12, 28, 0.65)",
      surface2: "rgba(76, 18, 40, 0.7)",
      border: "rgba(254, 205, 211, 0.24)",
      borderStrong: "rgba(254, 205, 211, 0.4)",
      brand: "#f43f5e",
      brandHover: "#e11d48",
      accent: "#fb7185",
      accentSoft: "rgba(251, 113, 133, 0.2)",
      text: "#fff1f2",
      textMuted: "#fda4af",
      sidebarBg: "rgba(38, 8, 20, 0.75)",
      sidebarActive: "#f43f5e",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "glass-amber",
    name: "Glassmorphism Sovereign Amber Gold",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontName: "Plus Jakarta Sans",
    isDark: true,
    isGlass: true,
    palette: {
      bg: "#160e03",
      surface: "rgba(48, 30, 8, 0.65)",
      surface2: "rgba(66, 42, 12, 0.72)",
      border: "rgba(253, 230, 138, 0.24)",
      borderStrong: "rgba(253, 230, 138, 0.42)",
      brand: "#f59e0b",
      brandHover: "#d97706",
      accent: "#fbbf24",
      accentSoft: "rgba(251, 191, 36, 0.18)",
      text: "#fffbeb",
      textMuted: "#fde68a",
      sidebarBg: "rgba(32, 20, 5, 0.75)",
      sidebarActive: "#f59e0b",
      sidebarActiveText: "#160e03",
    },
  },
  {
    id: "glass-frost",
    name: "Glassmorphism Crystal Glacier (Light)",
    category: "Glassmorphism & Frosted",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontName: "Plus Jakarta Sans",
    isDark: false,
    isGlass: true,
    palette: {
      bg: "#e2ebf6",
      surface: "rgba(255, 255, 255, 0.72)",
      surface2: "rgba(255, 255, 255, 0.85)",
      border: "rgba(255, 255, 255, 0.9)",
      borderStrong: "rgba(203, 213, 225, 0.9)",
      brand: "#4361ee",
      brandHover: "#3b52d9",
      accent: "#0ea5e9",
      accentSoft: "rgba(14, 165, 233, 0.12)",
      text: "#0f172a",
      textMuted: "#475569",
      sidebarBg: "rgba(255, 255, 255, 0.78)",
      sidebarActive: "#4361ee",
      sidebarActiveText: "#ffffff",
    },
  },
  // ---------- STANDARD THEMES ----------
  {
    id: "clinexa-blue",
    name: "Clinexa Soft Blue",
    category: "Modern Pastel",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontName: "Plus Jakarta Sans",
    palette: {
      bg: "#edf2f9",
      surface: "#ffffff",
      surface2: "#f8fafc",
      border: "#e2e8f0",
      borderStrong: "#cbd5e1",
      brand: "#4361ee",
      brandHover: "#3b52d9",
      accent: "#4361ee",
      accentSoft: "#eef2ff",
      text: "#1e293b",
      textMuted: "#64748b",
      sidebarBg: "#ffffff",
      sidebarActive: "#4361ee",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "emerald-fintech",
    name: "Emerald Fintech (Saudi Green)",
    category: "Vibrant Fintech",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontName: "Inter",
    palette: {
      bg: "#f0fdf4",
      surface: "#ffffff",
      surface2: "#ecfdf5",
      border: "#d1fae5",
      borderStrong: "#a7f3d0",
      brand: "#10b981",
      brandHover: "#059669",
      accent: "#059669",
      accentSoft: "#d1fae5",
      text: "#064e3b",
      textMuted: "#047857",
      sidebarBg: "#ffffff",
      sidebarActive: "#10b981",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian (Dark Luxury)",
    category: "Dark & Obsidian",
    fontFamily: "'Outfit', system-ui, sans-serif",
    fontName: "Outfit",
    isDark: true,
    palette: {
      bg: "#0b0f19",
      surface: "#111827",
      surface2: "#1f2937",
      border: "#374151",
      borderStrong: "#4b5563",
      brand: "#10b981",
      brandHover: "#34d399",
      accent: "#06b6d4",
      accentSoft: "#134e4a",
      text: "#f9fafb",
      textMuted: "#9ca3af",
      sidebarBg: "#111827",
      sidebarActive: "#10b981",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "royal-amethyst",
    name: "Royal Amethyst & Violet",
    category: "Luxury Enterprise",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontName: "DM Sans",
    palette: {
      bg: "#f5f3ff",
      surface: "#ffffff",
      surface2: "#ede9fe",
      border: "#ddd6fe",
      borderStrong: "#c4b5fd",
      brand: "#7c3aed",
      brandHover: "#6d28d9",
      accent: "#8b5cf6",
      accentSoft: "#ede9fe",
      text: "#2e1065",
      textMuted: "#6b21a8",
      sidebarBg: "#ffffff",
      sidebarActive: "#7c3aed",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "sunset-amber",
    name: "Sunset Amber & Crimson",
    category: "Vibrant Fintech",
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontName: "Poppins",
    palette: {
      bg: "#fffbeb",
      surface: "#ffffff",
      surface2: "#fef3c7",
      border: "#fde68a",
      borderStrong: "#fcd34d",
      brand: "#f59e0b",
      brandHover: "#d97706",
      accent: "#f43f5e",
      accentSoft: "#fee2e2",
      text: "#451a03",
      textMuted: "#78350f",
      sidebarBg: "#ffffff",
      sidebarActive: "#f59e0b",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "ocean-azure",
    name: "Ocean Deep Azure",
    category: "Modern Pastel",
    fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
    fontName: "Geist",
    palette: {
      bg: "#f0f9ff",
      surface: "#ffffff",
      surface2: "#e0f2fe",
      border: "#bae6fd",
      borderStrong: "#7dd3fc",
      brand: "#0284c7",
      brandHover: "#0369a1",
      accent: "#0ea5e9",
      accentSoft: "#e0f2fe",
      text: "#0c4a6e",
      textMuted: "#0369a1",
      sidebarBg: "#ffffff",
      sidebarActive: "#0284c7",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "crimson-rose",
    name: "Crimson Rose Executive",
    category: "Luxury Enterprise",
    fontFamily: "'Lexend', system-ui, sans-serif",
    fontName: "Lexend",
    palette: {
      bg: "#fff1f2",
      surface: "#ffffff",
      surface2: "#ffe4e6",
      border: "#fecdd3",
      borderStrong: "#fda4af",
      brand: "#e11d48",
      brandHover: "#be123c",
      accent: "#f43f5e",
      accentSoft: "#ffe4e6",
      text: "#4c0519",
      textMuted: "#9f1239",
      sidebarBg: "#ffffff",
      sidebarActive: "#e11d48",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "cyber-mint",
    name: "Cyber Mint & Space Navy",
    category: "Dark & Obsidian",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontName: "Space Grotesk",
    isDark: true,
    palette: {
      bg: "#0f172a",
      surface: "#1e293b",
      surface2: "#334155",
      border: "#475569",
      borderStrong: "#64748b",
      brand: "#00f59b",
      brandHover: "#10b981",
      accent: "#38bdf8",
      accentSoft: "#064e3b",
      text: "#f8fafc",
      textMuted: "#cbd5e1",
      sidebarBg: "#1e293b",
      sidebarActive: "#00f59b",
      sidebarActiveText: "#0f172a",
    },
  },
  {
    id: "warm-coffee",
    name: "Warm Coffee & Sand",
    category: "Modern Pastel",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontName: "Plus Jakarta Sans",
    palette: {
      bg: "#fdfbf7",
      surface: "#ffffff",
      surface2: "#fef3c7",
      border: "#e7e5e4",
      borderStrong: "#d6d3d1",
      brand: "#b45309",
      brandHover: "#92400e",
      accent: "#d97706",
      accentSoft: "#fef3c7",
      text: "#292524",
      textMuted: "#78716c",
      sidebarBg: "#ffffff",
      sidebarActive: "#b45309",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "steel-monochrome",
    name: "Steel Monochrome (Linear Minimal)",
    category: "Minimalist",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontName: "Inter",
    palette: {
      bg: "#f4f4f5",
      surface: "#ffffff",
      surface2: "#f4f4f5",
      border: "#e4e4e7",
      borderStrong: "#d4d4d8",
      brand: "#18181b",
      brandHover: "#09090b",
      accent: "#27272a",
      accentSoft: "#f4f4f5",
      text: "#09090b",
      textMuted: "#71717a",
      sidebarBg: "#ffffff",
      sidebarActive: "#18181b",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "electric-indigo",
    name: "Electric Indigo & Fuchsia",
    category: "Vibrant Fintech",
    fontFamily: "'Urbanist', system-ui, sans-serif",
    fontName: "Urbanist",
    palette: {
      bg: "#faf5ff",
      surface: "#ffffff",
      surface2: "#f3e8ff",
      border: "#e9d5ff",
      borderStrong: "#d8b4fe",
      brand: "#4f46e5",
      brandHover: "#4338ca",
      accent: "#c026d3",
      accentSoft: "#fae8ff",
      text: "#1e1b4b",
      textMuted: "#581c87",
      sidebarBg: "#ffffff",
      sidebarActive: "#4f46e5",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "forest-evergreen",
    name: "Forest Evergreen Wealth",
    category: "Luxury Enterprise",
    fontFamily: "'Work Sans', system-ui, sans-serif",
    fontName: "Work Sans",
    palette: {
      bg: "#f2fbf7",
      surface: "#ffffff",
      surface2: "#e6f7ef",
      border: "#c3eeda",
      borderStrong: "#a0e2c2",
      brand: "#047857",
      brandHover: "#065f46",
      accent: "#059669",
      accentSoft: "#d1fae5",
      text: "#022c22",
      textMuted: "#065f46",
      sidebarBg: "#ffffff",
      sidebarActive: "#047857",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "nordic-glacier",
    name: "Nordic Glacier Frost",
    category: "Modern Pastel",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontName: "Inter",
    palette: {
      bg: "#f0fdfa",
      surface: "#ffffff",
      surface2: "#ccfbf1",
      border: "#99f6e4",
      borderStrong: "#5eead4",
      brand: "#0d9488",
      brandHover: "#0f766e",
      accent: "#14b8a6",
      accentSoft: "#ccfbf1",
      text: "#134e4a",
      textMuted: "#0f766e",
      sidebarBg: "#ffffff",
      sidebarActive: "#0d9488",
      sidebarActiveText: "#ffffff",
    },
  },
  {
    id: "titanium-gold",
    name: "Sovereign Titanium Gold",
    category: "Luxury Enterprise",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontName: "Plus Jakarta Sans",
    palette: {
      bg: "#fbfbfa",
      surface: "#ffffff",
      surface2: "#fef3c7",
      border: "#e7e5e4",
      borderStrong: "#d6d3d1",
      brand: "#d97706",
      brandHover: "#b45309",
      accent: "#b45309",
      accentSoft: "#fef3c7",
      text: "#1c1917",
      textMuted: "#78716c",
      sidebarBg: "#ffffff",
      sidebarActive: "#d97706",
      sidebarActiveText: "#ffffff",
    },
  },
];

export type CompanyBranding = {
  companyName: string;
  companyTagline: string;
  logoUrl: string | null;
  emblem: "M" | "diamond" | "globe" | "shield" | "spark" | "cube" | "zap";
};

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: "DEALNEST",
  companyTagline: "Enterprise Sales Intelligence",
  logoUrl: "/images/dealnest-logo.png",
  emblem: "diamond",
};

export type FontComboConfig = {
  id: string;
  name: string;
  badge: string;
  headingFont: string;
  headingName: string;
  bodyFont: string;
  bodyName: string;
  description: string;
  preview: {
    heading: string;
    sub: string;
  };
};

export const FONT_COMBINATIONS: FontComboConfig[] = [
  {
    id: "saas-modern",
    name: "SaaS Modern & Tech",
    badge: "Recommended",
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    headingName: "Plus Jakarta Sans",
    bodyFont: "'Inter', system-ui, sans-serif",
    bodyName: "Inter",
    description: "Industry benchmark for high-growth tech platforms, providing unmatched clarity and clean executive structure.",
    preview: { heading: "Next-Gen Revenue Pipeline", sub: "Enterprise sales velocity and quota analytics." }
  },
  {
    id: "silicon-geometric",
    name: "Silicon Valley Geometric",
    badge: "Modernist",
    headingFont: "'Outfit', system-ui, sans-serif",
    headingName: "Outfit",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    bodyName: "DM Sans",
    description: "Rounded geometric headers with warm DM Sans body for high charisma and sleek modern feel.",
    preview: { heading: "Smart POS & Gateway Growth", sub: "Merchant onboarding with automated KYC verification." }
  },
  {
    id: "fintech-precision",
    name: "Fintech Precision & Data",
    badge: "High Legibility",
    headingFont: "'Inter', system-ui, sans-serif",
    headingName: "Inter",
    bodyFont: "'Lexend', system-ui, sans-serif",
    bodyName: "Lexend",
    description: "Engineered specifically to maximize reading speed, numerical comprehension, and financial deal tracking.",
    preview: { heading: "SAR 14,850,000 Pipeline Value", sub: "Weighted forecast across 48 active banking prospects." }
  },
  {
    id: "cyber-grotesk",
    name: "Cyber Grotesk & Tech",
    badge: "Bold & Punchy",
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    headingName: "Space Grotesk",
    bodyFont: "'Space Grotesk', system-ui, sans-serif",
    bodyName: "Space Grotesk",
    description: "Futuristic monospace-accented personality tailored for Web3, crypto, and modern tech infrastructure.",
    preview: { heading: "Decentralized Ledger v4.2", sub: "Real-time microtransaction processing engine." }
  },
  {
    id: "startup-product",
    name: "Modern Startup & Product",
    badge: "Friendly",
    headingFont: "'Poppins', system-ui, sans-serif",
    headingName: "Poppins",
    bodyFont: "'Inter', system-ui, sans-serif",
    bodyName: "Inter",
    description: "Geometric curves with approachable warmth paired with razor-sharp content reading.",
    preview: { heading: "Accelerate Deals Faster", sub: "Collaborative lead scoring and automated meeting sync." }
  },
  {
    id: "luxury-editorial",
    name: "Executive Luxury & Editorial",
    badge: "Prestige",
    headingFont: "'Playfair Display', Georgia, serif",
    headingName: "Playfair Display",
    bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyName: "Plus Jakarta Sans",
    description: "High-contrast editorial serif headings paired with clean sans body for sovereign wealth and VIP accounts.",
    preview: { heading: "Sovereign Wealth Portfolio", sub: "Tier-1 institutional accounts and bespoke settlement." }
  },
  {
    id: "contemporary-smooth",
    name: "Contemporary Smooth",
    badge: "Harmonious",
    headingFont: "'DM Sans', system-ui, sans-serif",
    headingName: "DM Sans",
    bodyFont: "'Outfit', system-ui, sans-serif",
    bodyName: "Outfit",
    description: "Harmonious, clean pairing with subtle rounded terminals for effortless CRM navigation.",
    preview: { heading: "Omnichannel Payments", sub: "Unified merchant checkout with instant settlement." }
  },
  {
    id: "heritage-modernist",
    name: "Modernist Boutique Serif",
    badge: "Sophisticated",
    headingFont: "'Fraunces', Georgia, serif",
    headingName: "Fraunces",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    bodyName: "DM Sans",
    description: "Warm, bespoke display serif giving your CRM a boutique consultancy and private equity look.",
    preview: { heading: "Strategic Advisory & Capital", sub: "Curated deal pipeline and client relationship intelligence." }
  },
  {
    id: "terminal-code",
    name: "Developer Terminal & Code",
    badge: "Engineers Choice",
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    headingName: "Space Grotesk",
    bodyFont: "'JetBrains Mono', monospace",
    bodyName: "JetBrains Mono",
    description: "Monospace precision throughout the CRM, ideal for technical founders, developers, and DevOps teams.",
    preview: { heading: "POST /v1/deals/batch_create", sub: "200 OK — Execution latency 42ms with payload verified." }
  },
  {
    id: "urbanist-architect",
    name: "Architectural Minimal",
    badge: "Sleek",
    headingFont: "'Urbanist', system-ui, sans-serif",
    headingName: "Urbanist",
    bodyFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyName: "Plus Jakarta Sans",
    description: "Low-contrast geometric balance with razor-sharp horizontal alignment and high contemporary style.",
    preview: { heading: "Global Gateway Infrastructure", sub: "Multi-currency routing with dynamic FX risk hedging." }
  },
  {
    id: "corporate-classic",
    name: "Corporate Enterprise Classic",
    badge: "Trusted",
    headingFont: "'Montserrat', system-ui, sans-serif",
    headingName: "Montserrat",
    bodyFont: "'Inter', system-ui, sans-serif",
    bodyName: "Inter",
    description: "Authoritative enterprise confidence built on broad uppercase headers and ultra-crisp body copy.",
    preview: { heading: "MYTM Commercial Banking", sub: "Enterprise corporate credit facilities and treasury management." }
  },
  {
    id: "creative-syne",
    name: "Avant-Garde Creative Studio",
    badge: "Bold & Expressive",
    headingFont: "'Syne', system-ui, sans-serif",
    headingName: "Syne",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    bodyName: "DM Sans",
    description: "Ultra-expressive, wide architectural headers for visionary founders and disruptive fintech platforms.",
    preview: { heading: "Disrupting Digital Commerce", sub: "Next-generation point of sale and borderless merchant accounts." }
  },
];

type ThemeContextValue = {
  theme: ThemeConfig;
  setTheme: (themeId: string) => void;
  fontCombo: FontComboConfig;
  setFontCombo: (comboId: string) => void;
  fontCombos: FontComboConfig[];
  branding: CompanyBranding;
  updateBranding: (update: Partial<CompanyBranding>) => void;
  resetBranding: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string>("clinexa-blue");
  const [activeFontComboId, setActiveFontComboId] = useState<string>("saas-modern");
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("mytm_active_theme");
      if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
        setActiveThemeId(savedTheme);
      }
      const savedFontCombo = localStorage.getItem("mytm_font_combo");
      if (savedFontCombo && FONT_COMBINATIONS.some((f) => f.id === savedFontCombo)) {
        setActiveFontComboId(savedFontCombo);
      }
      const savedBranding = localStorage.getItem("mytm_branding_config");
      if (savedBranding) {
        setBranding({ ...DEFAULT_BRANDING, ...JSON.parse(savedBranding) });
      }
    } catch (e) {}
  }, []);

  const currentTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
  const currentFontCombo = FONT_COMBINATIONS.find((f) => f.id === activeFontComboId) || FONT_COMBINATIONS[0];

  // Apply theme variables to root document
  useEffect(() => {
    const root = document.documentElement;
    const p = currentTheme.palette;

    root.style.setProperty("--color-bg", p.bg);
    root.style.setProperty("--color-surface", p.surface);
    root.style.setProperty("--color-surface-2", p.surface2);
    root.style.setProperty("--color-border", p.border);
    root.style.setProperty("--color-border-strong", p.borderStrong);
    root.style.setProperty("--color-brand", p.brand);
    root.style.setProperty("--color-brand-hover", p.brandHover);
    root.style.setProperty("--color-accent", p.accent);
    root.style.setProperty("--color-accent-soft", p.accentSoft);
    root.style.setProperty("--color-text", p.text);
    root.style.setProperty("--color-text-muted", p.textMuted);
    const isDarkTheme = !!currentTheme.isDark;
    const sidebarIsDark = isDarkTheme || (currentTheme.isGlass && currentTheme.id !== "glass-frost");

    root.style.setProperty("--color-sidebar", p.sidebarBg);
    root.style.setProperty("--color-sidebar-fg", sidebarIsDark ? "#ffffff" : "#0f172a");
    root.style.setProperty("--color-sidebar-fg-muted", sidebarIsDark ? "rgba(255, 255, 255, 0.72)" : "#64748b");
    root.style.setProperty("--color-sidebar-border", sidebarIsDark ? "rgba(255, 255, 255, 0.15)" : "#e2e8f0");
    root.style.setProperty("--color-sidebar-item-hover", sidebarIsDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.05)");
    root.style.setProperty("--color-sidebar-active", p.sidebarActive);
    root.style.setProperty("--color-sidebar-active-text", p.sidebarActiveText);

    root.style.setProperty("--color-ink", isDarkTheme ? p.brand : "#0f172a");
    root.style.setProperty("--color-ink-hover", isDarkTheme ? p.brandHover : "#1e293b");
    root.style.setProperty("--color-ink-fg", isDarkTheme ? (p.sidebarActiveText || "#ffffff") : "#ffffff");
    root.style.setProperty("--color-text-faint", isDarkTheme ? "rgba(255, 255, 255, 0.7)" : "#64748b");

    // Elevated opaque surface for dropdowns, popovers, context menus so background text never bleeds through
    const elevatedBg = isDarkTheme
      ? (currentTheme.id === "glass-obsidian" || p.bg === "#030712" ? "#0b0f19" :
         currentTheme.id === "glass-twilight" || p.bg === "#0f0728" ? "#190d36" :
         currentTheme.id === "glass-emerald" || p.bg === "#021a14" ? "#04241c" :
         currentTheme.id === "glass-ruby" || p.bg === "#1a050d" ? "#280a15" :
         currentTheme.id === "glass-navy" || p.bg === "#07152f" ? "#0d1b38" :
         "#0f172a")
      : "#ffffff";

    root.style.setProperty("--color-surface-elevated", elevatedBg);
    root.style.setProperty("--color-surface-elevated-hover", isDarkTheme ? "rgba(255, 255, 255, 0.12)" : "#f1f5f9");

    root.setAttribute("data-theme", currentTheme.id);
    root.setAttribute("data-glass", currentTheme.isGlass ? "true" : "false");

    if (currentTheme.isGlass) {
      root.classList.add("theme-glass");
    } else {
      root.classList.remove("theme-glass");
    }

    if (currentTheme.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [currentTheme]);

  // Apply font combo variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-heading", currentFontCombo.headingFont);
    root.style.setProperty("--font-sans", currentFontCombo.bodyFont);
    document.body.style.fontFamily = currentFontCombo.bodyFont;
  }, [currentFontCombo]);

  function changeTheme(themeId: string) {
    setActiveThemeId(themeId);
    try {
      localStorage.setItem("mytm_active_theme", themeId);
    } catch (e) {}
  }

  function changeFontCombo(comboId: string) {
    setActiveFontComboId(comboId);
    try {
      localStorage.setItem("mytm_font_combo", comboId);
    } catch (e) {}
  }

  function updateBranding(update: Partial<CompanyBranding>) {
    setBranding((prev) => {
      const next = { ...prev, ...update };
      try {
        localStorage.setItem("mytm_branding_config", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }

  function resetBranding() {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem("mytm_branding_config");
    } catch (e) {}
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: changeTheme,
        fontCombo: currentFontCombo,
        setFontCombo: changeFontCombo,
        fontCombos: FONT_COMBINATIONS,
        branding,
        updateBranding,
        resetBranding,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Return safe fallback
    return {
      theme: THEMES[0],
      setTheme: () => {},
      fontCombo: FONT_COMBINATIONS[0],
      setFontCombo: () => {},
      fontCombos: FONT_COMBINATIONS,
      branding: DEFAULT_BRANDING,
      updateBranding: () => {},
      resetBranding: () => {},
    };
  }
  return ctx;
}

