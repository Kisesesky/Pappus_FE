'use client';

import Link from "next/link";
import { useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import {
  MessageSquare,
  FolderKanban,
  BookText,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Hash,
  Star,
  VolumeX,
  PlusCircle
} from "lucide-react";
import clsx from "clsx";
import { useChat } from "@/store/chat";

const NavItem = ({ href, label, icon: Icon }: any) => (
  <Link href={href} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-subtle/60 text-sm">
    <Icon size={16} />
    <span>{label}</span>
  </Link>
);

type SectionHeaderProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  action?: ReactNode;
};

function SectionHeader({ title, collapsed, onToggle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wide">
      <button
        type="button"
        className="flex items-center gap-2 hover:text-foreground transition"
        onClick={onToggle}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
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
  preview?: string;
  lastAuthor?: string;
  isStarred: boolean;
  isTyping: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
};

function ChannelRow({
  id,
  label,
  isDM,
  isActive,
  isMuted,
  unread,
  mentions,
  preview,
  lastAuthor,
  isStarred,
  isTyping,
  onSelect,
  onToggleStar,
}: ChannelRowProps) {
  const badgeCount = mentions > 0 ? mentions : unread;
  const badgeText = badgeCount > 99 ? "99+" : badgeCount > 0 ? String(badgeCount) : "";
  const previewLine = preview ? `${lastAuthor ? `${lastAuthor}: ` : ""}${preview}` : "";
  const previewText = previewLine.length > 60 ? `${previewLine.slice(0, 60)}…` : previewLine;
  const initials = isDM
    ? label.replace(/^@/, "").trim().split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "";
  const presenceDotClass = isTyping ? "bg-emerald-500" : "bg-zinc-400";

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={clsx(
        "w-full flex items-center gap-3 rounded-md px-3 py-2.5 transition border focus:outline-none focus:ring-1 focus:ring-brand/60",
        isActive ? "bg-subtle/80 border-border" : "border-transparent hover:bg-subtle/60",
        mentions > 0 && !isActive ? "border-rose-400/40" : null
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isDM ? (
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold uppercase text-muted">
              {initials || "DM"}
              <span className={clsx("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-border", presenceDotClass)} />
            </span>
          ) : (
            <Hash size={14} className="text-muted opacity-80" />
          )}
          <span className={clsx("truncate", isActive ? "font-semibold" : "text-sm")}>{label}</span>
          {isMuted && <VolumeX size={12} className="text-muted opacity-70" />}
          {isTyping && <span className="text-[11px] text-emerald-500">typing…</span>}
        </div>
        {previewText && (
          <div className="mt-1 truncate text-xs text-muted opacity-80">
            {previewText}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {badgeText && (
          <span
            className={clsx(
              "min-w-[24px] rounded-full px-2 py-0.5 text-xs font-semibold text-white text-center",
              mentions > 0 ? "bg-rose-500" : "bg-brand/80"
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
          className="rounded p-1 text-muted opacity-60 hover:bg-subtle/60 hover:text-amber-400"
          aria-label="Toggle favorite"
        >
          <Star
            size={14}
            className={clsx(isStarred ? "text-amber-400 fill-amber-400" : "text-muted opacity-40")}
          />
        </button>
      </div>
    </button>
  );
}

export default function Sidebar() {
  const {
    channels,
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

  useEffect(() => {
    if (workspaces.length === 0) {
      void loadChannels();
    }
  }, [workspaces.length, loadChannels]);

  const workspace = useMemo(() => {
    return workspaces.find(ws => ws.id === workspaceId) || workspaces[0];
  }, [workspaces, workspaceId]);

  const channelMap = useMemo(() => {
    const map = new Map<string, typeof channels[number]>();
    channels.forEach(c => map.set(c.id, c));
    return map;
  }, [channels]);

  const starredSet = useMemo(() => {
    const starredSection = workspace?.sections?.find(sec => sec.type === "starred");
    return new Set(starredSection?.itemIds ?? []);
  }, [workspace]);

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
  }, [setChannel]);

  const handleToggleSection = useCallback((sectionId: string) => {
    toggleSectionCollapsed(sectionId);
  }, [toggleSectionCollapsed]);

  const handleToggleStar = useCallback((id: string) => {
    toggleStar(id);
  }, [toggleStar]);

  const handleOpenCreateChannel = useCallback(() => {
    window.dispatchEvent(new Event("chat:open-create-channel"));
  }, []);

  return (
    <aside className="h-full flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <div className="text-xs uppercase text-muted tracking-wider">Workspace</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-semibold truncate">{workspace?.name ?? "Workspace"}</span>
          {workspaces.length > 1 && (
            <select
              value={workspaceId}
              onChange={(e) => void setWorkspace(e.target.value)}
              className="ml-auto rounded-md border border-border bg-panel px-2 py-1 text-xs"
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

      <div className="p-3 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
        <div>
          <div className="text-xs text-muted mb-2">Projects</div>
          <div className="space-y-1">
            <NavItem href="/app/chat" label="Chat" icon={MessageSquare} />
            <NavItem href="/app/issues" label="Issues" icon={FolderKanban} />
            <NavItem href="/app/docs" label="Docs" icon={BookText} />
            <NavItem href="/app/calendar" label="Calendar" icon={CalendarDays} />
          </div>
        </div>

        {(workspace?.sections ?? []).map((section, index) => {
          const isCollapsed = !!section.collapsed;
          const sectionAction = section.type === "channels"
            ? (
              <button
                type="button"
                onClick={handleOpenCreateChannel}
                className="rounded p-1 text-muted opacity-70 hover:bg-subtle/60 hover:text-foreground"
                aria-label="Create channel"
              >
                <PlusCircle size={14} />
              </button>
            )
            : undefined;

          const items = section.itemIds
            .map((id) => {
              const label = renderItemLabel(id);
              if (!label) return null;
              const channel = channelMap.get(id);
              const activity = channelActivity[id];
              return {
                id,
                label,
                isDM: channel?.isDM || id.startsWith("dm:"),
                isActive: channelId === id,
                isMuted: !!channelTopics[id]?.muted,
                unread: activity?.unreadCount ?? 0,
                mentions: activity?.mentionCount ?? 0,
                preview: activity?.lastPreview,
                lastAuthor: activity?.lastAuthor,
                isStarred: starredSet.has(id),
                isTyping: (typingUsers[id] || []).length > 0,
              } as ChannelRowProps;
            })
            .filter(Boolean) as ChannelRowProps[];

          return (
            <div key={section.id} className={index === 0 ? "" : "border-t border-border pt-3"}>
              <SectionHeader
                title={section.title}
                collapsed={isCollapsed}
                onToggle={() => handleToggleSection(section.id)}
                action={sectionAction}
              />
              {!isCollapsed && (
                <div className="mt-2 space-y-1">
                  {items.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted opacity-70">No items yet.</div>
                  )}
                  {items.map((item) => (
                    <ChannelRow
                      key={item.id}
                      {...item}
                      onSelect={handleSelectChannel}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border text-xs text-muted">
        ⌘K Command Palette / v0.1
      </div>
    </aside>
  );
}
