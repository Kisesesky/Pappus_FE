// components/chat/LiveReadersBar.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';

export type Reader = { id: string; name: string; ts: number; channelId: string };

export default function LiveReadersBar({ meId, meName, channelId }: { meId: string; meName: string; channelId: string }) {
  const [peers, setPeers] = useState<Record<string, Reader>>({});

  useEffect(() => {
    const bc = new BroadcastChannel('flowdash-chat');
    const onMsg = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'read-cursor' && data.channelId === channelId && data.userId !== meId) {
        setPeers(prev => ({ ...prev, [data.userId]: { id: data.userId, name: data.userName, ts: Date.now(), channelId } }));
      }
    };
    bc.addEventListener('message', onMsg);
    const int = setInterval(() => {
      const now = Date.now();
      setPeers(prev => {
        const next: Record<string, Reader> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.ts <= 15000) next[k] = v; // 15초 내 활동만 유지
        }
        return next;
      });
    }, 3000);
    return () => {
      bc.removeEventListener('message', onMsg);
      clearInterval(int);
      bc.close();
    };
  }, [channelId, meId]);

  const list = useMemo(() => Object.values(peers).sort((a, b) => b.ts - a.ts), [peers]);

  if (list.length === 0) return null;

  return (
    <div className="px-4 py-1 border-b border-border bg-subtle/20 text-xs flex items-center gap-2">
      <span className="opacity-70">Also reading:</span>
      <div className="flex items-center gap-2">
        {list.map(p => (
          <span key={p.id} className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-subtle/70 border border-border grid place-items-center text-[10px]">
              {p.name[0]}
            </span>
            <span className="opacity-80">{p.name}</span>
          </span>
        ))}
      </div>
      <span className="ml-auto opacity-60">#{channelId}</span>
    </div>
  );
}

/** 외부에서 호출: 현재 사용자의 읽기 커서 브로드캐스트 */
export function broadcastReadCursor(userId: string, userName: string, channelId: string, ts: number) {
  try {
    const bc = new BroadcastChannel('flowdash-chat');
    bc.postMessage({ type: 'read-cursor', userId, userName, channelId, ts });
    // 브라우저 탭 간 전파 후 바로 닫아도 OK (경량)
    setTimeout(() => bc.close(), 20);
  } catch {}
}
