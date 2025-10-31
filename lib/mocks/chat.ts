// lib/mocks/chat.ts

import type { Channel, Workspace, Msg } from "@/types/chat";

export const DEFAULT_WORKSPACE_ID = "ws-default";
export const DEFAULT_WORKSPACE_NAME = "Acme";
export const DEFAULT_STARRED_SECTION_ID = "sec-starred";
export const DEFAULT_CHANNEL_SECTION_ID = "sec-channels";
export const DEFAULT_DM_SECTION_ID = "sec-dms";

export const defaultChannels: Channel[] = [
  { id: "general", name: "# general", workspaceId: DEFAULT_WORKSPACE_ID },
  { id: "random", name: "# random", workspaceId: DEFAULT_WORKSPACE_ID },
];

export const defaultChannelMembers: Record<string, string[]> = {
  general: ["u-you", "u-alice", "u-bob"],
  random: ["u-you", "u-alice", "u-bob"],
};

export const defaultChannelTopics: Record<string, { topic: string; muted?: boolean }> = {
  general: { topic: "팀 공지 & 운영 메모" },
  random: { topic: "잡담/밈/추천" },
};

export function createDefaultMessages(baseTs: number): Record<string, Msg[]> {
  return {
    general: [
      { id: "1", channelId: "general", author: "Alice", authorId: "u-alice", text: "Welcome to #general!", ts: baseTs, seenBy: ["u-alice"] },
      {
        id: "2",
        channelId: "general",
        author: "Bob",
        authorId: "u-bob",
        text: "프로토타입 저장소 확인해볼래요? https://flowdash.dev/demo",
        ts: baseTs + 5000,
        seenBy: ["u-bob"],
      },
      {
        id: "3",
        channelId: "general",
        author: "Alice",
        authorId: "u-alice",
        text: "```ts\nexport const add = (a:number,b:number)=>a+b\n```",
        ts: baseTs + 9000,
        seenBy: ["u-alice"],
      },
    ],
    random: [],
  };
}

export function createDefaultWorkspace(channels: Channel[]): Workspace {
  const sectionChannels = channels
    .filter((channel) => !channel.isDM && channel.workspaceId === DEFAULT_WORKSPACE_ID)
    .map((channel) => channel.id);

  return {
    id: DEFAULT_WORKSPACE_ID,
    name: DEFAULT_WORKSPACE_NAME,
    sections: [
      { id: DEFAULT_STARRED_SECTION_ID, title: "Starred", type: "starred", itemIds: [], collapsed: false },
      { id: DEFAULT_CHANNEL_SECTION_ID, title: "Channels", type: "channels", itemIds: sectionChannels, collapsed: false },
      { id: DEFAULT_DM_SECTION_ID, title: "Direct Messages", type: "dms", itemIds: [], collapsed: false },
    ],
  };
}

