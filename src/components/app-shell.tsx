"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  KanbanSquare,
  Handshake,
  BarChart3,
  Settings,
  Search,
  Bell,
  MessageSquareHeart,
  LifeBuoy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Contact,
  LogOut,
  CheckSquare,
  Plus,
  GripVertical,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Calendar,
  Palette,
  Diamond,
  Globe,
  Shield,
  Zap,
  Box,
  Users,
  Mail,
  Target,
} from "lucide-react";
import { logoutAction } from "@/app/logout-action";
import { ToastProvider } from "./toast-context";
import { CommandPalette } from "./command-palette";
import { NotificationsPopover } from "./notifications-popover";
import { TaskModal } from "./task-modal";
import { useTheme } from "./theme-context";
import { DealNestCopilot } from "./ai/dealnest-copilot";
import { EditProfileModal } from "./profile/edit-profile-modal";

export type NavItemConfig = {
  id: string;
  href: string;
  label: string;
  icon: any;
};

export const DEFAULT_MAIN_NAV: NavItemConfig[] = [
  { id: "overview", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", href: "/leads", label: "Leads", icon: UserPlus },
  { id: "pipeline", href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "deals", href: "/deals", label: "Deals", icon: Handshake },
  { id: "inbox", href: "/inbox", label: "Gmail Inbox", icon: Mail },
  { id: "contacts", href: "/contacts", label: "Contacts", icon: Contact },
  { id: "meetings", href: "/meetings", label: "Meetings", icon: Calendar },
  { id: "targets", href: "/targets", label: "Targets & Goals", icon: Target },
  { id: "products", href: "/products", label: "Products", icon: Package },
  { id: "tasks", href: "/tasks", label: "Tasks", icon: CheckSquare },
  { id: "team", href: "/team", label: "Manage Team", icon: Users },
  { id: "reports", href: "/reports", label: "Reports", icon: BarChart3 },
];

const additionalNav = [
  { href: "/settings/theme", label: "Theme & Branding", icon: Palette },
  { href: "/feedback", label: "Support & Feedback", icon: MessageSquareHeart },
  { href: "/settings/pipelines", label: "Settings", icon: Settings },
];

function BrandLogoEmblem({
  branding,
  size = "default",
}: {
  branding: { companyName: string; logoUrl: string | null; emblem: string };
  size?: "default" | "sm";
}) {
  if (branding.logoUrl) {
    return (
      <img
        src={branding.logoUrl}
        alt={branding.companyName}
        className={`${size === "sm" ? "h-6 w-6" : "h-8 w-8"} object-contain rounded-lg`}
      />
    );
  }

  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  switch (branding.emblem) {
    case "diamond":
      return <Diamond className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "globe":
      return <Globe className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "shield":
      return <Shield className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "spark":
      return <Sparkles className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "cube":
      return <Box className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "zap":
      return <Zap className={`${iconClass} text-[var(--color-brand,#4361ee)]`} />;
    case "M":
    default:
      const firstChar = branding.companyName ? branding.companyName.charAt(0).toUpperCase() : "M";
      return (
        <span className="bg-gradient-to-tr from-[var(--color-brand,#4361ee)] to-indigo-500 bg-clip-text text-transparent font-black">
          {firstChar}
        </span>
      );
  }
}

function DraggableNavItem({
  item,
  index,
  active,
  isDragging,
  isOver,
  collapsed,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavItemConfig;
  index: number;
  active: boolean;
  isDragging: boolean;
  isOver: boolean;
  collapsed: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <div
        suppressHydrationWarning
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={() => onDrop(index)}
        className="group relative flex justify-center my-1"
        title={item.label}
      >
        <Link
          href={item.href}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
            active
              ? "bg-[var(--color-sidebar-active,#4361ee)] text-[var(--color-sidebar-active-text,#ffffff)] shadow-md font-semibold scale-105"
              : "text-[var(--color-sidebar-fg-muted)] hover:text-[var(--color-sidebar-fg)] hover:bg-[var(--color-sidebar-item-hover)]"
          }`}
        >
          <Icon size={20} strokeWidth={active ? 2.2 : 1.9} />
        </Link>
        {/* Floating tooltip */}
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3.5 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-xl bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-white shadow-lg whitespace-nowrap">
            {item.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`group relative flex items-center rounded-2xl transition-all cursor-grab active:cursor-grabbing my-0.5 ${
        isDragging ? "opacity-30 scale-95" : ""
      } ${isOver ? "ring-2 ring-brand bg-brand/10" : ""}`}
    >
      <Link
        href={item.href}
        className={`flex-1 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
          active
            ? "bg-[var(--color-sidebar-active,#4361ee)] text-[var(--color-sidebar-active-text,#ffffff)] shadow-md font-semibold"
            : "text-[var(--color-sidebar-fg-muted)] hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-sidebar-fg)]"
        }`}
      >
        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          className={active ? "text-[var(--color-sidebar-active-text,#ffffff)]" : "text-[var(--color-sidebar-fg-muted)] group-hover:text-[var(--color-sidebar-fg)] transition-colors"}
        />
        <span className="flex-1 tracking-tight">{item.label}</span>
      </Link>
      <div
        className="px-1 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical size={13} />
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  headerLeft,
  user,
}: {
  children: React.ReactNode;
  title?: string;
  headerLeft?: React.ReactNode;
  user?: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, branding } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [navItems, setNavItems] = useState<NavItemConfig[]>(DEFAULT_MAIN_NAV);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickTaskModal, setQuickTaskModal] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (user) {
      setCurrentUser((prev: any) => ({
        ...prev,
        ...user,
        image: user.image ?? prev?.image,
        designation: user.designation ?? prev?.designation,
      }));
    }
  }, [user]);

  // Load user's custom navigation sequence and collapsed state
  useEffect(() => {
    try {
      const savedCollapse = localStorage.getItem("mytm_sidebar_collapsed");
      if (savedCollapse !== null) {
        setCollapsed(savedCollapse === "true");
      }
      const saved = localStorage.getItem("mytm_sidebar_nav_order");
      if (saved) {
        const orderIds: string[] = JSON.parse(saved);
        const reordered = orderIds
          .map((id) => DEFAULT_MAIN_NAV.find((item) => item.id === id))
          .filter(Boolean) as NavItemConfig[];
        DEFAULT_MAIN_NAV.forEach((item) => {
          if (!reordered.some((r) => r.id === item.id)) reordered.push(item);
        });
        setNavItems(reordered);
      }
    } catch (e) {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mytm_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  }

  function handleDragStart(index: number) {
    setDraggedIdx(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  }

  function handleDrop(index: number) {
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...navItems];
    const [removed] = next.splice(draggedIdx, 1);
    next.splice(index, 0, removed);
    setNavItems(next);
    setDraggedIdx(null);
    setDragOverIdx(null);
    try {
      localStorage.setItem("mytm_sidebar_nav_order", JSON.stringify(next.map((n) => n.id)));
    } catch (e) {}
  }

  // Close dropdowns on route changes
  useEffect(() => {
    setNotificationsOpen(false);
    setQuickCreateOpen(false);
  }, [pathname]);

  const initials = (currentUser?.name ?? currentUser?.email ?? "AA")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ToastProvider>
      <div className="ambient-canvas flex h-screen w-full overflow-hidden p-3 md:p-4 gap-3 md:gap-4 font-sans text-slate-100 relative">
        {/* Genuine Optical Glassmorphism Ambient Light Elements (Matching User Vector Reference Exactly) */}
        {theme.isGlass && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
            {/* Glowing Golden-Yellow Torus Ring at Bottom-Right */}
            <div
              className="absolute -bottom-24 -right-20 w-[440px] h-[440px] lg:w-[560px] lg:h-[560px] rounded-full border-[42px] lg:border-[56px] border-amber-400/60 blur-[3px] opacity-85"
              style={{ filter: "drop-shadow(0 0 70px rgba(245, 158, 11, 0.75))" }}
            />
            {/* Inner Golden Core */}
            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-amber-400/30 blur-3xl" />

            {/* Glowing White/Silver-Cyan Torus Ring at Top-Left */}
            <div
              className="absolute -top-20 left-10 w-[380px] h-[380px] lg:w-[480px] lg:h-[480px] rounded-full border-[38px] lg:border-[50px] border-cyan-200/55 blur-[3px] opacity-80"
              style={{ filter: "drop-shadow(0 0 60px rgba(56, 189, 248, 0.65))" }}
            />
            {/* Inner Silver/Cyan Core */}
            <div className="absolute -top-6 left-20 w-64 h-64 rounded-full bg-cyan-400/25 blur-3xl" />

            {/* Fine Thin Wireframe Circles (Directly from User Vector Reference) */}
            <div className="absolute -bottom-6 right-16 w-[640px] h-[640px] rounded-full border border-amber-300/35 opacity-70" />
            <div className="absolute -bottom-16 right-8 w-[740px] h-[740px] rounded-full border border-amber-200/20 opacity-50" />
            <div className="absolute top-2 left-24 w-[540px] h-[540px] rounded-full border border-white/25 opacity-60" />
            <div className="absolute -top-10 left-16 w-[660px] h-[660px] rounded-full border border-cyan-300/20 opacity-40" />

            {/* Radiant Center Electric Ambient Aurora */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-sky-500/20 to-purple-500/20 blur-3xl opacity-70" />
          </div>
        )}

        {/* Floating Pill Sidebar */}
        <aside
          suppressHydrationWarning
          className={`relative z-20 flex shrink-0 flex-col rounded-[30px] crm-glass-sidebar bg-[var(--color-surface,#ffffff)] border border-[var(--color-border,#e2e8f0)] shadow-md shadow-slate-300/30 transition-all duration-300 select-none ${
            collapsed ? "w-[76px] items-center p-3" : "w-64 p-4"
          }`}
        >
          {/* Top Logo & Header */}
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 w-full pb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg shadow-2xs hover:scale-105 transition-all cursor-pointer border border-white/15"
                title="Click to expand sidebar"
              >
                <BrandLogoEmblem branding={branding} />
                <span className="sr-only">Expand sidebar</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full pb-2">
              <Link href="/" className="flex items-center gap-3 group min-w-0 flex-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-lg shadow-2xs group-hover:scale-105 transition-all overflow-hidden">
                  <BrandLogoEmblem branding={branding} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[16px] font-bold tracking-tight text-[var(--color-sidebar-fg,#ffffff)] truncate">
                      {branding.companyName || "DEALNEST"}
                    </span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10b981]" />
                  </div>
                  <span className="block text-[10px] font-bold text-[var(--color-sidebar-fg-muted,#94a3b8)] uppercase tracking-wider truncate">
                    {branding.companyTagline || "Enterprise Sales Intelligence"}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                className="p-1.5 rounded-xl text-[var(--color-sidebar-fg-muted)] hover:text-[var(--color-sidebar-fg)] hover:bg-[var(--color-sidebar-item-hover)] transition-colors shrink-0 cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          )}

          {/* Search Trigger (expanded) */}
          {!collapsed && (
            <button
              onClick={() => setPaletteOpen(true)}
              className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--color-sidebar-border,rgba(255,255,255,0.2))] bg-[var(--color-sidebar-item-hover,rgba(255,255,255,0.1))] px-3.5 py-2 text-[12.5px] text-[var(--color-sidebar-fg-muted,#94a3b8)] hover:border-brand/40 hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-sidebar-fg,#ffffff)] shadow-2xs transition-all text-left group backdrop-blur-md"
            >
              <Search size={14} className="text-[var(--color-sidebar-fg-muted)] group-hover:text-[var(--color-sidebar-fg)] transition-colors" />
              <span className="flex-1">Search or jump to...</span>
              <kbd className="rounded-md border border-[var(--color-sidebar-border,rgba(255,255,255,0.2))] bg-[var(--color-sidebar-item-hover)] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--color-sidebar-fg-muted,#94a3b8)] shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Main Navigation */}
          <nav className="mt-4 flex-1 w-full space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item, idx) => (
              <DraggableNavItem
                key={item.id}
                item={item}
                index={idx}
                active={
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href))
                }
                isDragging={draggedIdx === idx}
                isOver={dragOverIdx === idx}
                collapsed={collapsed}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}

            {!collapsed && (
              <div className="pt-4 mt-4 border-t border-[var(--color-sidebar-border,rgba(255,255,255,0.1))] space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-sidebar-fg-muted,#94a3b8)]">
                  Settings &amp; Help
                </p>
                {additionalNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium transition-all ${
                        active
                          ? "bg-[var(--color-sidebar-active,#4361ee)] text-[var(--color-sidebar-active-text,#ffffff)] font-semibold shadow-sm"
                          : "text-[var(--color-sidebar-fg-muted)] hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-sidebar-fg)]"
                      }`}
                    >
                      <Icon size={17} className={active ? "text-[var(--color-sidebar-active-text,#ffffff)]" : "text-[var(--color-sidebar-fg-muted)]"} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Bottom Controls */}
          {collapsed ? (
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOpen(!notificationsOpen);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#f43f5e] ring-2 ring-white" />
              </button>
              <Link
                href="/settings/theme"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                title="Theme & Branding"
              >
                <Palette size={18} />
              </Link>
              <Link
                href="/settings/pipelines"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                title="Settings"
              >
                <Settings size={18} />
              </Link>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--color-brand,#4361ee)] to-indigo-400 text-[11px] font-bold text-white shadow-2xs overflow-hidden ring-1 ring-white/20 hover:scale-105 transition-transform cursor-pointer"
                title={`Edit Profile: ${currentUser?.name || "User"}`}
              >
                {currentUser?.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser?.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:text-[var(--color-brand,#4361ee)] hover:bg-indigo-50 transition-all cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[var(--color-sidebar-border,rgba(255,255,255,0.1))] w-full">
              <div
                onClick={() => setProfileModalOpen(true)}
                role="button"
                tabIndex={0}
                title="Click to edit profile"
                className="flex items-center gap-2.5 rounded-2xl bg-[var(--color-sidebar-item-hover,rgba(255,255,255,0.06))] p-2 border border-[var(--color-sidebar-border,rgba(255,255,255,0.15))] backdrop-blur-md hover:bg-[var(--color-sidebar-item-hover,rgba(255,255,255,0.12))] transition-all cursor-pointer group"
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--color-brand,#4361ee)] to-indigo-400 text-[12px] font-bold text-white shadow-2xs overflow-hidden ring-1 ring-white/20">
                  {currentUser?.image ? (
                    <img
                      src={currentUser.image}
                      alt={currentUser?.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--color-sidebar-fg,#ffffff)] group-hover:text-[var(--color-brand,#4361ee)] transition-colors">
                    {currentUser?.name ?? currentUser?.email ?? "Ahmad Aziz"}
                  </p>
                  <p className="truncate text-[10.5px] text-brand font-semibold tracking-wider">
                    {currentUser?.designation || currentUser?.occupation || currentUser?.role || "Sales Rep"}
                  </p>
                </div>
                <form action={logoutAction} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="submit"
                    title="Sign out"
                    className="shrink-0 rounded-xl p-2 text-[var(--color-sidebar-fg-muted,#94a3b8)] hover:bg-[var(--color-sidebar-item-hover)] hover:text-rose-400 transition-colors shadow-2xs cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </aside>

        {/* Main Workspace Canvas */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] crm-glass-shell bg-[var(--color-surface,#ffffff)] border border-[var(--color-border,#e2e8f0)] shadow-md shadow-slate-300/20 p-5 md:p-7 relative z-10">
          {/* Header Bar */}
          <header className={`flex shrink-0 items-center justify-between pb-3 border-b border-border ${!title && !headerLeft ? "min-h-[48px]" : "h-12"}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {headerLeft ? (
                headerLeft
              ) : title ? (
                <h1 className="text-[22px] font-bold tracking-tight text-text">{title}</h1>
              ) : null}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Quick Create Pill Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                  className="flex items-center gap-2 rounded-full bg-[var(--color-brand,#4361ee)] hover:opacity-90 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm shadow-indigo-300/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Create</span>
                  <ChevronDown size={13} className="text-white/80" />
                </button>

                {quickCreateOpen && (
                  <div
                    data-floating-menu="true"
                    className="dropdown-menu floating-dropdown absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border/80 bg-[var(--color-surface-elevated,#0f172a)] shadow-2xl p-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 space-y-1"
                    onClick={() => setQuickCreateOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => router.push("/leads")}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <UserPlus size={15} className="text-brand shrink-0" />
                      <span>New Lead</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/pipeline")}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <Handshake size={15} className="text-emerald-500 shrink-0" />
                      <span>New Deal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/meetings")}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <Calendar size={15} className="text-cyan-500 shrink-0" />
                      <span>New Meeting</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/products")}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <Package size={15} className="text-blue-500 shrink-0" />
                      <span>New Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTaskModal(true)}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <CheckSquare size={15} className="text-amber-500 shrink-0" />
                      <span>New Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/contacts")}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-text hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                    >
                      <Contact size={15} className="text-purple-500 shrink-0" />
                      <span>New Contact</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2 shadow-2xs transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={16} />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#f43f5e] ring-2 ring-surface" />
                </button>
                {notificationsOpen && (
                  <NotificationsPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
                )}
              </div>

              {/* User Profile Pill */}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                title="Click to edit profile"
                className="flex items-center gap-2.5 bg-surface border border-border hover:border-brand/50 hover:bg-surface-2 rounded-full px-3.5 py-1.5 shadow-2xs transition-all cursor-pointer group text-left"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand,#4361ee)] text-[11px] font-bold text-white shadow-2xs overflow-hidden ring-1 ring-border">
                  {currentUser?.image ? (
                    <img
                      src={currentUser.image}
                      alt={currentUser?.name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12.5px] font-bold text-text leading-tight group-hover:text-brand transition-colors">
                    {currentUser?.name ?? "Ahmad Aziz"}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted leading-tight">
                    {currentUser?.designation || currentUser?.occupation || `${branding.companyName || "DEALNEST"} Sales`}
                  </span>
                </div>
                <ChevronDown size={13} className="text-text-muted ml-0.5 group-hover:text-text transition-colors" />
              </button>
            </div>
          </header>

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto mt-4 pr-1">
            {children}
          </main>
        </div>

        {/* Global Modals & AI Copilot */}
        {paletteOpen && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}
        {quickTaskModal && (
          <TaskModal
            open={quickTaskModal}
            onClose={() => setQuickTaskModal(false)}
            members={[]}
          />
        )}
        <EditProfileModal
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser((prev: any) => ({ ...prev, ...updated }));
          }}
        />
        <DealNestCopilot />
      </div>
    </ToastProvider>
  );
}

export function ExportButton({
  data = [],
  filename = "mytm_export",
  label = "Export CSV",
}: {
  data?: any[];
  filename?: string;
  label?: string;
}) {
  function handleExport() {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-[12px] font-bold text-text hover:border-brand/40 hover:bg-surface-2 shadow-sm transition-all cursor-pointer"
    >
      <Download size={13} className="text-brand shrink-0" />
      <span>{label}</span>
    </button>
  );
}
