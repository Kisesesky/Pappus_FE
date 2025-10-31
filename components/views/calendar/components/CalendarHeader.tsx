"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import type { ViewMode } from "@/types/calendar";
import { cn } from "@/lib/utils";

type CalendarHeaderProps = {
  current: Date;
  view: ViewMode;
  searchTerm: string;
  onSearch: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (mode: ViewMode) => void;
  onOpenCreate: () => void;
};

export function CalendarHeader({
  current,
  view,
  searchTerm,
  onSearch,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onOpenCreate,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-panel/80 px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:bg-subtle/60"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground/80 transition hover:bg-subtle/60"
        >
          오늘
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:bg-subtle/60"
        >
          <ChevronRight size={16} />
        </button>
        <div>
          <div className="text-xs uppercase tracking-[0.08em] text-muted">캘린더</div>
          <div className="text-xl font-semibold text-foreground">
            {format(current, "yyyy년 M월", { locale: ko })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm text-muted focus-within:ring-2 focus-within:ring-brand/40">
          <Search size={14} />
          <input
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="일정 검색"
            className="w-40 bg-transparent text-sm text-foreground focus:outline-none sm:w-52"
          />
        </div>
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1 text-xs font-medium">
          {(["month", "agenda"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeView(mode)}
              className={cn(
                "rounded-md px-3 py-1 capitalize transition",
                view === mode ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-subtle/60",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
        >
          <Plus size={14} />
          새 일정
        </button>
      </div>
    </header>
  );
}
