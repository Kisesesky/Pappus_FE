// app/docs/layout.tsx
'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNavHeader from '@/components/layout/MobileNavHeader';
import { ToastProvider } from '@/components/ui/Toast';
import Drawer from '@/components/ui/Drawer';
import DocsRightPanel from '@/components/docs/DocsRightPanel';
import { usePathname } from 'next/navigation';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapse();
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('docs:open-right', onOpen);
    window.addEventListener('docs:close-right', onClose);
    return () => {
      window.removeEventListener('docs:open-right', onOpen);
      window.removeEventListener('docs:close-right', onClose);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (!isMobile) return;
      if (e.key === ']') setOpen(true);
      if (e.key === '[') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const handleOpen = () => setSidebarOpen(true);
    const handleClose = () => setSidebarOpen(false);
    const handleToggle = () => setSidebarOpen(prev => !prev);
    window.addEventListener('app:open-sidebar', handleOpen);
    window.addEventListener('app:close-sidebar', handleClose);
    window.addEventListener('app:toggle-sidebar', handleToggle);
    return () => {
      window.removeEventListener('app:open-sidebar', handleOpen);
      window.removeEventListener('app:close-sidebar', handleClose);
      window.removeEventListener('app:toggle-sidebar', handleToggle);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const showDocTools = pathname?.startsWith("/docs/") ?? false;

  return (
    <ToastProvider>
      <AppShell
        header={
          <Topbar
            onToggleSidebarCollapse={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        }
        sidebar={<Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)} />}
        sidebarWidth={sidebarCollapsed ? 80 : 288}
        rightPanel={
          showDocTools ? (
            <div className="hidden md:block">
              <DocsRightPanel />
            </div>
          ) : null
        }
        rightWidth={showDocTools ? 380 : undefined}
      >
        {children}
      </AppShell>

      <Drawer
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        title="Navigation"
        width={320}
        side="left"
        headerContent={(close) => <MobileNavHeader onClose={close} />}
      >
        <Sidebar />
      </Drawer>

      {showDocTools && (
        <>
          <Drawer open={open} onOpenChange={setOpen} title="Outline / History">
            <DocsRightPanel />
          </Drawer>

          <button
            className="md:hidden fixed bottom-4 right-4 z-40 rounded-full border border-border bg-panel shadow-panel px-4 py-2 text-sm"
            onClick={() => setOpen(true)}
            aria-label="Open docs right panel"
          >
            Outline / History
          </button>
        </>
      )}
    </ToastProvider>
  );
}
