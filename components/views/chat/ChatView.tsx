// components/views/chat/ChatView.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@/store/chat";
import Composer from "@/components/chat/Composer";
import type { Attachment, Msg } from "@/store/chat";
import {
  FileText, File, Film, MessageSquare, Settings2, Pin, Bookmark, Eye, Users, PlusCircle,
  UserPlus2, Info, CheckSquare, Trash2, Laugh, Quote, Command, Pencil, Trash, Hash, ChevronDown
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import EmojiPicker from "@/components/chat/EmojiPicker";
import MessageContextMenu from "@/components/chat/MessageContextMenu";
import MarkdownText from "@/components/chat/MarkdownText";
import HuddleBar from "@/components/chat/HuddleBar";
import PinManager from "@/components/chat/PinManager";
import SavedModal from "@/components/chat/SavedModal";
import ReadBy from "@/components/chat/ReadBy";
import ReactionBar from "@/components/chat/ReactionBar";
import LinkPreview, { extractUrls } from "@/components/chat/LinkPreview";
import { CreateChannelModal, InviteModal } from "@/components/chat/ChannelModals";
import ChannelSettingsModal from "@/components/chat/ChannelSettingsModal";
import CodeFencePreview, { extractFences } from "@/components/chat/CodeFencePreview";
import CommandPalette from "@/components/chat/CommandPalette";
import LightboxHost, { openLightbox, LightboxItem } from "@/components/chat/Lightbox";
import LiveReadersBar, { broadcastReadCursor } from "@/components/chat/LiveReadersBar";
import { rtbroadcast, rtlisten } from "@/lib/realtime";

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const VIEWMODE_KEY = 'fd.chat.viewmode';
type ViewMode = 'compact' | 'cozy';

function sameGroup(a: Msg, b: Msg) {
  return a.authorId === b.authorId && Math.abs(a.ts - b.ts) <= GROUP_WINDOW_MS && !a.parentId && !b.parentId;
}

function DayDivider({ ts }: { ts:number }) {
  const d = new Date(ts);
  const label = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  return (
    <div className="relative my-4 text-center">
      <span className="px-3 py-0.5 text-xs bg-panel border border-border rounded-md shadow-panel">{label}</span>
    </div>
  );
}

function NewDivider() {
  return (
    <div className="relative my-4 flex items-center gap-2">
      <div className="flex-1 h-px bg-border" />
      <span className="px-2 py-0.5 text-xs border border-rose-400/40 bg-rose-400/10 rounded">NEW</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function AttachmentBubbleEnhanced({ a, all, index }: { a: Attachment; all: Attachment[]; index: number }) {
  const open = () => {
    const items: LightboxItem[] = all.map((x, i) => {
      const isImage = x.dataUrl ? x.type.startsWith('image/') : x.type.startsWith('image/');
      const isVideo = x.type.startsWith('video/');
      const kind: 'image' | 'video' = isVideo ? 'video' : 'image';
      const src = x.dataUrl || '';
      return { id: x.id, kind, src, name: x.name, mime: x.type };
    }).filter(it => !!it.src);
    const idx = Math.max(0, Math.min(items.length - 1, index));
    if (items.length > 0) openLightbox(items, idx);
  };

  if (a.dataUrl && a.type.startsWith("image/")) {
    return (
      <button onClick={open} className="block">
        <img src={a.dataUrl} alt={a.name} className="max-w-[320px] max-h-[320px] rounded border border-border hover:opacity-90" />
      </button>
    );
  }
  if (a.dataUrl && a.type.startsWith("video/")) {
    return (
      <button onClick={open} className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border border-border bg-subtle/40 hover:bg-subtle/60">
        <Film size={14}/> {a.name}
      </button>
    );
  }
  if (a.dataUrl && a.type === "application/pdf") {
    return (
      <a href={a.dataUrl} target="_blank" rel="noreferrer"
         className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border border-border bg-subtle/40">
        <FileText size={14}/> {a.name}
      </a>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border border-border bg-subtle/40">
      <File size={14}/> {a.name}
    </div>
  );
}

function ReactionPills({ m, onToggle }: { m: Msg; onToggle: (emoji:string)=>void }) {
  const entries = Object.entries(m.reactions || {});
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border border-border bg-subtle/40 hover:bg-subtle/60"
          onClick={()=> onToggle(emoji)}
          title={`${users.length}명`}
        >
          <span>{emoji}</span>
          {users.length > 0 && <span className="text-muted">{users.length}</span>}
        </button>
      ))}
    </div>
  );
}

