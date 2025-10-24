// components/chat/HuddleBar.tsx
'use client';

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useChat } from "@/store/chat";

function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();
  return <div className="w-6 h-6 rounded-full bg-subtle/80 border border-border flex items-center justify-center text-[10px]">{initials}</div>;
}

export default function HuddleBar({ channelId }: { channelId: string }) {
  const { huddles, stopHuddle, toggleHuddleMute } = useChat();
  const h = huddles[channelId];

  if (!h?.active) return null;

  const dur = h.startedAt ? Math.max(0, Math.floor((Date.now() - h.startedAt)/1000)) : 0;
  const mm = String(Math.floor(dur/60)).padStart(2,'0');
  const ss = String(dur%60).padStart(2,'0');

  return (
    <div className="px-4 py-2 border-b border-border bg-subtle/20 flex items-center justify-between">
      <div className="text-sm flex items-center gap-3">
        <span className="font-semibold">Huddle</span>
        <span className="text-muted text-xs">#{channelId} · {mm}:{ss}</span>
        <div className="flex items-center gap-1">
          {(h.members || []).map((n, i)=> <Avatar key={i} name={n} />)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={()=> toggleHuddleMute(channelId)}
          title={h.muted ? "Unmute" : "Mute"}
        >
          {h.muted ? <MicOff size={14}/> : <Mic size={14}/>}
          {h.muted ? "Unmute" : "Mute"}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-rose-500/10 inline-flex items-center gap-1"
          onClick={()=> stopHuddle(channelId)}
          title="Leave"
        >
          <PhoneOff size={14}/> Leave
        </button>
      </div>
    </div>
  );
}
