// components/ui/Drawer.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export default function Drawer({
  open, onOpenChange, children, width = 380, title = 'Details'
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  width?: number;
  title?: string;
}) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;     // 이 이상 스와이프하면 닫힘
  const MAX_DRAG = 240;     // 최대 드래그 적용

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onOpenChange]);

  // 터치 스와이프 from right → close
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      setDragX(0);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startX.current == null) return;
      const dx = e.touches[0].clientX - startX.current;
      // 오른쪽에서 왼쪽으로 드래그는 무시, 왼쪽→오른쪽(+dx)만 반영
      const val = Math.min(Math.max(dx, 0), MAX_DRAG);
      setDragX(val);
    };
    const onTouchEnd = () => {
      if (dragX > THRESHOLD) onOpenChange(false);
      setDragX(0);
      startX.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragX, onOpenChange]);

  const translate = open ? dragX : (width + 16);

  return (
    <div className={clsx("fixed inset-0 z-50 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      {/* backdrop */}
      <div
        className={clsx("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={() => onOpenChange(false)}
      />
      {/* panel */}
      <div
        ref={panelRef}
        className={clsx(
          "absolute top-0 right-0 h-full bg-panel border-l border-border shadow-panel w-full transition-transform",
        )}
        style={{
          maxWidth: width,
          transform: `translateX(${open ? translate : width + 16}px)`
        }}
      >
        <div className="h-12 px-4 border-b border-border flex items-center justify-between">
          <div className="font-medium">{title}</div>
          <button className="text-sm text-muted hover:text-foreground" onClick={() => onOpenChange(false)}>닫기</button>
        </div>
        <div className="h-[calc(100%-48px)] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