function SeenBadge({ m, meId }: { m: Msg; meId: string }) {
  const seen = new Set(m.seenBy || []);
  if (seen.has(meId)) {
    return (
      <div className="mt-1 text-[11px] text-muted inline-flex items-center gap-1">
        <Eye size={12}/> Seen by You
      </div>
    );
  }
  return null;
}

function MessageRow({
  m, isMine, view, meId, otherSeenNames, onEdit, onDelete, onReact, onReply, openMenu, onQuoteInline,
  selectable, selected, onToggleSelect
}: {
  m: Msg;
  isMine: boolean;
  view: ViewMode;
  meId: string;
  otherSeenNames: string[];
  onEdit: (id:string, text:string)=>void;
  onDelete: (id:string)=>void;
  onReact: (id:string, emoji:string)=>void;
  onReply: (rootId:string)=>void;
  openMenu: (e: React.MouseEvent, m: Msg, isMine: boolean)=>void;
  onQuoteInline: (m: Msg)=>void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id:string, multi?:boolean)=>void;
}) {
  const pad = view === 'compact' ? 'py-0.5' : 'py-1.5';
  const urls = extractUrls(m.text);
  const fences = extractFences(m.text);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text || '');

  useEffect(() => setDraft(m.text || ''), [m.text]);

  return (
    <div
      className={`group/message relative ${pad} -mx-2 rounded-xl border border-transparent px-3 transition-all duration-150 ease-out ${
        selected
          ? 'border-brand/50 bg-brand/10 shadow-sm ring-1 ring-brand/40'
          : 'hover:border-border/60 hover:bg-subtle/20 hover:shadow-sm'
      }`}
      onContextMenu={(e)=> { e.preventDefault(); openMenu(e, m, isMine); }}
      onClick={(e)=> {
        if (selectable && (e.shiftKey || e.metaKey || e.ctrlKey)) onToggleSelect(m.id, true);
      }}
      data-mid={m.id}
    >
      {/* 선택 체크박스 */}
      {selectable && (
        <label className="absolute -left-7 top-2 opacity-100">
          <input type="checkbox" checked={selected} onChange={()=> onToggleSelect(m.id, false)} />
        </label>
      )}

      {/* 퀵 리액션 바 */}
      <div className="absolute -left-10 -top-2 translate-y-1 opacity-0 transition-all duration-200 ease-out group-hover/message:translate-y-0 group-hover/message:opacity-100">
        <ReactionBar onPick={(emo)=> onReact(m.id, emo)} />
      </div>

      {/* 본문 */}
      {!editing ? (
        <>
          <div className="text-sm whitespace-pre-wrap">
            <MarkdownText text={m.text} />
            {m.editedAt && <span className="ml-2 text-[11px] text-muted">(edited)</span>}
          </div>
          <CodeFencePreview fences={fences} />
          {urls.length > 0 && (
            <div className="mt-2 space-y-2">
              {urls.map(u => <LinkPreview key={u} url={u} />)}
            </div>
          )}
          {m.attachments?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {m.attachments.map((a, i) => (
                <AttachmentBubbleEnhanced key={a.id} a={a} all={m.attachments!} index={i} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-1">
          <textarea
            value={draft}
            onChange={e=> setDraft(e.target.value)}
            rows={Math.max(2, Math.min(8, draft.split('\n').length))}
            className="w-full rounded border border-border bg-subtle/40 px-3 py-2 text-sm outline-none"
          />
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={()=> { onEdit(m.id, draft.trim()); setEditing(false); }}>저장</button>
            <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={()=> { setDraft(m.text || ''); setEditing(false); }}>취소</button>
          </div>
        </div>
      )}

      <ReactionPills m={m} onToggle={(emo)=> onReact(m.id, emo)} />
      <SeenBadge m={m} meId={meId} />
      <ReadBy userNames={otherSeenNames} />

      {/* 행 툴: 내 메시지일 때만 편집/삭제 버튼 노출 */}
      <div className="mt-1 hidden group-hover/message:flex items-center gap-1">
        <button
          className="px-2 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60"
          onClick={()=> onQuoteInline(m)}
          title="인용 답글"
        >
          ↩︎ 인용
        </button>
        {!m.parentId && m.threadCount !== undefined && (
          <button
            className="px-2 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60"
            onClick={()=> onReply(m.id)}
          >
            <MessageSquare size={12}/> {m.threadCount}개의 답글 보기
          </button>
        )}
        <EmojiPicker onPick={(e)=> onReact(m.id, e)} />
        {isMine && (
          <>
            <button className="px-2 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60" onClick={()=> setEditing(true)}>
              <Pencil size={12}/> 편집
            </button>
            <button className="px-2 py-0.5 text-[11px] rounded border border-border hover:bg-subtle/60" onClick={()=> onDelete(m.id)}>
              <Trash size={12}/> 삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MessageGroup({
  items, isMine, view, meId, otherSeen, onEdit, onDelete, onReact, onReply, openMenu, onQuoteInline,
  selectable, selectedIds, onToggleSelect
}: {
  items: Msg[];
  isMine: boolean;
  view: ViewMode;
  meId: string;
  otherSeen: Record<string,string[]>;
  onEdit: (id:string, text:string)=>void;
  onDelete: (id:string)=>void;
  onReact: (id:string, emoji:string)=>void;
  onReply: (rootId:string)=>void;
  openMenu: (e: React.MouseEvent, m: Msg, isMine: boolean)=>void;
  onQuoteInline: (m: Msg)=>void;
  selectable: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id:string, multi?:boolean)=>void;
}) {
  const head = items[0];
  const headerPad = view === 'compact' ? 'pb-0.5' : 'pb-1.5';

  return (
    <div className="group rounded-lg px-2 py-2 transition-colors duration-200 ease-out hover:bg-subtle/25">
      <div className="flex gap-3">
        <div className="w-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle/80 text-xs">
            {head.author[0]}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`flex items-baseline gap-2 ${headerPad}`}>
            <span className="font-semibold text-sm">{head.author}</span>
            <span className="text-xs text-muted">{new Date(head.ts).toLocaleTimeString()}</span>

            <span className="ml-auto hidden gap-1 group-hover:flex">
              <button
                className="rounded p-1 transition-colors duration-150 ease-out hover:bg-subtle/60"
                onClick={() => onReply(head.id)}
                title="스레드로 답글"
              >
                <MessageSquare size={14} />
              </button>
              <EmojiPicker onPick={(e) => onReact(head.id, e)} />
            </span>
          </div>

          <div className="space-y-1">
            {items.map((m) => (
              <MessageRow
                key={m.id}
                m={m}
                isMine={m.authorId === meId}
                view={view}
                meId={meId}
                otherSeenNames={otherSeen[m.id] || []}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onReply={onReply}
                openMenu={openMenu}
                onQuoteInline={onQuoteInline}
                selectable={selectable}
                selected={selectedIds.has(m.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatView() {
  const {
    me, users, channelId, channels, messages, lastReadAt, typingUsers, pinnedByChannel, savedByUser, channelMembers,
    send, setChannel, loadChannels, initRealtime, updateMessage, deleteMessage, restoreMessage,
    toggleReaction, openThread, markChannelRead, setTyping,
    markUnreadAt, markSeenUpTo, togglePin, startHuddle, toggleSave,
    channelTopics, threadFor, closeThread, getThread
  } = useChat();
  const { show } = useToast();
  const listRef = useRef<HTMLDivElement>(null);

  const getStoredView = () => {
    if (typeof window === "undefined") return "cozy" as ViewMode;
    const stored = localStorage.getItem(VIEWMODE_KEY) as ViewMode | null;
    return stored === "compact" ? "compact" : "cozy";
  };
  const [view, setView] = useState<ViewMode>(() => getStoredView());
  const toggleView = () => {
    setView(prev => {
      const next: ViewMode = prev === "cozy" ? "compact" : "cozy";
      if (typeof window !== "undefined") {
        localStorage.setItem(VIEWMODE_KEY, next);
      }
      return next;
    });
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    setView(getStoredView());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 커맨드 팔레트 */
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** 멀티선택 상태 */
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string, multi?: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (!multi) setSelectMode(true);
  };
  const clearSelection = () => { setSelectMode(false); setSelectedIds(new Set()); };

  /** 키보드 내비게이션 */
  const [cursorId, setCursorId] = useState<string | null>(null);
  const indexById = useMemo(() => {
    const ids = messages.filter(m=>!m.parentId).map(m=>m.id);
    const map = new Map<string, number>();
    ids.forEach((id, i)=> map.set(id, i));
    return { ids, map };
  }, [messages]);

  const moveCursor = (dir: 1|-1) => {
    const ids = indexById.ids;
    if (ids.length === 0) return;
    if (!cursorId) {
      const anchor = dir === 1 ? ids[0] : ids[ids.length-1];
      setCursorId(anchor);
      scrollInto(anchor);
      return;
    }
    const idx = indexById.map.get(cursorId) ?? 0;
    const nextIdx = Math.max(0, Math.min(ids.length-1, idx + dir));
    const nextId = ids[nextIdx];
    setCursorId(nextId);
    scrollInto(nextId);
  };
  const scrollInto = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    (async () => {
      initRealtime();
      await loadChannels();
      await setChannel(channelId);
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    const last = messages[messages.length - 1];
    if (last) {
      markChannelRead();
      markSeenUpTo(last.ts);
      // 읽기 커서 브로드캐스트
      broadcastReadCursor(me.id, me.name, channelId, last.ts);
    }
  }, [messages.length]);

  // 스크롤 중에도 주기적으로 읽기 커서 브로드캐스트
  useEffect(() => {
    const onScroll = () => {
      const last = messages[messages.length - 1];
      if (last) {
        broadcastReadCursor(me.id, me.name, channelId, last.ts);
      }
    };
    const el = listRef.current;
    el?.addEventListener('scroll', onScroll);
    const int = setInterval(onScroll, 5000);
    return () => {
      el?.removeEventListener('scroll', onScroll);
      clearInterval(int);
    };
  }, [messages, channelId, me.id, me.name]);

  // 멘션 알림
  const lastCount = useRef(0);
  useEffect(() => {
    if (messages.length > lastCount.current) {
      const added = messages.slice(lastCount.current);
      for (const m of added) {
        const iWasMentioned =
          (m.mentions || []).some(x => x === `name:${me.name}`) ||
          (m.text || "").includes(`@${me.name}`);
        if (m.authorId !== me.id && iWasMentioned) {
          show({ variant:'success', title:'언급됨', description:`${m.author}: "${m.text?.slice(0, 80) || ""}"` });
        }
      }
      lastCount.current = messages.length;
    }
  }, [messages.length, messages, me.id, me.name, show]);

  // 그룹핑
  const groups = useMemo(() => {
    const roots = messages.filter(m => !m.parentId);
    const g: Msg[][] = [];
    for (let i=0;i<roots.length;i++){
      const cur = roots[i];
      if (i>0 && sameGroup(cur, roots[i-1])) g[g.length-1].push(cur);
      else g.push([cur]);
    }
    return g;
  }, [messages]);

  const otherSeen = useMemo(() => {
    const map: Record<string,string[]> = {};
    for (const m of messages) {
      const names = (m.seenBy || [])
        .filter(uid => uid !== me.id)
        .map(uid => users[uid]?.name || uid);
      map[m.id] = names;
    }
    return map;
  }, [messages, me.id, users]);

  const onDelete = (id: string) => {
    const msg = messages.find(m => m.id === id);
    // 방어: 내 메시지가 아니면 삭제 불가
    if (msg && msg.authorId !== me.id) {
      show({ variant: 'error', title: '삭제 불가', description: '자신이 작성한 메시지만 삭제할 수 있습니다.' });
      return;
    }
    const { deleted } = deleteMessage(id);
    if (!deleted) return;
    show({
      title: "메시지를 삭제했습니다",
      description: "되돌리려면 Undo를 누르세요.",
      actionLabel: "Undo",
      onAction: () => restoreMessage(deleted),
    });
  };

  // 컨텍스트 메뉴
  const [menu, setMenu] = useState<{ open:boolean; x:number; y:number; msg?: Msg; mine?: boolean }>({ open:false, x:0, y:0 });
  const openMenu = (e: React.MouseEvent, m: Msg, mine: boolean) => {
    setMenu({ open:true, x: e.clientX, y: e.clientY, msg: m, mine });
  };
  const closeMenu = () => setMenu({ open:false, x:0, y:0 });
  const typingList = typingUsers[channelId] || [];
  const typingText = typingList.length ? `${typingList.join(", ")} is typing...` : "";

  const onMenuAction = async (id: any) => {
    const m = menu.msg!;
    const isMine = m.authorId === me.id;

    switch (id) {
      case 'reply':
      case 'open-thread':
        openThread(m.parentId ? (m.parentId as string) : m.id);
        window.dispatchEvent(new Event('chat:open-right'));
        break;
      case 'react':
        toggleReaction(m.id, "👍");
        break;
      case 'copy':
        await navigator.clipboard.writeText(m.text || "");
        show({ title: "복사됨", description: "메시지 텍스트를 복사했어요." });
        break;
      case 'quote': {
        const ev = new CustomEvent('chat:insert-quote', { detail: { text: m.text || "" } });
        window.dispatchEvent(ev);
        show({ title: "인용 삽입", description: "입력창에 인용이 추가되었습니다." });
        break;
      }
      case 'link': {
        const url = `${location.origin}/app/chat#${m.id}`;
        await navigator.clipboard.writeText(url);
        show({ title: "링크 복사됨", description: url });
        break;
      }
      case 'pin':
        togglePin(m.id);
        show({ title: "핀 고정", description: "이 메시지를 채널 상단에 고정했습니다." });
        break;
      case 'unpin':
        togglePin(m.id);
        show({ title: "핀 해제", description: "고정된 메시지를 해제했습니다." });
        break;
      case 'unread':
        markUnreadAt(m.ts, m.channelId);
        setTimeout(() => scrollInto(m.id), 50);
        break;
      case 'save':
        toggleSave(m.id);
        show({ title: "저장됨", description: "Saved messages에 추가했습니다." });
        break;
      case 'unsave':
        toggleSave(m.id);
        show({ title: "해제됨", description: "Saved messages에서 제거했습니다." });
        break;
      case 'edit':
        if (!isMine) {
          show({ variant: 'error', title: '편집 불가', description: '자신의 메시지만 편집할 수 있습니다.' });
          break;
        }
        // 힌트만: 실제 편집은 메시지 hover 툴에서 가능
        show({ title: "편집 모드", description: "메시지 줄의 연필 아이콘을 누르세요." });
        break;
      case 'delete':
        if (!isMine) {
          show({ variant: 'error', title: '삭제 불가', description: '자신의 메시지만 삭제할 수 있습니다.' });
          break;
        }
        onDelete(m.id);
        break;
      case 'huddle':
        startHuddle(m.channelId);
        show({ title: "Huddle 시작", description: `#${m.channelId} 에서 음성 허들을 시작했습니다 (MVP).` });
        break;
    }
    closeMenu();
  };

  // 채널/DM 스위처 데이터

  const onTyping = (typing: boolean) => {
    setTyping(typing);
    rtbroadcast({ type: 'typing', channelId, userId: me.id, userName: me.name, on: typing });
  };
  const [pinOpen, setPinOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // 모달: 채널 생성/초대/설정
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onOpenCreate = () => setCreateOpen(true);
    window.addEventListener('chat:open-create-channel', onOpenCreate);
    return () => window.removeEventListener('chat:open-create-channel', onOpenCreate);
  }, []);

  const currentChannel = useMemo(() => channels.find(c => c.id === channelId), [channels, channelId]);
  const isDM = channelId.startsWith("dm:");
  const dmUser = isDM ? users[channelId.slice(3)] : undefined;
  const channelLabel = isDM
    ? `@ ${dmUser?.name ?? (channelId.slice(3) || "Direct Message")}`
    : (currentChannel?.name ?? channelId ?? "Channel");
  const memberIds = isDM
    ? Array.from(new Set([me.id, dmUser?.id].filter(Boolean) as string[]))
    : channelMembers[channelId] || [];
  const memberCount = memberIds.length;
  const topic = channelTopics[channelId]?.topic || "";
  const dmOptions = useMemo(() => Object.values(users).filter(u => u.id !== me.id), [users, me.id]);
  const channelDisplayName = isDM ? channelLabel : channelLabel.replace(/^#\s*/, "#");
  const headerPad = view === 'compact' ? 'py-3' : 'py-4';
  const headerButtonClass =
    "inline-flex items-center gap-1 rounded-md border border-border/60 bg-subtle/30 px-2 py-1 text-xs font-medium transition-colors duration-150 ease-out hover:border-border hover:bg-subtle/50";
  const ghostActionClass =
    "inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:text-text";
  const quoteInline = (m: Msg) => {
    const ev = new CustomEvent('chat:insert-quote', { detail: { text: `${m.author} — ${new Date(m.ts).toLocaleString()}\n${m.text || ""}` } });
    window.dispatchEvent(ev);
  };

  /** 일괄 작업 */
  const batchPin = () => { selectedIds.forEach(id => togglePin(id)); clearSelection(); };
  const batchSave = () => { selectedIds.forEach(id => toggleSave(id)); clearSelection(); };
  const batchDelete = () => {
    for (const id of selectedIds) {
      const msg = messages.find(m => m.id === id);
      if (!msg || msg.authorId !== me.id) continue; // 내 메시지만 삭제
      onDelete(id);
    }
    clearSelection();
  };
  const batchReact = (emoji: string) => { selectedIds.forEach(id => toggleReaction(id, emoji)); clearSelection(); };

  /** 브로드캐스트 수신 (타이핑 등) */
  useEffect(() => {
    const un = rtlisten((ev) => {
      if (ev.type === 'typing' && ev.channelId === channelId && ev.userId !== me.id) {
        // store의 typingUsers가 이미 있다면 거기로 반영되어 있을 것이고,
        // 없더라도 UI에 영향은 미미 (현재는 store 우선)
      }
    });
    return () => un();
  }, [channelId, me.id]);

  /** 스레드 티저 */
  const threadTeaser = useMemo(() => {
    if (!threadFor?.rootId) return null;
    const { root, replies } = getThread(threadFor.rootId) || {};
    if (!root) return null;
    const excerpt = (root.text || '').replace(/\s+/g,' ').slice(0, 120);
    return { root, repliesCount: replies.length, excerpt };
  }, [threadFor, messages]);

  return (
    <div className="h-full grid grid-rows-[auto_auto_auto_auto_1fr_auto]">
      <HuddleBar channelId={channelId} />

      {/* 실시간 읽는중 바 (다른 탭/브라우저와 브로드캐스트) */}
      <LiveReadersBar meId={me.id} meName={me.name} channelId={channelId} />

      {/* 헤더 */}
      <div className={`px-4 border-b border-border ${headerPad}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-lg font-semibold leading-none">
                {isDM ? (
                  <MessageSquare size={18} className="text-muted" />
                ) : (
                  <Hash size={18} className="text-muted" />
                )}
                <span className="truncate max-w-[240px] sm:max-w-[320px] md:max-w-[380px]">{channelDisplayName}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Users size={14} className="opacity-70" />
                {memberCount > 0 ? `${memberCount}명` : "멤버 없음"}
              </span>
              {!isDM && (
                <button
                  className={`${headerButtonClass} hidden sm:inline-flex`}
                  onClick={() => setInviteOpen(true)}
                  title="채널 멤버 초대"
                >
                  <UserPlus2 size={14} /> Invite
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              {!isDM && topic && (
                <span className="inline-flex items-center gap-1 truncate max-w-[320px] md:max-w-[420px]">
                  <Info size={13} className="opacity-70" />
                  {topic}
                </span>
              )}
              {!isDM && (
                <button
                  className={ghostActionClass}
                  onClick={() => setSettingsOpen(true)}
                >
                  {topic ? "주제 편집" : "주제 추가"}
                </button>
              )}
              <button
                className={ghostActionClass}
                onClick={() => setCmdOpen(true)}
              >
                <Command size={12} /> Quick Switch
              </button>
              {!isDM && (
                <button
                  className={ghostActionClass}
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusCircle size={12} /> 새 채널
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:justify-end">
            <div className="relative inline-flex items-center">
              <select
                className="appearance-none bg-subtle/30 border border-border/60 px-3 py-1 pr-8 rounded-md transition-colors duration-150 ease-out hover:border-border focus:border-brand focus:outline-none"
                onChange={e => {
                  const uid = e.target.value;
                  if (!uid) return;
                  setChannel(`dm:${uid}`);
                  e.currentTarget.value = "";
                }}
                defaultValue=""
                title="DM 시작"
              >
                <option value="" disabled>DM 시작…</option>
                {dmOptions.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 text-muted" />
            </div>
            <button
              className={headerButtonClass}
              onClick={() => setPinOpen(true)}
              title="핀 된 메시지"
            >
              <Pin size={14} />
              Pins
              {(pinnedByChannel[channelId]?.length || 0) > 0 && (
                <span className="ml-1 text-[10px] opacity-70">{pinnedByChannel[channelId]?.length}</span>
              )}
            </button>
            <button
              className={headerButtonClass}
              onClick={() => setSavedOpen(true)}
              title="저장한 메시지"
            >
              <Bookmark size={14} />
              Saved
              {(savedByUser[me.id]?.length || 0) > 0 && (
                <span className="ml-1 text-[10px] opacity-70">{savedByUser[me.id]?.length}</span>
              )}
            </button>
            <button
              className={headerButtonClass}
              onClick={toggleView}
              title="뷰 모드 전환"
            >
              <Settings2 size={14} />
              {view === "cozy" ? "Cozy" : "Compact"}
            </button>
          </div>
        </div>
      </div>

      {/* 스레드 티저 바 */}
      {(() => {
        const teaser = threadFor?.rootId
          ? (() => {
              const { root, replies } = getThread(threadFor.rootId) || {};
              if (!root) return null;
              const excerpt = (root.text || '').replace(/\s+/g,' ').slice(0, 120);
              return { root, repliesCount: replies.length, excerpt };
            })()
          : null;
        return teaser ? (
          <div className="px-4 py-2 border-b border-border bg-subtle/20 flex items-center gap-2 text-xs">
            <Quote size={14} className="opacity-70" />
            <div className="truncate">
              <span className="font-semibold">{teaser.root.author}</span> — {teaser.excerpt}
              <span className="ml-2 opacity-70">({teaser.repliesCount} replies)</span>
            </div>
            <button className="ml-auto px-2 py-0.5 rounded border border-border hover:bg-subtle/60"
                    onClick={()=> { closeThread(); }}>
              닫기
            </button>
            <button className="ml-2 px-2 py-0.5 rounded border border-border hover:bg-subtle/60"
                    onClick={()=> window.dispatchEvent(new Event('chat:open-right'))}>
              스레드 보기
            </button>
          </div>
        ) : null;
      })()}

      {/* 멀티선택 바 */}
      {selectMode && (
        <div className="px-4 py-2 border-b border-border bg-subtle/30 flex items-center gap-2 text-xs">
          <CheckSquare size={14} />
          <span>{selectedIds.size} selected</span>
          <div className="ml-2 flex items-center gap-1">
            <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={batchPin}><Pin size={12}/> Pin</button>
            <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={batchSave}><Bookmark size={12}/> Save</button>
            <button className="px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={batchDelete}><Trash2 size={12}/> Delete</button>
            <EmojiPicker
              onPick={(e)=> batchReact(e)}
              anchorClass="px-2 py-0.5 rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1 text-xs"
              triggerContent={<><Laugh size={12}/> React</>}
            />
          </div>
          <button className="ml-auto px-2 py-0.5 rounded border border-border hover:bg-subtle/60" onClick={clearSelection}>취소</button>
        </div>
      )}

      {/* 메시지 리스트 */}
      <div
        ref={listRef}
        className={`scroll-smooth overflow-y-auto p-4 space-y-3 md:space-y-4 scrollbar-thin ${view === 'compact' ? 'text-[13px]' : 'text-[14px]'}`}
        onClick={(e)=> {
          if ((e.target as HTMLElement).closest('[data-mid]')) return;
          if (selectMode) clearSelection();
        }}
      >
        {(() => {
          const lr = lastReadAt[channelId] || 0;
          const newIdx = messages.findIndex(m => m.ts > lr);

          const roots = messages.filter(m => !m.parentId);
          const groups: Msg[][] = [];
          for (let i=0;i<roots.length;i++){
            const cur = roots[i];
            if (i>0 && sameGroup(cur, roots[i-1])) groups[groups.length-1].push(cur);
            else groups.push([cur]);
          }

          return groups.map((items) => {
            const head = items[0];
            const idx = messages.findIndex(m => m.id === head.id);
            const dayBreak = (() => {
              const dIdx = messages.findIndex(m => m.id === head.id);
              if (dIdx < 0) return false;
              const prev = messages[dIdx - 1];
              if (!prev) return true;
              const d1 = new Date(prev.ts), d2 = new Date(head.ts);
              return d1.getFullYear() !== d2.getFullYear() || d1.getMonth() !== d2.getMonth() || d1.getDate() !== d2.getDate();
            })();
            const showNew = newIdx >= 0 && idx === newIdx;

            const isCursor = cursorId === head.id;

            return (
              <div key={head.id} id={head.id} className={isCursor ? 'ring-1 ring-brand/60 rounded-md' : ''}>
                {dayBreak && <DayDivider ts={head.ts} />}
                {showNew && <NewDivider />}

                <MessageGroup
                  items={items}
                  isMine={head.authorId === me.id}
                  view={view}
                  meId={me.id}
                  otherSeen={otherSeen}
                  onEdit={(id, text)=> {
                    const msg = messages.find(m => m.id === id);
                    if (msg && msg.authorId !== me.id) {
                      show({ variant:'error', title:'편집 불가', description:'자신의 메시지만 편집할 수 있습니다.' });
                      return;
                    }
                    updateMessage(id, { text });
                  }}
                  onDelete={onDelete}
                  onReact={(id, e)=> toggleReaction(id, e)}
                  onReply={(rootId)=> { openThread(rootId); window.dispatchEvent(new Event('chat:open-right')); }}
                  openMenu={openMenu}
                  onQuoteInline={(m)=> {
                    const ev = new CustomEvent('chat:insert-quote', { detail: { text: `${m.author} — ${new Date(m.ts).toLocaleString()}\n${m.text || ""}` } });
                    window.dispatchEvent(ev);
                  }}
                  selectable={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              </div>
            );
          });
        })()}
      </div>

      {typingText && (
        <div className="px-4 py-1 text-xs text-muted border-t border-border">{typingText}</div>
      )}

      <div
        onFocus={()=> onTyping(true)}
        onBlur={()=> onTyping(false)}
        onKeyDown={()=> onTyping(true)}
        onKeyUp={()=> onTyping(true)}
      >
        <Composer onSend={(text, files, extra)=> send(text, files, extra)} />
      </div>

      <MessageContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        canEdit={!!(menu.msg && menu.msg.authorId === me.id)}
        pinned={menu.msg ? ((pinnedByChannel[channelId] || []).includes(menu.msg.id)) : false}
        saved={menu.msg ? ((savedByUser[me.id] || []).includes(menu.msg.id)) : false}
        onAction={onMenuAction}
        onClose={closeMenu}
      />

      <PinManager open={pinOpen} onOpenChange={setPinOpen} />
      <SavedModal open={savedOpen} onOpenChange={setSavedOpen} />

      {/* 모달 */}
      <CreateChannelModal open={createOpen} onOpenChange={setCreateOpen} />
      {!channelId.startsWith("dm:") && (
        <>
          <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} channelId={channelId} />
          <ChannelSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} channelId={channelId} />
        </>
      )}

      {/* 커맨드 팔레트 & 라이트박스 호스트 */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <LightboxHost />
    </div>
  );
}
