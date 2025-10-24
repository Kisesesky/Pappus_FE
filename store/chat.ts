// store/chat.ts
import { create } from "zustand";
import { lsGet, lsSet } from "@/lib/persist";

/** ---------------- Types ---------------- */
export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

export type ReactionMap = Record<string, string[]>;

export type Msg = {
  id: string;
  author: string;
  authorId: string;
  text: string;
  ts: number;
  editedAt?: number;
  channelId: string;
  attachments?: Attachment[];
  parentId?: string | null;
  threadCount?: number;
  reactions?: ReactionMap;
  mentions?: string[];
  seenBy?: string[];
};

export type Channel = {
  id: string;
  name: string;
  workspaceId: string;
  isDM?: boolean;
};

export type WorkspaceSectionType = "starred" | "channels" | "dms" | "custom";

export type WorkspaceSection = {
  id: string;
  title: string;
  type: WorkspaceSectionType;
  itemIds: string[];
  collapsed?: boolean;
  icon?: string;
};

export type Workspace = {
  id: string;
  name: string;
  icon?: string;
  sections: WorkspaceSection[];
};

export type FileItem = { id: string; name: string; size: number; type: string; blob: File; previewUrl?: string };

export type ChannelActivity = {
  lastMessageTs: number;
  lastAuthor?: string;
  lastPreview?: string;
  unreadCount: number;
  mentionCount: number;
};

export type PresenceState = "online" | "away" | "busy" | "offline";

type HuddleState = {
  active: boolean;
  startedAt?: number;
  muted?: boolean;
  members?: string[];
};

type User = { id: string; name: string };

type State = {
  me: User;
  users: Record<string, User>;
  userStatus: Record<string, PresenceState>;

  workspaceId: string;
  workspaces: Workspace[];
  allChannels: Channel[];

  channelId: string;
  channels: Channel[];
  /** 채널 멤버십 (DM은 생략) */
  channelMembers: Record<string, string[]>;

  /** 채널 토픽/설정 */
  channelTopics: Record<string, { topic: string; muted?: boolean }>;

  messages: Msg[];
  threadFor?: { rootId: string } | null;

  lastReadAt: Record<string, number>;
  channelActivity: Record<string, ChannelActivity>;
  typingUsers: Record<string, string[]>;
  pinnedByChannel: Record<string, string[]>;
  huddles: Record<string, HuddleState>;
  savedByUser: Record<string, string[]>;

  loadChannels: () => Promise<void>;
  setWorkspace: (id: string) => Promise<void>;
  setChannel: (id: string) => Promise<void>;
  toggleSectionCollapsed: (sectionId: string, value?: boolean) => void;
  toggleStar: (channelId: string) => void;

  send: (text: string, files?: FileItem[], opts?: { parentId?: string | null; mentions?: string[] }) => Promise<void>;
  updateMessage: (id: string, patch: Partial<Pick<Msg, "text">>) => void;
  deleteMessage: (id: string) => { deleted?: Msg };
  restoreMessage: (msg: Msg) => void;

  toggleReaction: (id: string, emoji: string) => void;
  openThread: (rootId: string) => void;
  closeThread: () => void;

  setTyping: (typing: boolean) => void;
  markChannelRead: (id?: string) => void;
  markUnreadAt: (ts: number, channelId?: string) => void;
  markSeenUpTo: (ts: number, channelId?: string) => void;

  togglePin: (msgId: string) => void;
  startHuddle: (channelId?: string) => void;
  stopHuddle: (channelId?: string) => void;
  toggleHuddleMute: (channelId?: string) => void;
  toggleSave: (msgId: string) => void;
  setUserStatus: (userId: string, status: PresenceState) => void;
  addUser: (name: string, status?: PresenceState) => string;

  /** 검색 */
  getThread: (rootId: string) => { root?: Msg; replies: Msg[] };
  search: (q: string, opts?: { kind?: "all"|"messages"|"files"|"links" }) => Msg[];

  /** 채널 관리 */
  createChannel: (name: string, memberIds: string[]) => string; // returns channelId
  startGroupDM: (memberIds: string[], opts?: { name?: string }) => string | null;
  inviteToChannel: (channelId: string, memberIds: string[]) => void;

  /** 채널 토픽/설정 */
  setChannelTopic: (channelId: string, topic: string) => void;
  setChannelMuted: (channelId: string, muted: boolean) => void;

  updateChannelActivity: (channelId: string, messages?: Msg[]) => void;
  initRealtime: () => void;
};

