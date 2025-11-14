'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  FolderKanban,
  BookText,
  CalendarDays,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Hash,
  Star,
  VolumeX,
  PlusCircle,
  PanelsTopLeft,
  Table,
  Check,
  Trash2,
  LifeBuoy,
} from "lucide-react";
import clsx from "clsx";
import { useChat } from "@/store/chat";

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
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

const DEFAULT_WORKSPACE_BG = "#0EA5E9";
const VISIBLE_CHAT_GROUPS: ChatGroupKey[] = ["starred", "channels"];

const PRIMARY_NAV = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/issues", label: "Issues", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/members", label: "Members", icon: Users },
  { href: "/docs", label: "Note", icon: BookText },
];

const normalizeIconValue = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return Array.from(trimmed).slice(0, 2).join("");
};

const getWorkspaceInitials = (name?: string) => {
  const trimmed = name?.trim();
  if (!trimmed) return "SV";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SV";
  const letters =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : parts.slice(0, 2).map((part) => part[0] || "").join("");
  return letters.toUpperCase();
};

const getWorkspaceBadgeStyle = (target?: { backgroundColor?: string; image?: string }) => {
  if (target?.image) {
    return {
      backgroundImage: `url(${target.image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as const;
  }
  return {
    backgroundColor: target?.backgroundColor || DEFAULT_WORKSPACE_BG,
  } as const;
};

type ExpandableNavProps = {
  icon: LucideIcon;
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

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps = {}) {
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
    updateWorkspace,
    deleteWorkspace,
  } = useChat();
  const pathname = usePathname();
  const router = useRouter();
  const [chatExpanded, setChatExpanded] = useState(true);
  const [fallbackCollapsed, setFallbackCollapsed] = useState<Record<ChatGroupKey, boolean>>({
    starred: false,
    channels: false,
    dms: false,
  });
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  const [workspaceSettingsName, setWorkspaceSettingsName] = useState("");
  const [workspaceSettingsIcon, setWorkspaceSettingsIcon] = useState("");
  const [workspaceSettingsSaving, setWorkspaceSettingsSaving] = useState(false);
  const [workspaceDeleteConfirm, setWorkspaceDeleteConfirm] = useState(false);
  const serverSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workspaces.length === 0) {
      void loadChannels();
    }
  }, [workspaces.length, loadChannels]);

  useEffect(() => {
    if (pathname?.startsWith("/chat")) setChatExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (!serverMenuOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (!serverSwitcherRef.current?.contains(event.target as Node)) {
        setServerMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setServerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [serverMenuOpen]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find(ws => ws.id === workspaceId) || workspaces[0];
  }, [workspaces, workspaceId]);
  const activeWorkspaceInitials = useMemo(
    () => getWorkspaceInitials(activeWorkspace?.name),
    [activeWorkspace?.name],
  );
  const activeWorkspaceBadgeLabel = useMemo(
    () => (activeWorkspace?.icon?.trim() ? activeWorkspace.icon : activeWorkspaceInitials),
    [activeWorkspace?.icon, activeWorkspaceInitials],
  );
  const activeWorkspaceBadgeStyle = useMemo(
    () => getWorkspaceBadgeStyle(activeWorkspace),
    [activeWorkspace],
  );
  const workspaceSettingsIconPreview = useMemo(
    () => normalizeIconValue(workspaceSettingsIcon) || activeWorkspaceBadgeLabel,
    [workspaceSettingsIcon, activeWorkspaceBadgeLabel],
  );

  useEffect(() => {
    if (workspaceSettingsOpen && activeWorkspace) {
      setWorkspaceSettingsName(activeWorkspace.name ?? "");
      setWorkspaceSettingsIcon(activeWorkspace.icon ?? "");
      setWorkspaceDeleteConfirm(false);
    } else if (!workspaceSettingsOpen) {
      setWorkspaceDeleteConfirm(false);
    }
  }, [workspaceSettingsOpen, activeWorkspace]);

  const workspaceChannels = useMemo(() => {
    if (channels.length > 0) return channels;
    const targetWorkspaceId = activeWorkspace?.id ?? workspaceId;
    return allChannels.filter(c => c.workspaceId === targetWorkspaceId);
  }, [channels, allChannels, activeWorkspace?.id, workspaceId]);

  const channelMap = useMemo(() => {
    const map = new Map<string, typeof workspaceChannels[number]>();
    workspaceChannels.forEach(c => map.set(c.id, c));
    return map;
  }, [workspaceChannels]);

  const starredSet = useMemo(() => {
    const starredSection = activeWorkspace?.sections?.find(sec => sec.type === "starred");
    return new Set(starredSection?.itemIds ?? []);
  }, [activeWorkspace]);

  const sectionMeta = useMemo(() => {
    const meta = new Map<ChatGroupKey, { id?: string; collapsed?: boolean; ids?: string[] }>();
    activeWorkspace?.sections?.forEach((sec) => {
      if (sec.type === "starred" || sec.type === "channels" || sec.type === "dms") {
        meta.set(sec.type as ChatGroupKey, {
          id: sec.id,
          collapsed: !!sec.collapsed,
          ids: sec.itemIds ?? [],
        });
      }
    });
    return meta;
  }, [activeWorkspace?.sections]);

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

  const ensureChannelContext = useCallback(async (targetId?: string) => {
    const fallback = targetId ?? channelId ?? channels[0]?.id ?? allChannels[0]?.id;
    if (!fallback) return null;
    await setChannel(fallback);
    router.push(`/chat/${encodeURIComponent(fallback)}`);
    return fallback;
  }, [channelId, channels, allChannels, setChannel, router]);

  const handleSelectChannel = useCallback((id: string) => {
    setChatExpanded(true);
    void ensureChannelContext(id);
  }, [ensureChannelContext]);

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

  const handleOpenCreateChannel = useCallback(async () => {
    setChatExpanded(true);
    const target = await ensureChannelContext();
    if (target && typeof window !== "undefined") {
      window.setTimeout(() => window.dispatchEvent(new Event("chat:open-create-channel")), 300);
    }
  }, [ensureChannelContext]);

  const handleNavigateChat = useCallback(() => {
    if (!pathname?.startsWith("/chat")) {
      router.push("/chat");
    }
  }, [pathname, router]);

  const toggleChatSection = useCallback(() => {
    setChatExpanded(prev => !prev);
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
      VISIBLE_CHAT_GROUPS.forEach((key) => {
        if (!sectionMeta.has(key) && prev[key] === undefined) {
          next[key] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [chatExpanded, sectionMeta, toggleSectionCollapsed]);
  if (collapsed) {
    return <CollapsedSidebar pathname={pathname} onToggleCollapse={onToggleCollapse} />;
  }

  const handleNavigateDocs = useCallback(() => {
    if (!pathname?.startsWith("/docs")) {
      router.push("/docs");
    }
  }, [pathname, router]);

  const handleOpenWorkspaceSettings = useCallback(() => {
    setWorkspaceSettingsOpen(true);
  }, []);

  const handleWorkspaceSwitch = useCallback(
    async (id: string) => {
      if (id === workspaceId) {
        setServerMenuOpen(false);
        return;
      }
      await setWorkspace(id);
      setServerMenuOpen(false);
    },
    [setWorkspace, workspaceId],
  );

  const handleWorkspaceSettingsSave = useCallback(() => {
    if (!activeWorkspace || workspaceSettingsSaving) return;
    const nextName = workspaceSettingsName.trim() || activeWorkspace.name;
    const nextIcon = normalizeIconValue(workspaceSettingsIcon) || undefined;
    setWorkspaceSettingsSaving(true);
    try {
      updateWorkspace(activeWorkspace.id, {
        name: nextName,
        icon: nextIcon,
      });
      setWorkspaceSettingsOpen(false);
      setWorkspaceDeleteConfirm(false);
    } finally {
      setWorkspaceSettingsSaving(false);
    }
  }, [updateWorkspace, activeWorkspace, workspaceSettingsIcon, workspaceSettingsName, workspaceSettingsSaving]);

  const handleWorkspaceDelete = useCallback(async () => {
    if (!activeWorkspace || workspaceSettingsSaving || !workspaceDeleteConfirm) {
      setWorkspaceDeleteConfirm(true);
      return;
    }
    setWorkspaceSettingsSaving(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
      setWorkspaceSettingsOpen(false);
      setWorkspaceDeleteConfirm(false);
    } finally {
      setWorkspaceSettingsSaving(false);
    }
  }, [deleteWorkspace, activeWorkspace, workspaceDeleteConfirm, workspaceSettingsSaving]);

  return (
    <div className="flex min-h-0 w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Fourier logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md object-cover"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">FOURIER</span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Workspace</span>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-md p-2 text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-semibold shadow-sm",
              activeWorkspace?.image ? "text-transparent" : "text-white",
            )}
            style={activeWorkspaceBadgeStyle}
          >
            {!activeWorkspace?.image && activeWorkspaceBadgeLabel}
          </div>
          <div className="relative min-w-0" ref={serverSwitcherRef}>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.1em] text-muted">
              <span>Workspace</span>
              <button
                type="button"
                onClick={handleOpenWorkspaceSettings}
                className="rounded-md p-1 text-muted hover:text-foreground"
                aria-label="워크스페이스 설정"
              >
                <Settings size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setServerMenuOpen((prev) => !prev)}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-left text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <span className="truncate">{activeWorkspace?.name ?? "Server"}</span>
              <ChevronDown size={12} className={clsx("transition-transform", serverMenuOpen ? "rotate-180" : "")} />
            </button>
            {serverMenuOpen && (
              <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-sidebar-border bg-sidebar shadow-lg">
                <div className="max-h-60 overflow-auto py-1">
                  {workspaces.map((ws) => {
                    const badgeStyle = getWorkspaceBadgeStyle(ws);
                    const hasImage = !!ws.image;
                    const badgeLabel = ws.icon?.trim() ? ws.icon : getWorkspaceInitials(ws.name);
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => void handleWorkspaceSwitch(ws.id)}
                        className={clsx(
                          "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-sidebar-accent",
                          ws.id === workspaceId && "bg-sidebar-primary/10 text-sidebar-foreground font-semibold",
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={clsx(
                              "flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold",
                              hasImage ? "text-transparent" : "text-sidebar-foreground/80",
                            )}
                            style={badgeStyle}
                          >
                            {!hasImage && badgeLabel}
                          </span>
                          <span className="truncate">{ws.name}</span>
                        </span>
                        {ws.id === workspaceId && <Check size={14} className="text-sidebar-primary" />}
                      </button>
                    );
                  })}
                  {workspaces.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted">No servers yet.</div>
                  )}
                </div>
                <div className="border-t border-sidebar-border px-3 py-1 text-[11px] text-muted">
                  {workspaces.length} server{workspaces.length === 1 ? "" : "s"}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">
          <Link
            href="/setup/workspace"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-primary transition hover:border-sidebar-primary hover:bg-sidebar-primary/10"
          >
            <PlusCircle size={14} />
            New Workspace
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">Projects</div>
          <div className="space-y-2">
            <NavItem
              href="/dashboard"
              label="Dashboard"
              icon={PanelsTopLeft}
              active={pathname?.startsWith("/dashboard")}
            />
            <NavItem
              href="/calendar"
              label="Calendar"
              icon={CalendarDays}
              active={pathname?.startsWith("/calendar")}
            />
            <NavItem
              href="/issues"
              label="Issues"
              icon={FolderKanban}
              active={pathname?.startsWith("/issues")}
            />
            <NavItem
              href="/worksheet"
              label="Worksheet"
              icon={Table}
              active={pathname?.startsWith("/worksheet")}
            />
            <NavItem
              href="/members"
              label="Members"
              icon={Users}
              active={pathname?.startsWith("/members")}
            />
            <ExpandableNav
              icon={MessageSquare}
              label="Chat"
              open={chatExpanded}
              onNavigate={handleNavigateChat}
              onToggle={toggleChatSection}
              active={pathname?.startsWith("/chat")}
            >
              <div className="space-y-4 pl-1">
                {VISIBLE_CHAT_GROUPS.map((key, index) => {
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
            <button
              type="button"
              onClick={handleNavigateDocs}
              className={clsx(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                pathname?.startsWith("/docs")
                  ? "border-sidebar-primary/50 bg-sidebar-accent text-sidebar-foreground"
                  : "border-border/40 text-sidebar-foreground/80 hover:border-sidebar-primary/40 hover:bg-sidebar-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <BookText size={16} />
                Note
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border space-y-3">
        <a
          href="mailto:support@fourier.app"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
        >
          <LifeBuoy size={16} /> 고객센터
        </a>
        <p className="text-xs text-muted">⌘K Command Palette / v0.1</p>
      </div>

      <Dialog.Root open={workspaceSettingsOpen} onOpenChange={setWorkspaceSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-28 z-50 w-[360px] -translate-x-1/2 rounded-2xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
            <Dialog.Title className="text-base font-semibold">워크스페이스 설정</Dialog.Title>
            <p className="mt-1 text-sm text-muted">이름과 아이콘을 수정하거나 서버를 삭제할 수 있어요.</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-semibold text-white shadow-sm",
                    activeWorkspace?.image ? "text-transparent" : "text-white",
                  )}
                  style={activeWorkspaceBadgeStyle}
                >
                  {!activeWorkspace?.image && workspaceSettingsIconPreview}
                </div>
                <div className="text-xs text-muted">
                  현재 워크스페이스의 아이콘과 배경색입니다.
                </div>
              </div>
              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Workspace Name</span>
                <input
                  value={workspaceSettingsName}
                  onChange={(event) => setWorkspaceSettingsName(event.target.value)}
                  placeholder="워크스페이스 이름"
                  className="w-full rounded-md border border-border bg-subtle/60 px-3 py-2 text-sm text-foreground outline-none focus:border-sidebar-primary"
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Icon</span>
                <input
                  value={workspaceSettingsIcon}
                  onChange={(event) => setWorkspaceSettingsIcon(event.target.value)}
                  placeholder="이모지 또는 2글자"
                  maxLength={4}
                  className="w-full rounded-md border border-border bg-subtle/60 px-3 py-2 text-sm text-foreground outline-none focus:border-sidebar-primary"
                />
                <p className="text-[11px] text-muted">이모지나 2글자 이내 텍스트만 표시됩니다.</p>
              </label>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {!workspaceDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setWorkspaceDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:border-destructive"
                  >
                    <Trash2 size={14} />
                    워크스페이스 삭제
                  </button>
                ) : (
                  <div className="w-full rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-semibold">정말 삭제할까요?</p>
                    <p className="mt-1 text-xs">
                      채널과 메시지가 모두 제거됩니다. 다른 워크스페이스를 기본으로 지정한 뒤 삭제가 진행됩니다.
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:border-destructive"
                        onClick={() => setWorkspaceDeleteConfirm(false)}
                      >
                        삭제 취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleWorkspaceDelete()}
                        disabled={workspaceSettingsSaving}
                        className="inline-flex items-center gap-2 rounded-md border border-destructive bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
                      >
                        {workspaceSettingsSaving ? "삭제 중..." : "네, 삭제합니다"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 items-center justify-end gap-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-subtle/60"
                    >
                      취소
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={handleWorkspaceSettingsSave}
                    disabled={workspaceSettingsSaving}
                    className="inline-flex items-center gap-2 rounded-md border border-sidebar-primary bg-sidebar-primary/10 px-3 py-1.5 text-sm font-semibold text-sidebar-primary disabled:opacity-60"
                  >
                    {workspaceSettingsSaving ? "저장 중..." : "변경 사항 저장"}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

type CollapsedSidebarProps = {
  pathname: string | null;
  onToggleCollapse?: () => void;
};

function CollapsedSidebar({ pathname, onToggleCollapse }: CollapsedSidebarProps) {
  return (
    <div className="flex h-full flex-col items-center justify-between gap-4 border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Fourier logo"
          width={36}
          height={36}
          className="h-9 w-9 rounded-md object-cover"
          priority
        />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-full border border-border p-1 text-muted hover:text-sidebar-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-3">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={clsx(
                'flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground',
                active && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              )}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>

      <a
        href="mailto:support@fourier.app"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
        title="고객센터"
      >
        <LifeBuoy size={18} />
      </a>
    </div>
  );
}










