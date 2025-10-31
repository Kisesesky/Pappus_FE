// types/chat.ts

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

export type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: File;
  previewUrl?: string;
};

export type ChannelActivity = {
  lastMessageTs: number;
  lastAuthor?: string;
  lastPreview?: string;
  unreadCount: number;
  mentionCount: number;
};

export type PresenceState = "online" | "away" | "busy" | "offline";

export type ChatUser = {
  id: string;
  name: string;
};

