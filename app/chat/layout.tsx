// app/chat/layout.tsx
'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import Drawer from '@/components/ui/Drawer';
import ChatRightPanel from '@/components/chat/ChatRightPanel';
import ProfilePopover from '@/components/chat/ProfilePopover';
import { usePathname } from 'next/navigation';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('chat:open-right', onOpen);
    window.addEventListener('chat:close-right', onClose);
    return () => {
      window.removeEventListener('chat:open-right', onOpen);
      window.removeEventListener('chat:close-right', onClose);
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

  const showChatTools = (pathname?.startsWith("/chat/") ?? false) && pathname !== "/chat";

  return (
    <ToastProvider>
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar />}
        rightPanel={
          showChatTools ? (
            <div className="hidden md:block">
              <ChatRightPanel />
            </div>
          ) : null
        }
        rightWidth={showChatTools ? 380 : undefined}
        mainScrollable={!showChatTools}
      >
        {children}
      </AppShell>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation" width={320} side="left">
        <Sidebar />
      </Drawer>

      {showChatTools && (
        <>
          <Drawer open={open} onOpenChange={setOpen} title="Threads / AI">
            <ChatRightPanel />
          </Drawer>

          <button
            className="md:hidden fixed bottom-4 right-4 z-40 rounded-full border border-border bg-panel shadow-panel px-4 py-2 text-sm"
            onClick={() => setOpen(true)}
            aria-label="Open chat right panel"
          >
            Threads
          </button>
        </>
      )}

      <ProfilePopover />
    </ToastProvider>
  );
}

