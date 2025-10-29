// components/layout/AppShell.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

type AppShellProps = {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  rightPanel?: React.ReactNode | null; // ?????? ??? (????? ?? ???)
  rightWidth?: number; // px
  className?: string;
  mainScrollable?: boolean;
};

export default function AppShell({
  sidebar,
  header,
  children,
  rightPanel = null,
  rightWidth = 360,
  className,
  mainScrollable = true,
}: AppShellProps) {
  const hasRight = !!rightPanel;
  const contentMinHeight = header ? 'calc(100vh - 56px)' : '100vh';

  return (
    <div className={clsx('min-h-screen w-full bg-background text-foreground flex flex-col overflow-hidden', className)}>
      {/* ??? ??? */}
      {header && (
        <div className="h-14 shrink-0 border-b border-border bg-panel shadow-panel sticky top-0 z-40">
          {header}
        </div>
      )}

      <div
        className="flex-1 flex flex-col md:flex-row overflow-hidden"
        style={{ minHeight: contentMinHeight }}
      >
        {/* ???? ????? */}
        {sidebar && (
          <aside className="hidden md:flex md:w-72 md:flex-col border-r border-border bg-panel shadow-panel shrink-0 overflow-auto">
            {sidebar}
          </aside>
        )}

        {/* ???? + (?��)?????? */}
        <div
          className={clsx(
            'flex-1 min-w-0 flex flex-col overflow-hidden',
            hasRight && 'md:grid'
          )}
          style={hasRight ? { gridTemplateColumns: `minmax(0, 1fr) ${rightWidth}px` } : undefined}
        >
          <main
            className={clsx(
              'min-w-0 flex-1 min-h-0',
              mainScrollable ? 'overflow-auto' : 'overflow-hidden'
            )}
          >
            {children}
          </main>

          {hasRight && (
            <aside
              className="hidden md:block h-full overflow-auto border-l border-border bg-panel shadow-panel"
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

