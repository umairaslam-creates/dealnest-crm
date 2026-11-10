import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-context";

// Self-hosted (not fetched from Google at build time) so the build never
// depends on external network access - works the same in any environment.
const sans = localFont({
  variable: "--font-sans",
  src: [
    { path: "../fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

const mono = localFont({
  variable: "--font-mono",
  src: [
    { path: "../fonts/Mono-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Mono-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DEALNEST - Enterprise Sales Intelligence & CRM",
  description: "DEALNEST - Luxury enterprise pipeline, multi-department team governance, and sales intelligence.",
};

const themeBootstrapScript = `
(function () {
  try {
    var root = document.documentElement;
    var saved = localStorage.getItem("mytm_theme_bootstrap");
    var data = saved ? JSON.parse(saved) : null;
    var fallbackThemes = {
      "glass-navy": { isDark: true, isGlass: true, vars: { "--color-bg": "#071329", "--color-surface": "rgba(13, 27, 56, 0.65)", "--color-surface-2": "rgba(20, 38, 76, 0.7)", "--color-border": "rgba(255, 255, 255, 0.2)", "--color-border-strong": "rgba(255, 255, 255, 0.38)", "--color-brand": "#38bdf8", "--color-brand-hover": "#0284c7", "--color-accent": "#facc15", "--color-accent-soft": "rgba(250, 204, 21, 0.2)", "--color-text": "#ffffff", "--color-text-muted": "#94a3b8", "--color-sidebar": "rgba(10, 20, 42, 0.72)", "--color-sidebar-active": "#38bdf8", "--color-sidebar-active-text": "#071329", "--color-surface-elevated": "#0d1b38", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "glass-obsidian": { isDark: true, isGlass: true, vars: { "--color-bg": "#030712", "--color-surface": "rgba(17, 24, 39, 0.62)", "--color-surface-2": "rgba(31, 41, 55, 0.68)", "--color-border": "rgba(255, 255, 255, 0.16)", "--color-border-strong": "rgba(255, 255, 255, 0.35)", "--color-brand": "#00f59b", "--color-brand-hover": "#10b981", "--color-accent": "#38bdf8", "--color-accent-soft": "rgba(6, 78, 59, 0.3)", "--color-text": "#f9fafb", "--color-text-muted": "#9ca3af", "--color-sidebar": "rgba(15, 23, 42, 0.75)", "--color-sidebar-active": "#00f59b", "--color-sidebar-active-text": "#030712", "--color-surface-elevated": "#0b0f19", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "glass-twilight": { isDark: true, isGlass: true, vars: { "--color-bg": "#0f0728", "--color-surface": "rgba(34, 16, 70, 0.64)", "--color-surface-2": "rgba(46, 23, 94, 0.7)", "--color-border": "rgba(216, 180, 254, 0.25)", "--color-border-strong": "rgba(216, 180, 254, 0.42)", "--color-brand": "#a855f7", "--color-brand-hover": "#9333ea", "--color-accent": "#f43f5e", "--color-accent-soft": "rgba(244, 63, 94, 0.2)", "--color-text": "#fdf4ff", "--color-text-muted": "#c084fc", "--color-sidebar": "rgba(24, 12, 50, 0.75)", "--color-sidebar-active": "#a855f7", "--color-sidebar-active-text": "#ffffff", "--color-surface-elevated": "#190d36", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "glass-emerald": { isDark: true, isGlass: true, vars: { "--color-bg": "#021a14", "--color-surface": "rgba(6, 44, 34, 0.65)", "--color-surface-2": "rgba(10, 60, 46, 0.72)", "--color-border": "rgba(167, 243, 208, 0.22)", "--color-border-strong": "rgba(167, 243, 208, 0.38)", "--color-brand": "#10b981", "--color-brand-hover": "#059669", "--color-accent": "#34d399", "--color-accent-soft": "rgba(52, 211, 153, 0.18)", "--color-text": "#ecfdf5", "--color-text-muted": "#6ee7b7", "--color-sidebar": "rgba(4, 30, 23, 0.75)", "--color-sidebar-active": "#10b981", "--color-sidebar-active-text": "#ffffff", "--color-surface-elevated": "#04241c", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "glass-ruby": { isDark: true, isGlass: true, vars: { "--color-bg": "#1a050d", "--color-surface": "rgba(55, 12, 28, 0.65)", "--color-surface-2": "rgba(76, 18, 40, 0.7)", "--color-border": "rgba(254, 205, 211, 0.24)", "--color-border-strong": "rgba(254, 205, 211, 0.4)", "--color-brand": "#f43f5e", "--color-brand-hover": "#e11d48", "--color-accent": "#fb7185", "--color-accent-soft": "rgba(251, 113, 133, 0.2)", "--color-text": "#fff1f2", "--color-text-muted": "#fda4af", "--color-sidebar": "rgba(38, 8, 20, 0.75)", "--color-sidebar-active": "#f43f5e", "--color-sidebar-active-text": "#ffffff", "--color-surface-elevated": "#280a15", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "glass-amber": { isDark: true, isGlass: true, vars: { "--color-bg": "#160e03", "--color-surface": "rgba(48, 30, 8, 0.65)", "--color-surface-2": "rgba(66, 42, 12, 0.72)", "--color-border": "rgba(253, 230, 138, 0.24)", "--color-border-strong": "rgba(253, 230, 138, 0.42)", "--color-brand": "#f59e0b", "--color-brand-hover": "#d97706", "--color-accent": "#fbbf24", "--color-accent-soft": "rgba(251, 191, 36, 0.18)", "--color-text": "#fffbeb", "--color-text-muted": "#fde68a", "--color-sidebar": "rgba(32, 20, 5, 0.75)", "--color-sidebar-active": "#f59e0b", "--color-sidebar-active-text": "#160e03", "--color-surface-elevated": "#0f172a", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } },
      "midnight-obsidian": { isDark: true, isGlass: false, vars: { "--color-bg": "#0b0f19", "--color-surface": "#111827", "--color-surface-2": "#1f2937", "--color-border": "#374151", "--color-border-strong": "#4b5563", "--color-brand": "#10b981", "--color-brand-hover": "#34d399", "--color-accent": "#06b6d4", "--color-accent-soft": "#134e4a", "--color-text": "#f9fafb", "--color-text-muted": "#9ca3af", "--color-sidebar": "#111827", "--color-sidebar-active": "#10b981", "--color-sidebar-active-text": "#ffffff", "--color-surface-elevated": "#0f172a", "--color-surface-elevated-hover": "rgba(255, 255, 255, 0.12)" } }
    };
    if (!data) {
      var themeId = localStorage.getItem("mytm_active_theme");
      var fallback = fallbackThemes[themeId || ""];
      if (fallback) data = { themeId: themeId, isDark: fallback.isDark, isGlass: fallback.isGlass, cssVars: fallback.vars };
    }
    if (!data) return;
    var vars = data.cssVars || data.vars || {};
    Object.keys(vars).forEach(function (key) { root.style.setProperty(key, vars[key]); });
    if (data.themeId) root.setAttribute("data-theme", data.themeId);
    root.setAttribute("data-glass", data.isGlass ? "true" : "false");
    root.classList.toggle("dark", !!data.isDark);
    root.classList.toggle("theme-glass", !!data.isGlass);
    root.style.colorScheme = data.isDark ? "dark" : "light";
    if (data.headingFont) root.style.setProperty("--font-heading", data.headingFont);
    if (data.bodyFont) root.style.setProperty("--font-sans", data.bodyFont);
  } catch (error) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Lexend:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@300..700&family=Syne:wght@400..800&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
