"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  Plus,
  GripVertical,
  Pencil,
  Check,
  Eye,
  ArrowRightCircle,
  User,
  Package,
  Clock,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flame,
  Zap,
  Snowflake,
  FolderInput,
  UserCheck,
  Tag,
  Trash2,
} from "lucide-react";

export type BoardStage = { id: string; name: string; color: string };

export type BoardCardTag = {
  label: string;
  color?: string;
};

export type BoardCard = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  stageId: string;
  tag?: { label: string; tone: "hot" | "warm" | "cold" | "neutral" };
  tags?: BoardCardTag[];
  score?: "hot" | "warm" | "cold" | string | null;
  source?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  href?: string;
  actionLabel?: string;
  contact?: {
    id: string;
    name: string;
    title?: string | null;
  } | null;
  owner?: {
    id?: string;
    name: string | null;
  } | null;
  companyName?: string | null;
  roleTitle?: string | null;
  productName?: string | null;
  lastInteraction?: {
    type: string;
    date: string;
    summary?: string | null;
  } | null;
  nextStep?: {
    title: string;
    dueDate?: string | null;
  } | null;
  dateHistory?: Array<{
    stageName: string;
    date: string;
  }>;
  phone?: string | null;
  email?: string | null;
};

type ScoreTone = "hot" | "warm" | "cold" | "neutral";