/** ---------------- Local Keys ---------------- */
const CHANNELS_KEY = "fd.chat.channels";
const WORKSPACES_KEY = "fd.chat.workspaces";
const ACTIVE_WORKSPACE_KEY = "fd.chat.workspace:active";
const MEMBERS_KEY = "fd.chat.members";
const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;
const PINS_KEY = "fd.chat.pins";
const SAVED_KEY = (uid: string) => `fd.chat.saved:${uid}`;
const TOPICS_KEY = "fd.chat.topics";
const STATUS_KEY = "fd.chat.status";
const LAST_READ_KEY = "fd.chat.lastRead";
const ACTIVITY_KEY = "fd.chat.activity";

const DEFAULT_WORKSPACE_ID = "ws-default";
const DEFAULT_WORKSPACE_NAME = "Acme";
const DEFAULT_STARRED_SECTION_ID = "sec-starred";
const DEFAULT_CHANNEL_SECTION_ID = "sec-channels";
const DEFAULT_DM_SECTION_ID = "sec-dms";
let bc: BroadcastChannel | null = null;

/** ---------------- Seed ---------------- */
function ensureSeed() {
  let channels = lsGet<Channel[]>(CHANNELS_KEY, []);
  let workspaces = lsGet<Workspace[]>(WORKSPACES_KEY, []);
  const members = lsGet<Record<string,string[]>>(MEMBERS_KEY, {});
  const topics = lsGet<Record<string,{topic:string; muted?:boolean}>>(TOPICS_KEY, {});
  const status = lsGet<Record<string,PresenceState>>(STATUS_KEY, {});

  if (channels.length === 0) {
    channels = [
      { id: "general", name: "# general", workspaceId: DEFAULT_WORKSPACE_ID },
      { id: "random",  name: "# random",  workspaceId: DEFAULT_WORKSPACE_ID },
    ];
    lsSet(CHANNELS_KEY, channels);

    const now = Date.now();
    lsSet(MSGS_KEY("general"), [
      { id: "1", channelId: "general", author: "Alice", authorId: "u-alice", text: "Welcome to #general!", ts: now,   seenBy: ["u-alice"] },
      { id: "2", channelId: "general", author: "Bob",   authorId: "u-bob",   text: "프론트만으로 로컬 퍼시스트 👍 https://flowdash.dev/demo", ts: now + 5000, seenBy: ["u-bob"] },
      { id: "3", channelId: "general", author: "Alice", authorId: "u-alice", text: "```ts\nexport const add = (a:number,b:number)=>a+b\n```", ts: now + 9000, seenBy: ["u-alice"] },
    ]);
    lsSet(MSGS_KEY("random"), []);
    lsSet(PINS_KEY, {} as Record<string, string[]>);
    lsSet(MEMBERS_KEY, { general: ["u-you","u-alice","u-bob"], random: ["u-you","u-alice","u-bob"] });
    lsSet(TOPICS_KEY, { general: { topic: "팀 공지 & 전체 토론" }, random: { topic: "잡담/밈/휴식" } });
  } else if (channels.some(c => !c.workspaceId)) {
    const fallbackWorkspace = workspaces[0]?.id || DEFAULT_WORKSPACE_ID;
    channels = channels.map(c => ({
      ...c,
      workspaceId: c.workspaceId || fallbackWorkspace
    }));
    lsSet(CHANNELS_KEY, channels);
  }

  if (workspaces.length === 0) {
    const sectionChannels = channels
      .filter(c => !c.isDM && c.workspaceId === DEFAULT_WORKSPACE_ID)
      .map(c => c.id);
    workspaces = [{
      id: DEFAULT_WORKSPACE_ID,
      name: DEFAULT_WORKSPACE_NAME,
      sections: [
        { id: DEFAULT_STARRED_SECTION_ID, title: "Starred", type: "starred", itemIds: [], collapsed: false },
        { id: DEFAULT_CHANNEL_SECTION_ID, title: "Channels", type: "channels", itemIds: sectionChannels, collapsed: false },
        { id: DEFAULT_DM_SECTION_ID, title: "Direct Messages", type: "dms", itemIds: [], collapsed: false },
      ]
    }];
  } else {
    const byWorkspace = new Map<string, Channel[]>();
    for (const ch of channels) {
      if (!byWorkspace.has(ch.workspaceId)) byWorkspace.set(ch.workspaceId, []);
      byWorkspace.get(ch.workspaceId)!.push(ch);
    }
    let dirty = false;
    workspaces = workspaces.map(ws => {
      const existing = new Set(ws.sections.flatMap(s => s.itemIds));
      const required = (byWorkspace.get(ws.id) || []).filter(c => !c.isDM && !existing.has(c.id));
      if (required.length === 0) return ws;
      dirty = true;
      return {
        ...ws,
        sections: ws.sections.map(sec => {
          if (sec.type !== "channels") return sec;
          return { ...sec, itemIds: [...sec.itemIds, ...required.map(r => r.id)] };
        })
      };
    });
    if (dirty) lsSet(WORKSPACES_KEY, workspaces);
  }

  const active = lsGet<string | null>(ACTIVE_WORKSPACE_KEY, null);
  if (!active) {
    lsSet(ACTIVE_WORKSPACE_KEY, (workspaces[0]?.id) || DEFAULT_WORKSPACE_ID);
  }

  if (Object.keys(members).length === 0) {
    lsSet(MEMBERS_KEY, { general: ["u-you","u-alice","u-bob"], random: ["u-you","u-alice","u-bob"] });
  }
  if (Object.keys(topics).length === 0) {
    lsSet(TOPICS_KEY, { general: { topic: "팀 공지 & 전체 토론" }, random: { topic: "잡담/밈/휴식" } });
  }
  if (Object.keys(status).length === 0) {
    lsSet(STATUS_KEY, { "u-you": "online", "u-alice": "online", "u-bob": "away" });
  }
}
ensureSeed();

