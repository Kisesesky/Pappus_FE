"use client";

import { useEffect } from "react";

type CalendarCreateModalProps = {
  open: boolean;
  name: string;
  color: string;
  onChangeName: (value: string) => void;
  onChangeColor: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function CalendarCreateModal({
  open,
  name,
  color,
  onChangeName,
  onChangeColor,
  onSubmit,
  onCancel,
}: CalendarCreateModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[min(420px,90vw)] rounded-xl border border-border bg-panel p-5 shadow-xl">
        <header className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            새 캘린더
          </div>
          <h2 className="text-lg font-semibold text-foreground">팀 또는 개인 캘린더 추가</h2>
        </header>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">이름</label>
            <input
              value={name}
              onChange={(event) => onChangeName(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="예: 개인 일정"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">색상</label>
            <input
              type="color"
              value={color}
              onChange={(event) => onChangeColor(event.target.value)}
              className="h-12 w-full cursor-pointer rounded-md border border-border"
            />
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-subtle/60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
}
