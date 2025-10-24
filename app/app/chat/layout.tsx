// app/app/chat/layout.tsx
'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import Drawer from '@/components/ui/Drawer';
import ChatRightPanel from '@/components/chat/ChatRightPanel';
import ProfilePopover from '@/components/chat/ProfilePopover';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

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

  return (
    <ToastProvider>
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar />}
        rightPanel={<div className="hidden md:block"><ChatRightPanel /></div>}
        rightWidth={380}
      >
        {children}
      </AppShell>

      {/* 모바일 Drawer */}
      <Drawer open={open} onOpenChange={setOpen} title="Threads / AI">
        <ChatRightPanel />
      </Drawer>

      {/* 모바일 토글 버튼 */}
      <button
        className="md:hidden fixed bottom-4 right-4 z-40 rounded-full border border-border bg-panel shadow-panel px-4 py-2 text-sm"
        onClick={() => setOpen(true)}
        aria-label="Open chat right panel"
      >
        Threads
      </button>

      {/* 멘션 프로필 팝오버 */}
      <ProfilePopover />
    </ToastProvider>
  );
}
