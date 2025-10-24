// components/Topbar.tsx
'use client';
import { useToast } from "@/components/ui/Toast";
import { Bell, Info, Search } from "lucide-react";
import CommandPalette from "./command/CommandPalette";

export default function Topbar() {
  const { show } = useToast();
  return (
    <header className="h-14 px-4 flex items-center gap-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-2.5" size={16}/>
          <input
            className="w-full bg-subtle/60 border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
            placeholder="Search or run command (⌘K)"
          />
        </div>
      </div>
      <button
        onClick={()=> show({ title: "팁", description: "⌘K로 명령 팔레트를 열 수 있어요." })}
        className="p-2 rounded-md hover:bg-subtle/60"
        aria-label="Tip"
      >
        <Info size={18}/>
      </button>
      <button className="p-2 rounded-md hover:bg-subtle/60" aria-label="Notifications"><Bell size={18}/></button>
      <CommandPalette/>
    </header>
  );
}
