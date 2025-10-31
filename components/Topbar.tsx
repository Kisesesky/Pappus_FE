// components/Topbar.tsx
'use client';
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { Bell, Info, Menu, Search } from "lucide-react";
import CommandPalette from "./command/CommandPalette";

export default function Topbar() {
  const { show } = useToast();
  return (
    <header className="flex h-14 w-full items-center gap-3 border-b border-border bg-panel px-3 md:px-6">
      <button
        type="button"
        className="rounded-md p-2 text-muted transition-colors hover:bg-accent md:hidden"
        aria-label="Toggle navigation"
        onClick={() => window.dispatchEvent(new Event('app:toggle-sidebar'))}
      >
        <Menu size={20} />
      </button>

      <div className="hidden items-center gap-3 md:flex">
        <Image
          src="/logo.png"
          alt="AndUp logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-md object-cover"
          priority
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">AnDup</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted">Product Ops Workspace</span>
        </div>
      </div>

      <div className="flex-1 md:max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
          <input
            className="w-full rounded-md border border-border bg-accent pl-9 pr-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring"
            placeholder="Search or run command (⌘+K)"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => show({ title: "Tip", description: "Press ?K to open the command palette." })}
          className="hidden rounded-md px-3 py-2 text-xs font-medium text-muted transition hover:bg-accent hover:text-foreground sm:inline-flex"
          aria-label="Tips"
        >
          <Info size={16} className="mr-1" />
          Help
        </button>
        <button className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-primary transition hover:bg-sidebar-primary/10">
          Create
        </button>
        <button className="rounded-md p-2 text-muted transition hover:bg-accent" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <CommandPalette />
      </div>
    </header>
  );
}