/** ---------------- Helpers ---------------- */
async function toAttachment(f: FileItem): Promise<Attachment> {
  const MAX_INLINE = 1024 * 1024; // 1MB
  let dataUrl: string | undefined = undefined;
  const eligible = f.size <= MAX_INLINE && (f.type.startsWith("image/") || f.type === "application/pdf");
  if (eligible) {
    dataUrl = await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(f.blob);
    });
  }
  return { id: f.id, name: f.name, type: f.type, size: f.size, dataUrl };
}
function hasLink(text: string) {
  return /(https?:\/\/[^\s]+)/i.test(text || "");
}

function summarizeMessage(msg?: Msg) {
  if (!msg) return "";
  if (msg.text && msg.text.trim().length > 0) {
    return msg.text.replace(/\s+/g, " ").trim().slice(0, 80);
  }
  if (msg.attachments && msg.attachments.length > 0) {
    const count = msg.attachments.length;
    return count === 1 ? "1 attachment" : String(count) + " attachments";
  }
  return "";
}

/** ---------------- Store ---------------- */
export const useChat = create<State>((set, get) => ({
  me: { id: "u-you", name: "You" },
  users: {
    "u-you": { id: "u-you", name: "You" },
    "u-alice": { id: "u-alice", name: "Alice" },
    "u-bob": { id: "u-bob", name: "Bob" },
  },
  userStatus: lsGet<Record<string, PresenceState>>(STATUS_KEY, {}),

  workspaceId: lsGet<string>(ACTIVE_WORKSPACE_KEY, DEFAULT_WORKSPACE_ID),
  workspaces: lsGet<Workspace[]>(WORKSPACES_KEY, []),
  allChannels: lsGet<Channel[]>(CHANNELS_KEY, []),

  channelId: "general",
  channels: [],
  channelMembers: lsGet<Record<string,string[]>>(MEMBERS_KEY, {}),

  channelTopics: lsGet<Record<string,{topic:string; muted?:boolean}>>(TOPICS_KEY, {}),

  messages: [],
  threadFor: null,

  lastReadAt: lsGet<Record<string, number>>(LAST_READ_KEY, {}),
  channelActivity: lsGet<Record<string, ChannelActivity>>(ACTIVITY_KEY, {}),
  typingUsers: {},
  pinnedByChannel: lsGet<Record<string,string[]>>(PINS_KEY, {}),
  huddles: {},
  savedByUser: lsGet<Record<string,string[]>>(SAVED_KEY("u-you"), {}),

  loadChannels: async () => {
    ensureSeed();
    const workspaces = lsGet<Workspace[]>(WORKSPACES_KEY, []);
    const allChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const fallbackWorkspace = workspaces[0]?.id || DEFAULT_WORKSPACE_ID;
    const active = lsGet<string>(ACTIVE_WORKSPACE_KEY, fallbackWorkspace);
    const workspaceId = workspaces.some(ws => ws.id === active) ? active : fallbackWorkspace;
    const channels = allChannels.filter(c => c.workspaceId === workspaceId);

    set({ workspaces, allChannels, workspaceId, channels });
    channels.forEach(ch => get().updateChannelActivity(ch.id));

    if (channels.length === 0) {
      set({ channelId: "", messages: [], threadFor: null });
      return;
    }

    const current = get().channelId;
    const exists = channels.some(c => c.id === current);
    if (!exists) {
      await get().setChannel(channels[0].id);
    } else {
      const list = lsGet<Msg[]>(MSGS_KEY(current), []);
      set({ messages: list });
      get().updateChannelActivity(current, list);
    }
  },

  setWorkspace: async (id) => {
    const wsList = get().workspaces;
    const target = wsList.find(ws => ws.id === id);
    if (!target) return;

    const workspaces = lsGet<Workspace[]>(WORKSPACES_KEY, wsList);
    const allChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const channels = allChannels.filter(c => c.workspaceId === id);
    lsSet(ACTIVE_WORKSPACE_KEY, id);
    set({ workspaceId: id, channels, allChannels, workspaces });
    channels.forEach(ch => get().updateChannelActivity(ch.id));

    if (channels.length === 0) {
      set({ channelId: "", messages: [], threadFor: null });
      return;
    }

    const current = get().channelId;
    const exists = channels.some(c => c.id === current);
    if (!exists) {
      await get().setChannel(channels[0].id);
    } else {
      const list = lsGet<Msg[]>(MSGS_KEY(current), []);
      set({ messages: list });
      get().updateChannelActivity(current, list);
    }
  },

  setChannel: async (id) => {
    // DM
    if (id.startsWith("dm:")) {
      const raw = id.slice(3);
      const meId = get().me.id;
      const users = get().users;
      const otherIds = raw ? raw.split("+").filter(Boolean) : [];
      const participants = Array.from(new Set([meId, ...otherIds]));
      const workspaceId = get().workspaceId || DEFAULT_WORKSPACE_ID;

      let displayName: string;
      if (otherIds.length <= 1) {
        const target = otherIds[0] ?? raw;
        const user = users[target];
        displayName = user ? `@ ${user.name}` : `@ ${target || "Direct Message"}`;
      } else {
        const names = otherIds.map(uid => users[uid]?.name || uid);
        displayName = names.join(", ");
      }

      let allChannels = get().allChannels;
      let channels = get().channels;
      let workspaces = get().workspaces;

      const existing = allChannels.find(c => c.id === id);
      if (!existing) {
        const dmChannel: Channel = { id, name: displayName, isDM: true, workspaceId };
        allChannels = [...allChannels, dmChannel];
        if (!channels.some(c => c.id === id) && workspaceId === dmChannel.workspaceId) {
          channels = [...channels, dmChannel];
        }
      } else if (existing.name !== displayName || !existing.isDM) {
        allChannels = allChannels.map(c => c.id === id ? { ...c, name: displayName, isDM: true } : c);
        channels = channels.map(c => c.id === id ? { ...c, name: displayName, isDM: true } : c);
      }
      lsSet(CHANNELS_KEY, allChannels);

      const memberMap = { ...get().channelMembers, [id]: participants };
      lsSet(MEMBERS_KEY, memberMap);

      let workspacesChanged = false;
      workspaces = workspaces.map(ws => {
        if (ws.id !== workspaceId) return ws;
        let changed = false;
        const sections = ws.sections.map(sec => {
          if (sec.type !== "dms") return sec;
          if (sec.itemIds.includes(id)) return sec;
          changed = true;
          return { ...sec, itemIds: [...sec.itemIds, id] };
        });
        if (changed) {
          workspacesChanged = true;
          return { ...ws, sections };
        }
        return ws;
      });
      if (workspacesChanged) {
        lsSet(WORKSPACES_KEY, workspaces);
      }

      set({ allChannels, channels, workspaces, channelMembers: memberMap });

      const list = lsGet<Msg[]>(MSGS_KEY(id), []);
      if (list.length === 0) {
        lsSet(MSGS_KEY(id), list);
      }
      set({ channelId: id, messages: list, threadFor: null });
      get().updateChannelActivity(id, list);
      bc?.postMessage({ type: "channel:set", id });
      return;
    }

    const list = lsGet<Msg[]>(MSGS_KEY(id), []);
    set({ channelId: id, messages: list, threadFor: null });
    get().updateChannelActivity(id, list);
    bc?.postMessage({ type: "channel:set", id });
  },

  toggleSectionCollapsed: (sectionId, value) => {
    const workspaceId = get().workspaceId;
    let workspaces = get().workspaces;
    let dirty = false;

    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      const sections = ws.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        dirty = true;
        const next = value === undefined ? !sec.collapsed : value;
        return { ...sec, collapsed: next };
      });
      return dirty ? { ...ws, sections } : ws;
    });

    if (!dirty) return;
    set({ workspaces });
    lsSet(WORKSPACES_KEY, workspaces);
  },

  toggleStar: (channelId) => {
    const workspaceId = get().workspaceId;
    if (!workspaceId) return;
    let workspaces = get().workspaces;
    let changed = false;

    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      let sections = ws.sections;
      let starredIndex = sections.findIndex(sec => sec.type === "starred");
      if (starredIndex < 0) {
        const newSection: WorkspaceSection = {
          id: `sec-starred-${workspaceId}`,
          title: "Starred",
          type: "starred",
          itemIds: [],
          collapsed: false,
        };
        sections = [newSection, ...sections];
        starredIndex = 0;
      }
      const starred = sections[starredIndex];
      const has = starred.itemIds.includes(channelId);
      const itemIds = has
        ? starred.itemIds.filter(id => id !== channelId)
        : [...starred.itemIds, channelId];
      sections = sections.map((sec, idx) => (idx === starredIndex ? { ...sec, itemIds } : sec));
      changed = true;
      return { ...ws, sections };
    });

    if (!changed) return;
    set({ workspaces });
    lsSet(WORKSPACES_KEY, workspaces);
  },

  send: async (text, files = [], opts) => {
    const { channelId, me } = get();
    const attachments: Attachment[] = [];
    for (const f of files) attachments.push(await toAttachment(f));

    const msg: Msg = {
      id: String(Date.now()),
      author: me.name,
      authorId: me.id,
      text,
      ts: Date.now(),
      channelId,
      attachments: attachments.length ? attachments : undefined,
      parentId: opts?.parentId ?? null,
      mentions: opts?.mentions ?? [],
      reactions: {},
      seenBy: [me.id],
    };

    const list = lsGet<Msg[]>(MSGS_KEY(channelId), []);
    const next = [...list, msg];

    if (msg.parentId) {
      const rootIdx = next.findIndex(m => m.id === msg.parentId);
      if (rootIdx >= 0) {
        const root = next[rootIdx];
        next[rootIdx] = { ...root, threadCount: (root.threadCount || 0) + 1 };
      }
    }

    lsSet(MSGS_KEY(channelId), next);
    set({ messages: next });
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:new", msg, channelId });
  },

  updateMessage: (id, patch) => {
    const { channelId, messages, me } = get();
    const target = messages.find(m => m.id === id);
    if (!target || target.authorId !== me.id) return;
    const next = messages.map(m => m.id === id ? { ...m, ...patch, editedAt: Date.now() } : m);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:update", id, patch: { ...patch, editedAt: Date.now() }, channelId });
  },

  deleteMessage: (id) => {
    const { channelId, messages, me, pinnedByChannel } = get();
    const idx = messages.findIndex(m => m.id === id);
    if (idx < 0) return {};
    if (messages[idx].authorId !== me.id) return {};
    const deleted = messages[idx];
    let next = messages.filter(m => m.id !== id);

    if (deleted.parentId) {
      const rootIdx = next.findIndex(m => m.id === deleted.parentId);
      if (rootIdx >= 0) {
        const root = next[rootIdx];
        const n = Math.max(0, (root.threadCount || 1) - 1);
        next[rootIdx] = { ...root, threadCount: n };
      }
    }

    const pins = { ...(pinnedByChannel || {}) };
    if (pins[channelId]) pins[channelId] = pins[channelId].filter(mid => mid !== id);
    lsSet(PINS_KEY, pins);
    set({ messages: next, pinnedByChannel: pins });

    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:delete", id, channelId, deleted });
    bc?.postMessage({ type: "pin:sync", channelId, pins: pins[channelId] || [] });
    return { deleted };
  },

  restoreMessage: (msg) => {
    const { channelId, messages } = get();
    if (msg.channelId !== channelId) return;
    const next = [...messages, msg].sort((a,b)=> a.ts - b.ts);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:restore", msg, channelId });
  },

  toggleReaction: (id, emoji) => {
    const { messages, channelId, me } = get();
    const next = messages.map(m => {
      if (m.id !== id) return m;
      const map = { ...(m.reactions || {}) };
      const setIds = new Set(map[emoji] || []);
      if (setIds.has(me.id)) setIds.delete(me.id); else setIds.add(me.id);
      map[emoji] = Array.from(setIds);
      return { ...m, reactions: map };
    });
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    bc?.postMessage({ type: "message:react", id, emoji, userId: me.id, channelId });
  },

  openThread: (rootId) => set({ threadFor: { rootId } }),
  closeThread: () => set({ threadFor: null }),

  setTyping: (typing) => {
    const { channelId, me } = get();
    bc?.postMessage({ type: "typing", channelId, user: me.name, typing });
  },

  markChannelRead: (id) => {
    const ch = id || get().channelId;
    if (!ch) return;
    const now = Date.now();
    const next = { ...get().lastReadAt, [ch]: now };
    set({ lastReadAt: next });
    lsSet(LAST_READ_KEY, next);
    get().updateChannelActivity(ch);
  },

  markUnreadAt: (ts, ch) => {
    const channelId = ch || get().channelId;
    if (!channelId) return;
    const next = { ...get().lastReadAt, [channelId]: Math.max(0, ts - 1) };
    set({ lastReadAt: next });
    lsSet(LAST_READ_KEY, next);
    get().updateChannelActivity(channelId);
  },

  markSeenUpTo: (ts, ch) => {
    const { me } = get();
    const channelId = ch || get().channelId;
    if (!channelId) return;
    const list = lsGet<Msg[]>(MSGS_KEY(channelId), []);
    const next = list.map(m => {
      if (m.ts <= ts) {
        const seen = new Set(m.seenBy || []);
        seen.add(me.id);
        return { ...m, seenBy: Array.from(seen) };
      }
      return m;
    });
    lsSet(MSGS_KEY(channelId), next);
    set({ messages: next });
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "seen:update", channelId, userId: me.id, upTo: ts });
  },

  togglePin: (msgId) => {
    const { pinnedByChannel, channelId } = get();
    const pins = { ...(pinnedByChannel || {}) };
    const list = new Set(pins[channelId] || []);
    if (list.has(msgId)) list.delete(msgId); else list.add(msgId);
    pins[channelId] = Array.from(list);
    set({ pinnedByChannel: pins });
    lsSet(PINS_KEY, pins);
    bc?.postMessage({ type: "pin:sync", channelId, pins: pins[channelId] || [] });
  },

  startHuddle: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const hs: Record<string,HuddleState> = { ...curr, [channelId]: { active: true, startedAt: Date.now(), muted: false, members: ["You","Alice","Bob"] } };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: hs[channelId] });
  },

  stopHuddle: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const hs: Record<string,HuddleState> = { ...curr, [channelId]: { active: false } };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: hs[channelId] });
  },

  toggleHuddleMute: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles[channelId] || { active: false };
    const next = { ...curr, muted: !curr.muted };
    const hs: Record<string,HuddleState> = { ...get().huddles, [channelId]: next };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: next });
  },

  toggleSave: (msgId) => {
    const { me } = get();
    const saved = { ...(get().savedByUser || {}) };
    const list = new Set(saved[me.id] || []);
    if (list.has(msgId)) list.delete(msgId); else list.add(msgId);
    saved[me.id] = Array.from(list);
    set({ savedByUser: saved });
    lsSet(SAVED_KEY(me.id), saved);
  },
  setUserStatus: (userId, status) => {
    const next = { ...get().userStatus, [userId]: status };
    set({ userStatus: next });
    lsSet(STATUS_KEY, next);
  },
  addUser: (name, status = "offline") => {
    const trimmed = name.trim();
    const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const idRoot = base || `u-${Date.now()}`;
    let candidate = idRoot;
    let counter = 1;
    const currentUsers = get().users;
    while (currentUsers[candidate]) {
      candidate = `${idRoot}-${counter++}`;
    }
    const label = trimmed || candidate;
    const users = { ...currentUsers, [candidate]: { id: candidate, name: label } };
    const statusMap = { ...get().userStatus, [candidate]: status };
    set({ users, userStatus: statusMap });
    lsSet(STATUS_KEY, statusMap);
    return candidate;
  },

  getThread: (rootId) => {
    const all = get().messages;
    const root = all.find(m => m.id === rootId);
    const replies = all.filter(m => m.parentId === rootId).sort((a,b)=> a.ts - b.ts);
    return { root, replies };
  },

  search: (q, opts) => {
    const kind = opts?.kind || "all";
    const text = (q || "").toLowerCase().trim();
    const list = get().messages;
    return list.filter(m => {
      const hasFile = (m.attachments || []).length > 0;
      const link = hasLink(m.text || "");
      const textHit = text ? (m.text || "").toLowerCase().includes(text) : true;
      if (!textHit) return false;
      if (kind === "messages") return !hasFile && !link;
      if (kind === "files") return hasFile;
      if (kind === "links") return link;
      return true;
    });
  },

  /** 채널 생성 */
  createChannel: (name, memberIds) => {
    const workspaceId = get().workspaceId || DEFAULT_WORKSPACE_ID;
    const existing = new Set(get().allChannels.map(c => c.id));
    const base = name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    let id = base || `ch-${Date.now()}`;
    if (existing.has(id)) {
      id = `ch-${Date.now()}`;
    }
    const display = name.startsWith("#") ? name : `# ${name}`;
    const channel: Channel = { id, name: display, workspaceId };

    let allChannels = [...get().allChannels, channel];
    lsSet(CHANNELS_KEY, allChannels);

    let channels = get().channels;
    if (workspaceId === get().workspaceId) {
      channels = [...channels, channel];
    }

    let workspaces = get().workspaces;
    let workspaceChanged = false;
    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      let changed = false;
      const sections = ws.sections.map(sec => {
        if (sec.type !== "channels") return sec;
        if (sec.itemIds.includes(id)) return sec;
        changed = true;
        return { ...sec, itemIds: [...sec.itemIds, id] };
      });
      if (changed) {
        workspaceChanged = true;
        return { ...ws, sections };
      }
      return ws;
    });
    if (!workspaceChanged) {
      workspaces = workspaces.map(ws => {
        if (ws.id !== workspaceId) return ws;
        if (ws.sections.some(sec => sec.type === "channels")) return ws;
        workspaceChanged = true;
        return {
          ...ws,
          sections: [
            ...ws.sections,
            { id: `${ws.id}-channels`, title: "Channels", type: "channels", itemIds: [id], collapsed: false },
          ],
        };
      });
    }
    if (workspaceChanged) {
      lsSet(WORKSPACES_KEY, workspaces);
    }

    const members = { ...get().channelMembers, [id]: Array.from(new Set(memberIds)) };
    lsSet(MEMBERS_KEY, members);
    const topics = { ...get().channelTopics, [id]: { topic: "" } };
    lsSet(TOPICS_KEY, topics);
    lsSet(MSGS_KEY(id), []);

    set({
      allChannels,
      channels,
      workspaces,
      channelMembers: members,
      channelTopics: topics,
    });
    bc?.postMessage({ type: "channel:create", channel: { ...channel }, members: members[id] });
    return id;
  },

  /** 채널 초대 */
  inviteToChannel: (channelId, memberIds) => {
    const members = new Set(get().channelMembers[channelId] || []);
    memberIds.forEach(m => members.add(m));
    const obj = { ...get().channelMembers, [channelId]: Array.from(members) };
    set({ channelMembers: obj });
    lsSet(MEMBERS_KEY, obj);
    bc?.postMessage({ type: "channel:invite", channelId, members: obj[channelId] });
  },
  startGroupDM: (memberIds, _opts) => {
    const { me } = get();
    const unique = Array.from(new Set(memberIds || [])).filter(Boolean);
    const others = unique.filter(id => id !== me.id);
    if (others.length === 0) return null;
    others.sort();
    const channelId = `dm:${others.join("+")}`;
    void get().setChannel(channelId);
    return channelId;
  },

  /** 채널 토픽/설정 */
  setChannelTopic: (channelId, topic) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), topic } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    bc?.postMessage({ type: "channel:topic", channelId, topic });
  },
  setChannelMuted: (channelId, muted) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), muted } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    bc?.postMessage({ type: "channel:muted", channelId, muted });
  },

  updateChannelActivity: (channelId, messages) => {
    if (!channelId) return;
    const list = messages ?? lsGet<Msg[]>(MSGS_KEY(channelId), []);
    const meId = get().me.id;
    const since = get().lastReadAt[channelId] || 0;
    let unread = 0;
    let mention = 0;
    for (const item of list) {
      if (item.ts > since) {
        unread += 1;
        if ((item.mentions || []).includes(meId)) {
          mention += 1;
        }
      }
    }
    const last = list[list.length - 1];
    const previewText = summarizeMessage(last);
    const activity: ChannelActivity = {
      lastMessageTs: last?.ts || 0,
      lastAuthor: last?.author || undefined,
      lastPreview: previewText || undefined,
      unreadCount: unread,
      mentionCount: mention,
    };
    const current = get().channelActivity;
    const next = { ...current, [channelId]: activity };
    set({ channelActivity: next });
    lsSet(ACTIVITY_KEY, next);
  },

  initRealtime: () => {
    if (typeof window === "undefined") return;
    if (!bc) {
      bc = new BroadcastChannel("flowdash-chat");
      bc.onmessage = (e) => {
        const data = e.data || {};
        if (!data.type) return;

        const curCh = get().channelId;

        if (data.type === "channel:create") {
          const newChannel = data.channel as Channel;
          const currentWorkspace = get().workspaceId;
          const allChannels = [...get().allChannels, newChannel];
          lsSet(CHANNELS_KEY, allChannels);

          let channels = get().channels;
          if (newChannel.workspaceId === currentWorkspace) {
            channels = [...channels, newChannel];
          }

          let workspaces = get().workspaces;
          let wsChanged = false;
          workspaces = workspaces.map(ws => {
            if (ws.id !== newChannel.workspaceId) return ws;
            let changed = false;
            const sections = ws.sections.map(sec => {
              if (sec.type !== "channels") return sec;
              if (sec.itemIds.includes(newChannel.id)) return sec;
              changed = true;
              return { ...sec, itemIds: [...sec.itemIds, newChannel.id] };
            });
            if (changed) {
              wsChanged = true;
              return { ...ws, sections };
            }
            return ws;
          });
          if (wsChanged) {
            lsSet(WORKSPACES_KEY, workspaces);
          }

          const members = { ...get().channelMembers, [newChannel.id]: data.members as string[] };
          set({ allChannels, channels, workspaces, channelMembers: members });
          lsSet(MEMBERS_KEY, members);
          get().updateChannelActivity(newChannel.id);
        }
        if (data.type === "channel:invite") {
          const members = { ...get().channelMembers, [data.channelId]: data.members as string[] };
          set({ channelMembers: members });
          lsSet(MEMBERS_KEY, members);
        }
        if (data.type === "channel:topic") {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), topic: data.topic } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }
        if (data.type === "channel:muted") {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), muted: data.muted } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }

        if (data.type === "message:new") {
          const msg = data.msg as Msg | undefined;
          if (!msg) return;
          if (msg.channelId === curCh) {
            const cur = get().messages;
            const next = [...cur, msg];
            set({ messages: next });
            get().updateChannelActivity(msg.channelId, next);
          } else {
            get().updateChannelActivity(msg.channelId);
          }
        }
        if (data.type === "message:update") {
          const cur = get().messages;
          const next = cur.map(m => m.id === data.id ? { ...m, ...data.patch } : m);
          if (data.channelId === curCh) {
            set({ messages: next });
          }
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === "message:delete") {
          const cur = get().messages;
          const next = cur.filter(m => m.id !== data.id);
          if (data.channelId === curCh) {
            set({ messages: next });
          }
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === "message:restore") {
          const cur = get().messages;
          const msg = data.msg as Msg | undefined;
          if (!msg) return;
          const next = [...cur, msg].sort((a,b)=> a.ts - b.ts);
          if (msg.channelId === curCh) {
            set({ messages: next });
            get().updateChannelActivity(msg.channelId, next);
          } else {
            get().updateChannelActivity(msg.channelId);
          }
        }
        if (data.type === "message:react") {
          const cur = get().messages;
          const next = cur.map(m => {
            if (m.id !== data.id) return m;
            const map = { ...(m.reactions || {}) };
            const setIds = new Set(map[data.emoji] || []);
            if (setIds.has(data.userId)) setIds.delete(data.userId); else setIds.add(data.userId);
            map[data.emoji] = Array.from(setIds);
            return { ...m, reactions: map };
          });
          set({ messages: next });
        }
        if (data.type === "typing") {
          if (data.channelId !== curCh) return;
          const { typingUsers } = get();
          const list = new Set(typingUsers[curCh] || []);
          if (data.typing) list.add(data.user); else list.delete(data.user);
          set({ typingUsers: { ...typingUsers, [curCh]: Array.from(list) } });
          if (data.typing) {
            setTimeout(() => {
              const curr = get().typingUsers[curCh] || [];
              const again = new Set(curr);
              again.delete(data.user);
              const tu = { ...get().typingUsers, [curCh]: Array.from(again) };
              set({ typingUsers: tu });
            }, 3000);
          }
        }
        if (data.type === "pin:sync") {
          const pins = { ...(get().pinnedByChannel || {}) };
          pins[data.channelId] = data.pins || [];
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        }
        if (data.type === "huddle:state") {
          const hs = { ...get().huddles, [data.channelId]: data.state as HuddleState };
          set({ huddles: hs });
        }
        if (data.type === "seen:update") {
          if (data.channelId !== curCh) return;
          const cur = get().messages;
          const next = cur.map(m => {
            if (m.ts <= data.upTo) {
              const setIds = new Set(m.seenBy || []);
              setIds.add(data.userId);
              return { ...m, seenBy: Array.from(setIds) };
            }
            return m;
          });
          set({ messages: next });
          lsSet(MSGS_KEY(curCh), next);
        }
      };
    }
  },
}));