function ScoreDot({ tone }: { tone: ScoreTone }) {
  const map: Record<string, string> = {
    hot: "bg-danger",
    warm: "bg-warning",
    cold: "bg-text-faint",
    neutral: "bg-accent",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${map[tone]}`} />;
}

export function LeadScoreBadge({ score }: { score?: string | null }) {
  if (!score) return null;
  const s = score.toLowerCase();
  if (s === "hot") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
        <Flame size={12} className="text-rose-500 fill-rose-500/20 shrink-0" />
        <span>Hot Lead</span>
      </span>
    );
  }
  if (s === "warm") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
        <Zap size={12} className="text-amber-500 fill-amber-500/20 shrink-0" />
        <span>Warm Lead</span>
      </span>
    );
  }
  if (s === "cold") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
        <Snowflake size={12} className="text-blue-500 shrink-0" />
        <span>Cold Lead</span>
      </span>
    );
  }
  return null;
}

function Card({
  card,
  onAction,
  onClick,
  selectable,
  isSelected,
  onToggleSelect,
  members,
  onChangeOwner,
  onEdit,
  onMoveToSection,
  onDelete,
  onToggleTag,
  sections,
  availableLabels,
}: {
  card: BoardCard;
  onAction?: (cardId: string) => void;
  onClick?: (cardId: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (cardId: string) => void;
  members?: Array<{ id: string; name: string | null }>;
  onChangeOwner?: (cardId: string, newOwnerId: string) => void;
  onEdit?: (cardId: string) => void;
  onMoveToSection?: (cardId: string, sectionId: string) => void;
  onDelete?: (cardId: string) => void;
  onToggleTag?: (cardId: string, tag: string) => void;
  sections?: Array<{ id: string; name: string; isDefault?: boolean }>;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
}) {
  const router = useRouter();
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<"section" | "owner" | "labels" | null>(null);

  const ownerMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: "card" },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target as Node)) {
        setShowOwnerMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
        setExpandedSubmenu(null);
      }
    }
    if (showOwnerMenu || showActionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOwnerMenu, showActionsMenu]);

  function openCardPage() {
    if (onClick) {
      onClick(card.id);
    } else if (card.href) {
      router.push(card.href);
    }
  }

  return (
    <div
      data-testid={`lead-card-${card.id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={`group card relative cursor-pointer rounded-xl border p-3.5 shadow-sm transition-all hover:shadow-md hover:border-brand/60 active:cursor-grabbing ${
        isSelected
          ? "ring-2 ring-brand border-brand bg-brand/5 shadow-md"
          : "border-border bg-surface"
      } ${isDragging ? "opacity-40" : ""} ${
        showActionsMenu || showOwnerMenu ? "relative z-50 overflow-visible" : "relative overflow-hidden"
      }`}
    >
      {/* Top row: Checkbox, Title & Action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(card.id);
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand/40 cursor-pointer shrink-0 mt-0.5 accent-brand"
            />
          )}
          <p className="text-[13px] font-bold leading-snug text-text group-hover:text-brand transition-colors truncate">
            {card.title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {card.href && (
            <button
              data-testid={`open-lead-page-${card.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCardPage();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-brand"
              title="View lead details"
            >
              <Eye size={13} />
            </button>
          )}

          {/* 3 Dots Actions Menu Button */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActionsMenu((v) => !v);
                setExpandedSubmenu(null);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`rounded p-1 transition-colors ${
                showActionsMenu
                  ? "bg-brand/15 text-brand"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
              title="Card options"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Floating 3-Dots Action Dropdown */}
            {showActionsMenu && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute right-0 top-full mt-1.5 z-[1000] w-52 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="space-y-0.5">
                  {/* Edit Option */}
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        onEdit(card.id);
                      }}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-text rounded-xl hover:bg-brand/15 hover:text-brand transition-colors cursor-pointer"
                    >
                      <Pencil size={13} className="text-text-muted shrink-0" />
                      <span>Edit Details</span>
                    </button>
                  )}

                  {/* Move to Section Option */}
                  {sections && sections.length > 0 && onMoveToSection && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedSubmenu((v) => (v === "section" ? null : "section"))
                        }
                        className="menu-option w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-text rounded-xl hover:bg-brand/15 hover:text-brand transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FolderInput size={13} className="text-brand shrink-0" />
                          <span>Move to Section</span>
                        </div>
                        <ChevronRight
                          size={12}
                          className={`text-text-faint transition-transform duration-150 ${
                            expandedSubmenu === "section" ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {expandedSubmenu === "section" && (
                        <div className="submenu-container ml-2 pl-2.5 pr-1.5 py-1.5 my-1 space-y-1 border-l-2 border-brand/50 rounded-r-xl max-h-40 overflow-y-auto">
                          {sections.map((s) => {
                            const isCurrent = card.sectionId === s.id;
                            return (
                              <button
                                key={s.id}
                                disabled={isCurrent}
                                onClick={() => {
                                  setShowActionsMenu(false);
                                  onMoveToSection(card.id, s.id);
                                }}
                                className={`menu-option w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[11.5px] rounded-lg transition-colors cursor-pointer ${
                                  isCurrent
                                    ? "active-selected font-bold text-brand bg-brand/15 cursor-default"
                                    : "text-text hover:bg-brand/10 hover:text-brand"
                                }`}
                              >
                                <span className="truncate">{s.name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] text-brand font-semibold shrink-0">
                                    Current
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Change Owner Option */}
                  {members && members.length > 0 && onChangeOwner && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedSubmenu((v) => (v === "owner" ? null : "owner"))
                        }
                        className="menu-option w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-text rounded-xl hover:bg-brand/15 hover:text-brand transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck size={13} className="text-text-muted shrink-0" />
                          <span>Reassign Owner</span>
                        </div>
                        <ChevronRight
                          size={12}
                          className={`text-text-faint transition-transform duration-150 ${
                            expandedSubmenu === "owner" ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {expandedSubmenu === "owner" && (
                        <div className="submenu-container ml-2 pl-2.5 pr-1.5 py-1.5 my-1 space-y-1 border-l-2 border-brand/50 rounded-r-xl max-h-40 overflow-y-auto">
                          {members.map((m) => {
                            const isCurrent = card.owner?.id === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setShowActionsMenu(false);
                                  onChangeOwner(card.id, m.id);
                                }}
                                className={`menu-option w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[11.5px] rounded-lg transition-colors cursor-pointer ${
                                  isCurrent
                                    ? "active-selected font-bold text-brand bg-brand/15"
                                    : "text-text hover:bg-brand/10 hover:text-brand"
                                }`}
                              >
                                <span className="truncate">
                                  {m.name || "Unnamed Member"}
                                </span>
                                {isCurrent && (
                                  <Check size={11} className="shrink-0 text-brand" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Labels Option */}
                  {availableLabels && availableLabels.length > 0 && onToggleTag && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedSubmenu((v) => (v === "labels" ? null : "labels"))
                        }
                        className="menu-option w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-text rounded-xl hover:bg-brand/15 hover:text-brand transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Tag size={13} className="text-text-muted shrink-0" />
                          <span>Labels & Tags</span>
                        </div>
                        <ChevronRight
                          size={12}
                          className={`text-text-faint transition-transform duration-150 ${
                            expandedSubmenu === "labels" ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {expandedSubmenu === "labels" && (
                        <div className="submenu-container ml-2 pl-2.5 pr-1.5 py-1.5 my-1 space-y-1 border-l-2 border-brand/50 rounded-r-xl max-h-40 overflow-y-auto">
                          {availableLabels.map((l) => {
                            const hasTag = card.tags?.some(
                              (t) => t.label.toLowerCase() === l.name.toLowerCase()
                            );
                            return (
                              <button
                                key={l.id || l.name}
                                onClick={() => {
                                  onToggleTag(card.id, l.name);
                                }}
                                className="menu-option w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[11.5px] rounded-lg hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: l.color }}
                                  />
                                  <span className="truncate">{l.name}</span>
                                </div>
                                {hasTag && (
                                  <Check size={11} className="shrink-0 text-brand font-bold" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Convert Option */}
                  {card.actionLabel && onAction && (
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        onAction(card.id);
                      }}
                      className="menu-option w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-text rounded-xl hover:bg-brand/15 hover:text-brand transition-colors cursor-pointer"
                    >
                      <ArrowRightCircle size={13} className="text-text-muted shrink-0" />
                      <span>{card.actionLabel}</span>
                    </button>
                  )}

                  {/* Delete Option */}
                  {onDelete && (
                    <div className="border-t border-border/60 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onDelete(card.id);
                        }}
                        className="danger-option menu-option w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-rose-500 rounded-xl hover:bg-rose-500/15 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} className="shrink-0" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <GripVertical size={13} className="mt-0.5 shrink-0 text-text-muted/60" />
        </div>
      </div>

      {/* Company / role snapshot + Section Pill */}
      <div className="mt-1 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-text truncate">
            {card.companyName || card.subtitle}
          </p>
          {card.roleTitle && (
            <p className="mt-0.5 text-[11px] font-medium text-text-muted truncate">
              {card.roleTitle}
            </p>
          )}
        </div>
        {card.sectionName && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand/10 text-brand border border-brand/20 shrink-0"
            title={`Section: ${card.sectionName}`}
          >
            <span>📁</span>
            <span className="truncate max-w-[110px]">{card.sectionName}</span>
          </span>
        )}
      </div>

      {/* Product Tag (if applicable) */}
      {card.productName && (
        <div className="mt-2 flex max-w-full items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-text">
          <Package size={11} className="text-brand shrink-0" />
          <span className="min-w-0 truncate">{card.productName}</span>
        </div>
      )}

      <div className="mt-2 space-y-1.5">
        {card.lastInteraction ? (
          <div
            className="rounded-lg border border-border/50 bg-surface-2/70 px-2 py-1.5"
            title={card.lastInteraction.summary || undefined}
          >
            <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold uppercase tracking-wide text-text-faint">
              <span className="inline-flex items-center gap-1">
                <Clock size={10} className="text-brand" />
                Last {card.lastInteraction.type}
              </span>
              <span className="font-numeric normal-case tracking-normal">{card.lastInteraction.date}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-text">
              {card.lastInteraction.summary || "Interaction logged, no summary captured."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-surface-2/40 px-2 py-1.5 text-[11px] font-medium text-text-muted">
            No interaction logged yet
          </div>
        )}

        {card.nextStep && (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
            <Calendar size={11} className="shrink-0" />
            <span className="min-w-0 truncate">Next: {card.nextStep.title}</span>
            {card.nextStep.dueDate && (
              <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-numeric text-[10px]">
                {card.nextStep.dueDate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contact badge on Deal Card (if title is different) */}
      {card.contact && card.contact.name !== card.title && (
        <div className="mt-1.5">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-2/80 border border-border/60 text-[11px] font-semibold text-text"
            title={card.contact.name}
          >
            <User size={11} className="text-brand shrink-0" />
            <span className="truncate max-w-[150px]">
              {card.contact.name}
            </span>
          </span>
        </div>
      )}

      {/* Owner badge and quick reassignment */}
      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-1 text-[11px] relative">
        <div className="flex items-center gap-1 text-text-muted min-w-0">
          <User size={11} className="text-text-faint shrink-0" />
          <span className="text-text-faint text-[10.5px]">Owner:</span>
          <span className="font-semibold text-text truncate max-w-[110px]">
            {card.owner?.name || "Unassigned"}
          </span>
        </div>

        {onChangeOwner && members && members.length > 0 && (
          <div className="relative shrink-0" ref={ownerMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOwnerMenu((v) => !v);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-[10.5px] font-semibold text-brand hover:underline px-1.5 py-0.5 rounded hover:bg-brand/10 transition-colors"
              title="Change ownership"
            >
              Reassign
            </button>

            {showOwnerMenu && (
              <div
                data-floating-menu="true"
                style={{ backgroundColor: "var(--color-surface-elevated, #0f172a)" }}
                className="dropdown-menu floating-dropdown absolute right-0 top-6 z-[1000] w-52 rounded-2xl border border-border-strong bg-[var(--color-surface-elevated,#0f172a)] p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="px-2.5 py-1 text-[10.5px] font-bold text-text-faint uppercase tracking-wider border-b border-border/50 mb-1">
                  Assign Lead Owner
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChangeOwner(card.id, m.id);
                        setShowOwnerMenu(false);
                      }}
                      className={`menu-option w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[11.5px] rounded-lg transition-colors cursor-pointer ${
                        card.owner?.id === m.id
                          ? "active-selected bg-brand/15 text-brand font-bold"
                          : "text-text hover:bg-brand/10 hover:text-brand"
                      }`}
                    >
                      <span className="truncate">{m.name || "Unnamed Member"}</span>
                      {card.owner?.id === m.id && <Check size={12} className="shrink-0 text-brand" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chronological Stage Progression History Timestamps */}
      {card.dateHistory && card.dateHistory.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1 text-[10px] text-text-muted flex-wrap font-medium leading-tight">
            <Clock size={10} className="text-text-faint shrink-0" />
            {card.dateHistory.map((dh, i) => {
              const isLast = i === card.dateHistory!.length - 1;
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-text-faint text-[9px]">→</span>}
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      isLast
                        ? "bg-brand/15 text-brand font-semibold"
                        : "bg-surface-2 text-text-muted"
                    }`}
                    title={`Stage: ${dh.stageName} on ${dh.date}`}
                  >
                    {dh.stageName}: <span className="font-numeric">{dh.date}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Customizable Badges / Labels */}
      {card.tags && card.tags.length > 0 && (
        <div className="mt-2.5 flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
          {card.tags.map((t, idx) => {
            const color = t.color || "#6366f1";
            return (
              <span
                key={idx}
                className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-bold tracking-wide shadow-xs"
                style={{
                  backgroundColor: `${color}18`,
                  borderColor: `${color}45`,
                  color: color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="min-w-0 max-w-[130px] truncate">{t.label}</span>
              </span>
            );
          })}
        </div>
      )}

      {card.actionLabel && onAction && (
        <button
          data-testid={`move-lead-to-pipeline-${card.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onAction(card.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-[11.5px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
          title="Move this lead into the deals pipeline"
        >
          <ArrowRightCircle size={13} />
          <span>{card.actionLabel}</span>
        </button>
      )}

      {/* Meta (Value / Phone) & Badges (Temperature, Source) */}
      <div className="mt-3 flex min-w-0 max-w-full flex-wrap items-center justify-between gap-2">
        {card.meta ? (
          <span className="font-numeric text-[12px] font-bold text-text truncate max-w-[140px]" title={card.meta}>
            {card.meta}
          </span>
        ) : (
          <span />
        )}

        <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-1.5">
          {/* Temperature Badge with proper icon! */}
          <LeadScoreBadge score={card.score} />

          {/* Source pill (e.g. LinkedIn, Inbound Web) */}
          {card.source && (
            <span
              className="min-w-0 max-w-full rounded-full border border-border/50 bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-text-muted"
              title={card.source}
            >
              <span className="block max-w-[150px] truncate">{card.source}</span>
            </span>
          )}

          {/* Fallback legacy tag if no score/source */}
          {!card.score && !card.source && card.tag && (
            <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-muted border border-border/40">
              <ScoreDot tone={card.tag.tone} />
              {card.tag.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  stage,
  cards,
  onRename,
  onCardAction,
  onCardClick,
  selectable,
  selectedCardIds,
  onToggleSelectCard,
  members,
  onChangeOwner,
  onEdit,
  onMoveToSection,
  onDelete,
  onToggleTag,
  sections,
  availableLabels,
  sortableEnabled,
}: {
  stage: BoardStage;
  cards: BoardCard[];
  onRename: (id: string, name: string) => void;
  onCardAction?: (cardId: string) => void;
  onCardClick?: (cardId: string) => void;
  selectable?: boolean;
  selectedCardIds?: string[];
  onToggleSelectCard?: (cardId: string) => void;
  members?: Array<{ id: string; name: string | null }>;
  onChangeOwner?: (cardId: string, newOwnerId: string) => void;
  onEdit?: (cardId: string) => void;
  onMoveToSection?: (cardId: string, sectionId: string) => void;
  onDelete?: (cardId: string) => void;
  onToggleTag?: (cardId: string, tag: string) => void;
  sections?: Array<{ id: string; name: string; isDefault?: boolean }>;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  sortableEnabled?: boolean;
}) {
  const {
    attributes: stageDragAttributes,
    listeners: stageDragListeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `stage:${stage.id}`,
    data: { type: "stage", stageId: stage.id },
    disabled: !sortableEnabled,
  });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: stage.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);

  return (
    <div
      data-testid={`stage-column-${stage.id}`}
      ref={setSortableNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex h-full w-[280px] shrink-0 flex-col rounded-xl border transition-colors ${
        isOver ? "border-accent bg-accent-soft/40" : "border-transparent"
      } ${isDragging ? "z-40 opacity-70" : ""}`}
    >
      <div className="flex items-center justify-between px-2 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {sortableEnabled && (
            <button
              type="button"
              {...stageDragAttributes}
              {...stageDragListeners}
              className="shrink-0 cursor-grab rounded p-1 text-text-faint hover:bg-surface-2 hover:text-brand active:cursor-grabbing"
              title="Drag to reorder this stage"
            >
              <GripVertical size={13} />
            </button>
          )}
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} />
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                setEditing(false);
                onRename(stage.id, name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditing(false);
                  onRename(stage.id, name);
                }
              }}
              className="w-full rounded border border-border-strong bg-surface px-1.5 py-0.5 text-[13px] font-semibold text-text outline-none"
            />
          ) : (
            <span className="truncate text-[13.5px] font-bold text-text">{stage.name}</span>
          )}
          <span className="shrink-0 text-[11.5px] font-semibold text-text-faint px-1.5 py-0.5 rounded-full bg-surface-2">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded p-1 text-text-faint hover:bg-surface-2 hover:text-text-muted"
        >
          {editing ? <Check size={13} /> : <Pencil size={13} />}
        </button>
      </div>

      <div ref={setDroppableNodeRef} className="flex-1 space-y-2.5 overflow-y-auto rounded-xl bg-surface-2/70 p-2.5">
        {cards.map((c) => (
          <Card
            key={c.id}
            card={c}
            onAction={onCardAction}
            onClick={onCardClick}
            selectable={selectable}
            isSelected={selectedCardIds?.includes(c.id)}
            onToggleSelect={onToggleSelectCard}
            members={members}
            onChangeOwner={onChangeOwner}
            onEdit={onEdit}
            onMoveToSection={onMoveToSection}
            onDelete={onDelete}
            onToggleTag={onToggleTag}
            sections={sections}
            availableLabels={availableLabels}
          />
        ))}
        {cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-strong px-3 py-8 text-center text-[12.5px] text-text-faint">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  initialStages,
  initialCards,
  onMoveCard,
  onRenameStage,
  onAddStage,
  onCardAction,
  onCardClick,
  selectable,
  selectedCardIds,
  onToggleSelectCard,
  members,
  onChangeOwner,
  onEditCard,
  onMoveCardToSection,
  onDeleteCard,
  onToggleCardTag,
  sections,
  availableLabels,
  onReorderStages,
}: {
  initialStages: BoardStage[];
  initialCards: BoardCard[];
  onMoveCard?: (cardId: string, stageId: string) => void;
  onRenameStage?: (stageId: string, name: string) => void;
  onAddStage?: (name: string) => void;
  onCardAction?: (cardId: string) => void;
  onCardClick?: (cardId: string) => void;
  selectable?: boolean;
  selectedCardIds?: string[];
  onToggleSelectCard?: (cardId: string) => void;
  members?: Array<{ id: string; name: string | null }>;
  onChangeOwner?: (cardId: string, newOwnerId: string) => void;
  onEditCard?: (cardId: string) => void;
  onMoveCardToSection?: (cardId: string, sectionId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onToggleCardTag?: (cardId: string, tag: string) => void;
  sections?: Array<{ id: string; name: string; isDefault?: boolean }>;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  onReorderStages?: (stageIds: string[]) => void;
}) {
  const [stages, setStages] = useState(initialStages);
  const [cards, setCards] = useState(initialCards);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);

  function handleDragStart(e: DragStartEvent) {
    if (e.active.data.current?.type === "stage") {
      setActiveCard(null);
      return;
    }
    setActiveCard(cards.find((c) => c.id === e.active.id) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    if (active.data.current?.type === "stage") {
      const activeStageId = String(active.id).replace(/^stage:/, "");
      const overStageId = String(over.id).replace(/^stage:/, "");
      if (!activeStageId || !overStageId || activeStageId === overStageId) return;

      setStages((prev) => {
        const oldIndex = prev.findIndex((stage) => stage.id === activeStageId);
        const newIndex = prev.findIndex((stage) => stage.id === overStageId);
        if (oldIndex < 0 || newIndex < 0) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        onReorderStages?.(next.map((stage) => stage.id));
        return next;
      });
      return;
    }

    const stageId = String(over.id).replace(/^stage:/, "");
    setCards((prev) => prev.map((c) => (c.id === active.id ? { ...c, stageId } : c)));
    onMoveCard?.(String(active.id), stageId);
  }

  function renameStage(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    onRenameStage?.(id, name);
  }

  function addStage() {
    if (!newStageName.trim()) {
      setAddingStage(false);
      return;
    }
    const tempId = `temp-${Date.now()}`;
    setStages((prev) => [...prev, { id: tempId, name: newStageName.trim(), color: "#6b6d72" }]);
    onAddStage?.(newStageName.trim());
    setNewStageName("");
    setAddingStage(false);
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        <SortableContext
          items={stages.map((stage) => `stage:${stage.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {stages.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              cards={cards.filter((c) => c.stageId === stage.id)}
              onRename={renameStage}
              onCardAction={onCardAction}
              onCardClick={onCardClick}
              selectable={selectable}
              selectedCardIds={selectedCardIds}
              onToggleSelectCard={onToggleSelectCard}
              members={members}
              onChangeOwner={onChangeOwner}
              onEdit={onEditCard}
              onMoveToSection={onMoveCardToSection}
              onDelete={onDeleteCard}
              onToggleTag={onToggleCardTag}
              sections={sections}
              availableLabels={availableLabels}
              sortableEnabled={Boolean(onReorderStages)}
            />
          ))}
        </SortableContext>

        {onAddStage && <div className="w-[220px] shrink-0 pt-2">
          {addingStage ? (
            <div className="rounded-lg border border-border bg-surface p-2 shadow-card">
              <input
                autoFocus
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStage()}
                placeholder="Stage name"
                className="w-full rounded border border-border-strong px-2 py-1 text-[13px] outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={addStage}
                  className="rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-fg"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingStage(false)}
                  className="rounded-md px-2.5 py-1 text-[12px] text-text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingStage(true)}
              className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-3 py-2 text-[13px] text-text-muted hover:border-accent hover:text-accent"
            >
              <Plus size={14} />
              Add stage
            </button>
          )}
        </div>}
      </div>

      <DragOverlay>
        {activeCard ? (
          <Card
            card={activeCard}
            sections={sections}
            members={members}
            availableLabels={availableLabels}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
