// components/layout/AppShell.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

type AppShellProps = {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  rightPanel?: React.ReactNode | null; // 우측 슬롯 (없으면 컬럼 제거)
  rightWidth?: number; // px
  className?: string;
};

export default function AppShell({
  sidebar,
  header,
  children,
  rightPanel = null,
  rightWidth = 360,
  className,
}: AppShellProps) {
  const hasRight = !!rightPanel;

  return (
    <div className={clsx('h-screen w-full bg-background text-foreground', className)}>
      {/* 상단 헤더 */}
      {header && (
        <div className="h-14 shrink-0 border-b border-border bg-panel shadow-panel sticky top-0 z-40">
          {header}
        </div>
      )}

      <div className="h-[calc(100vh-56px)] flex">
        {/* 좌측 사이드바 */}
        {sidebar && (
          <aside className="w-72 border-r border-border bg-panel shadow-panel shrink-0 overflow-auto">
            {sidebar}
          </aside>
        )}

        {/* 메인 + (옵션)우측패널 */}
        <div
          className="flex-1 min-w-0 grid"
          style={{ gridTemplateColumns: hasRight ? `1fr ${rightWidth}px` : '1fr' }}
        >
          <main className="min-w-0 overflow-auto">{children}</main>

          {hasRight && (
            <aside
              className="h-full overflow-auto border-l border-border bg-panel shadow-panel"
              style={{ width: rightWidth }}
            >
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
