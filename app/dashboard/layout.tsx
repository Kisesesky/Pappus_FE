// app/dashboard/layout.tsx
'use client';
import React from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import ModalHost from '@/components/providers/ModalHost';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapse();

  return (
    <ToastProvider>
      <AppShell
        header={(
          <Topbar
            onToggleSidebarCollapse={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
        sidebar={<Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)} />}
        sidebarWidth={sidebarCollapsed ? 80 : 288}
        rightPanel={null}
        rightWidth={380}
      >
        {children}
      </AppShell>
      <ModalHost />
    </ToastProvider>
  );
}

