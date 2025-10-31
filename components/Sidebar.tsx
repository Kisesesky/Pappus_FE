'use client';

import Link from "next/link";
import { useEffect, useMemo, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  FolderKanban,
  BookText,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Hash,
  Star,
  VolumeX,
  PlusCircle,
  PanelsTopLeft,
  FileText,
  Table,
} from "lucide-react";
import clsx from "clsx";
import { useChat } from "@/store/chat";

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active?: boolean;
};

const NavItem = ({ href, label, icon: Icon, active = false }: NavItemProps) => (
  <Link
    href={href}
    className={clsx(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        : "text-sidebar-foreground hover:bg-sidebar-accent"
    )}
  >
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

const DOC_PAGE_MENU = [
  { id: "spec", title: "제품 스펙", description: "MVP 요구사항과 범위" },
  { id: "roadmap", title: "제품 로드맵", description: "분기별 마일스톤" },
  { id: "retro", title: "프로젝트 회고", description: "잘된 점과 개선점" },
];

type ExpandableNavProps = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  active?: boolean;
  children?: React.ReactNode;
};

function ExpandableNav({
  icon: Icon,
  label,
  open,
  onToggle,
  onNavigate,
  active = false,
  children,
}: ExpandableNavProps) {
  const handleClick = () => {
    onNavigate?.();
    onToggle();
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors border",
          open || active
            ? "border-sidebar-primary/40 bg-sidebar-accent text-sidebar-foreground shadow-sm"
            : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent"
        )}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} />
          <span>{label}</span>
        </span>
        <ChevronUp
          size={14}
          className={clsx("transition-transform", open ? "rotate-180" : "-rotate-90")}
        />
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  action?: ReactNode;
};

function SectionHeader({ title, collapsed, onToggle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-muted">
      <button
        type="button"
        className="flex items-center gap-2 transition-colors hover:text-sidebar-foreground"
        onClick={onToggle}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
      >
        {collapsed ? <ChevronLeft size={14} /> : <ChevronDown size={14} />}
        <span>{title}</span>
      </button>
      {action}
    </div>
  );
}

type ChannelRowProps = {
  id: string;
  label: string;
  isDM: boolean;
  isActive: boolean;
  isMuted: boolean;
  unread: number;
  mentions: number;
  isStarred: boolean;
  isTyping: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
};

type ChatGroupKey = "starred" | "channels" | "dms";

