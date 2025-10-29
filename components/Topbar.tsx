// components/Topbar.tsx
'use client';
import { useToast } from "@/components/ui/Toast";
import { Bell, Info, Menu, Search } from "lucide-react";
import CommandPalette from "./command/CommandPalette";

export default function Topbar() {
  const { show } = useToast();
  return (
    <header className="flex h-14 w-full items-center gap-2 px-3 md:px-4">
      <button
        type="button"
        className="rounded-md p-2 hover:bg-subtle/60 md:hidden"
        aria-label="Toggle navigation"
        onClick={() => window.dispatchEvent(new Event('app:toggle-sidebar'))}
      >
        <Menu size={20} />
      </button>
      <div className="flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
          <input
            className="w-full rounded-md border border-border bg-subtle/60 pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
            placeholder="Search or run command (?K)"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => show({ title: "??", description: "?K?? ???? ?????? ?? ?? ????." })}
          className="hidden rounded-md p-2 hover:bg-subtle/60 sm:inline-flex"
          aria-label="Tip"
        >
          <Info size={18} />
        </button>
        <button className="rounded-md p-2 hover:bg-subtle/60" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <CommandPalette />
      </div>
    </header>
  );
}