// app/app/dashboard/layout.tsx
'use client';
import React from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import ModalHost from '@/components/providers/ModalHost';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar />}
        rightPanel={null}
        rightWidth={380}
      >
        {children}
      </AppShell>
      <ModalHost />
    </ToastProvider>
  );
}
