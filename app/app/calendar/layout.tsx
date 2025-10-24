// app/app/calendar/layout.tsx
'use client';
import React from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ToastProvider } from '@/components/ui/Toast';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar />}
        rightPanel={null}      // 캘린더도 기본은 우측 패널 없음
        rightWidth={380}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
