// app/app/worksheet/layout.tsx
'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import Drawer from '@/components/ui/Drawer';
import { usePathname } from 'next/navigation';

export default function WorksheetLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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

  return (
    <ToastProvider>
      <AppShell header={<Topbar />} sidebar={<Sidebar />}>
        {children}
      </AppShell>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation" width={320} side="left">
        <Sidebar />
      </Drawer>
    </ToastProvider>
  );
}