function ChannelRow({
  id,
  label,
  isDM,
  isActive,
  isMuted,
  unread,
  mentions,
  isStarred,
  isTyping,
  onSelect,
  onToggleStar,
}: ChannelRowProps) {
  const badgeCount = mentions > 0 ? mentions : unread;
  const badgeText = badgeCount > 99 ? "99+" : badgeCount > 0 ? String(badgeCount) : "";
  const initials = isDM
    ? label.replace(/^@/, "").trim().split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "";
  const presenceDotClass = isTyping ? "bg-emerald-500" : "bg-zinc-400";

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={clsx(
        "w-full flex items-center gap-3 rounded-md px-3 py-2 transition focus:outline-none focus:ring-1 focus:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-primary/10 border border-sidebar-primary text-sidebar-primary"
          : "border border-transparent text-sidebar-foreground/90 hover:border-sidebar-border hover:bg-sidebar-accent",
        mentions > 0 && !isActive ? "border-rose-400/40" : null
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isDM ? (
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold uppercase text-sidebar-foreground">
              {initials || "DM"}
              <span className={clsx("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-border", presenceDotClass)} />
            </span>
          ) : (
            <Hash size={14} className="text-sidebar-foreground/50" />
          )}
          <span className={clsx("truncate text-sm font-medium", isActive ? "text-sidebar-primary" : "text-sidebar-foreground")}>
            {label}
          </span>
          {isMuted && <VolumeX size={12} className="text-sidebar-foreground/40" />}
          {isTyping && <span className="text-[11px] text-emerald-500">typing...</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {badgeText && (
          <span
            className={clsx(
              "min-w-[24px] rounded-full px-2 py-0.5 text-xs font-semibold text-white text-center shadow-sm",
              mentions > 0 ? "bg-rose-500" : "bg-primary"
            )}
          >
            {badgeText}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar(id);
          }}
          className="rounded p-1 text-muted opacity-60 hover:bg-sidebar-accent hover:text-amber-400"
          aria-label="Toggle favorite"
        >
          <Star size={14} className={clsx(isStarred ? "text-amber-400 fill-amber-400" : "text-muted opacity-40")} />
        </button>
      </div>
    </button>
  );
}

export default function Sidebar() {
  const {
    channels,
    allChannels,
    setChannel,
    channelId,
    loadChannels,
    workspaces,
    workspaceId,
    setWorkspace,
    toggleSectionCollapsed,
    users,
    channelTopics,
    typingUsers,
    toggleStar,
    channelActivity,
  } = useChat();
  const pathname = usePathname();
  const router = useRouter();
  const [chatExpanded, setChatExpanded] = useState(true);
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [activeDocId, setActiveDocId] = useState<string>("spec");
  const [fallbackCollapsed, setFallbackCollapsed] = useState<Record<ChatGroupKey, boolean>>({
    starred: false,
    channels: false,
    dms: false,
  });

  useEffect(() => {
    if (workspaces.length === 0) {
      void loadChannels();
    }
  }, [workspaces.length, loadChannels]);

  useEffect(() => {
    if (pathname?.startsWith("/app/chat")) setChatExpanded(true);
    if (pathname?.startsWith("/app/docs")) setDocsExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("fd.docs.active");
    if (saved) setActiveDocId(saved);
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id) {
        setActiveDocId(detail.id);
      }
    };
    window.addEventListener("docs:active-page", handler as EventListener);
    return () => window.removeEventListener("docs:active-page", handler as EventListener);
  }, []);

  const workspace = useMemo(() => {
    return workspaces.find(ws => ws.id === workspaceId) || workspaces[0];
  }, [workspaces, workspaceId]);

  const workspaceChannels = useMemo(() => {
    if (channels.length > 0) return channels;
    const targetWorkspaceId = workspace?.id ?? workspaceId;
    return allChannels.filter(c => c.workspaceId === targetWorkspaceId);
  }, [channels, allChannels, workspace?.id, workspaceId]);

  const channelMap = useMemo(() => {
    const map = new Map<string, typeof workspaceChannels[number]>();
    workspaceChannels.forEach(c => map.set(c.id, c));
    return map;
  }, [workspaceChannels]);

  const starredSet = useMemo(() => {
    const starredSection = workspace?.sections?.find(sec => sec.type === "starred");
    return new Set(starredSection?.itemIds ?? []);
  }, [workspace]);

  const sectionMeta = useMemo(() => {
    const meta = new Map<ChatGroupKey, { id?: string; collapsed?: boolean; ids?: string[] }>();
    workspace?.sections?.forEach((sec) => {
      if (sec.type === "starred" || sec.type === "channels" || sec.type === "dms") {
        meta.set(sec.type as ChatGroupKey, {
          id: sec.id,
          collapsed: !!sec.collapsed,
          ids: sec.itemIds ?? [],
        });
      }
    });
    return meta;
  }, [workspace?.sections]);

  const defaultGroupIds = useMemo<Record<ChatGroupKey, string[]>>(() => {
    const starred = workspaceChannels
      .filter((ch) => starredSet.has(ch.id))
      .map((ch) => ch.id);
    const regular = workspaceChannels
      .filter((ch) => !ch.isDM && !starredSet.has(ch.id))
      .map((ch) => ch.id);
    const dms = workspaceChannels
      .filter((ch) => ch.isDM)
      .map((ch) => ch.id);
    return {
      starred,
      channels: regular,
      dms,
    };
  }, [workspaceChannels, starredSet]);

  const renderItemLabel = useCallback((id: string) => {
    const channel = channelMap.get(id);
    if (channel) return channel.name;
    if (id.startsWith("dm:")) {
      const target = id.slice(3);
      const user = users[target];
      return `@ ${user?.name ?? target}`;
    }
    return id;
  }, [channelMap, users]);

  const handleSelectChannel = useCallback((id: string) => {
    void setChannel(id);
    if (!pathname?.startsWith("/app/chat")) {
      router.push("/app/chat");
    }
    setChatExpanded(true);
  }, [setChannel, pathname, router]);

  const handleToggleStar = useCallback((id: string) => {
    toggleStar(id);
  }, [toggleStar]);

  const handleToggleGroup = useCallback((key: ChatGroupKey) => {
    const meta = sectionMeta.get(key);
    if (meta?.id) {
      toggleSectionCollapsed(meta.id);
    } else {
      setFallbackCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  }, [sectionMeta, toggleSectionCollapsed]);

  const handleOpenCreateChannel = useCallback(() => {
    setChatExpanded(true);
    if (!pathname?.startsWith("/app/chat")) {
      router.push("/app/chat");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("chat:open-create-channel"));
    }
  }, [pathname, router]);

  const toggleChatSection = useCallback(() => {
    setChatExpanded(prev => !prev);
  }, []);

  const toggleDocsSection = useCallback(() => {
    setDocsExpanded(prev => !prev);
  }, []);

  useEffect(() => {
    if (!chatExpanded) return;

    sectionMeta.forEach((meta) => {
      if (meta?.id && meta.collapsed) {
        toggleSectionCollapsed(meta.id, false);
      }
    });

    setFallbackCollapsed((prev) => {
      let changed = false;
      const next = { ...prev } as Record<ChatGroupKey, boolean>;
      ( ["starred", "channels", "dms"] as ChatGroupKey[] ).forEach((key) => {
        if (!sectionMeta.has(key) && prev[key] === undefined) {
          next[key] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [chatExpanded, sectionMeta, toggleSectionCollapsed]);

  const handleNavigateDocs = useCallback(() => {
    if (!pathname?.startsWith("/app/docs")) {
      router.push("/app/docs");
    }
  }, [pathname, router]);

  const handleSelectDoc = useCallback((id: string) => {
    setDocsExpanded(true);
    setActiveDocId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fd.docs.active", id);
      const emit = () => window.dispatchEvent(new CustomEvent("docs:change-page", { detail: { id } }));
      if (pathname?.startsWith("/app/docs")) {
        emit();
      } else {
        window.setTimeout(emit, 80);
      }
    }
    if (!pathname?.startsWith("/app/docs")) {
      router.push("/app/docs");
    }
  }, [pathname, router]);

  return (
    <div className="flex min-h-0 w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary/90 text-sidebar-primary-foreground font-semibold">
            FD
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.1em] text-muted">Workspace</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
              <span className="truncate">{workspace?.name ?? "Workspace"}</span>
              {workspaces.length > 1 && (
                <select
                  value={workspaceId}
                  onChange={(e) => void setWorkspace(e.target.value)}
                  className="ml-auto rounded border border-sidebar-border bg-sidebar-accent px-2 py-1 text-xs text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-primary hover:border-sidebar-primary hover:bg-sidebar-primary/10"
            onClick={handleOpenCreateChannel}
          >
            <PlusCircle size={14} />
            New channel
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">Projects</div>
          <div className="space-y-2">
            <NavItem
              href="/app/dashboard"
              label="Dashboard"
              icon={PanelsTopLeft}
              active={pathname?.startsWith("/app/dashboard")}
            />
            <NavItem
              href="/app/calendar"
              label="Calendar"
              icon={CalendarDays}
              active={pathname?.startsWith("/app/calendar")}
            />
            <NavItem
              href="/app/issues"
              label="Issues"
              icon={FolderKanban}
              active={pathname?.startsWith("/app/issues")}
            />
            <NavItem
              href="/app/worksheet"
              label="Worksheet"
              icon={Table}
              active={pathname?.startsWith("/app/worksheet")}
            />
            <ExpandableNav
              icon={MessageSquare}
              label="Chat"
              open={chatExpanded}
              onToggle={toggleChatSection}
              active={pathname?.startsWith("/app/chat")}
            >
              <div className="space-y-4 pl-1">
                {(["starred", "channels", "dms"] as ChatGroupKey[]).map((key, index) => {
                  const meta = sectionMeta.get(key);
                  const idsFromSection = meta?.ids ?? [];
                  const ids = (idsFromSection.length ? idsFromSection : defaultGroupIds[key]) ?? [];
                  if (key === "starred" && ids.length === 0) return null;

                  const collapsed = meta?.id ? !!meta.collapsed : !!fallbackCollapsed[key];
                  const titleMap: Record<ChatGroupKey, string> = {
                    starred: "Starred",
                    channels: "Channels",
                    dms: "Direct Messages",
                  };
                  const action = key === "channels"
                    ? (
                      <button
                        type="button"
                        onClick={handleOpenCreateChannel}
                        className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        aria-label="Create channel"
                      >
                        <PlusCircle size={14} />
                      </button>
                    )
                    : undefined;

                  const items = ids
                    .map((id) => {
                      const label = renderItemLabel(id);
                      if (!label) return null;
                      const channel = channelMap.get(id);
                      const isDM = channel?.isDM ?? id.startsWith("dm:");
                      const activity = channelActivity[id];
                      return {
                        id,
                        label,
                        isDM,
                        isActive: channelId === id,
                        isMuted: !!channelTopics[id]?.muted,
                        unread: activity?.unreadCount ?? 0,
                        mentions: activity?.mentionCount ?? 0,
                        isStarred: starredSet.has(id),
                        isTyping: (typingUsers[id] || []).length > 0,
                      } as ChannelRowProps;
                    })
                    .filter(Boolean) as ChannelRowProps[];

                  return (
                    <div
                      key={`chat-group-${key}`}
                      className={clsx(
                        "space-y-2",
                        index > 0 && "border-t border-border/60 pt-3"
                      )}
                    >
                      <div className="px-1">
                        <SectionHeader
                          title={titleMap[key]}
                          collapsed={collapsed}
                          onToggle={() => handleToggleGroup(key)}
                          action={action}
                        />
                      </div>
                      {!collapsed && (
                        <div className="mt-2 space-y-1">
                          {items.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted opacity-70">
                              {key === "dms" ? "No direct messages yet." : "No items yet."}
                            </div>
                          ) : (
                            items.map((item) => (
                              <ChannelRow
                                key={item.id}
                                {...item}
                                onSelect={handleSelectChannel}
                                onToggleStar={handleToggleStar}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ExpandableNav>
            <ExpandableNav
              icon={BookText}
              label="Docs"
              open={docsExpanded}
              onToggle={toggleDocsSection}
              onNavigate={handleNavigateDocs}
              active={pathname?.startsWith("/app/docs")}
            >
              <div className="space-y-1 pl-1">
                {DOC_PAGE_MENU.map((doc) => {
                  const isActive = activeDocId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelectDoc(doc.id)}
                      className={clsx(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                        isActive
                          ? "border-border bg-subtle/70 text-foreground shadow-inner"
                          : "border-transparent text-muted hover:bg-subtle/60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-muted" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ExpandableNav>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border text-xs text-muted">
        ⌘K Command Palette / v0.1
      </div>
    </div>
  );
}
