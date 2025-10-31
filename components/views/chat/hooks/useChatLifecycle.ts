'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Msg } from '@/types/chat';

type UseChatLifecycleParams = {
  channelId: string;
  messages: Msg[];
  listRef: MutableRefObject<HTMLDivElement | null>;
  initRealtime: () => void;
  loadChannels: () => Promise<void>;
  setChannel: (id: string) => Promise<void>;
  markChannelRead: () => void;
  markSeenUpTo: (ts: number) => void;
  me: { id: string; name: string };
  onMention: (author: string, text: string | undefined) => void;
  broadcastRead: (userId: string, userName: string, channelId: string, ts: number) => void;
};

export function useChatLifecycle({
  channelId,
  messages,
  listRef,
  initRealtime,
  loadChannels,
  setChannel,
  markChannelRead,
  markSeenUpTo,
  me,
  onMention,
  broadcastRead,
}: UseChatLifecycleParams) {
  const lastMessageCount = useRef(0);
  const lastSynced = useRef<{ channelId?: string; messageId?: string }>({});

  useEffect(() => {
    (async () => {
      initRealtime();
      await loadChannels();
      await setChannel(channelId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lastSynced.current = {};
  }, [channelId]);

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (!lastMessage) return;
    const prev = lastSynced.current;
    const hasChanged = prev.channelId !== channelId || prev.messageId !== lastMessage.id;
    if (!hasChanged) return;

    lastSynced.current = { channelId, messageId: lastMessage.id };
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    markChannelRead();
    markSeenUpTo(lastMessage.ts);
    broadcastRead(me.id, me.name, channelId, lastMessage.ts);
  }, [lastMessage?.id, lastMessage?.ts, channelId, markChannelRead, markSeenUpTo, broadcastRead, me.id, me.name, listRef]);

  useEffect(() => {
    const onScroll = () => {
      const last = messages[messages.length - 1];
      if (last) {
        broadcastRead(me.id, me.name, channelId, last.ts);
      }
    };
    const el = listRef.current;
    el?.addEventListener('scroll', onScroll);
    const interval = setInterval(onScroll, 5000);
    return () => {
      el?.removeEventListener('scroll', onScroll);
      clearInterval(interval);
    };
  }, [messages, broadcastRead, channelId, me.id, me.name, listRef]);

  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      const added = messages.slice(lastMessageCount.current);
      for (const m of added) {
        if (m.authorId === me.id) continue;
        const mentioned =
          (m.mentions || []).some((x) => x === `name:${me.name}`) ||
          (m.text || '').includes(`@${me.name}`);
        if (mentioned) {
          onMention(m.author, m.text);
        }
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages, me.id, me.name, onMention]);
}
