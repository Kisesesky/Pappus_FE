'use client';
import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNavHeader from '@/components/layout/MobileNavHeader';
import { ToastProvider } from '@/components/ui/Toast';
import Drawer from '@/components/ui/Drawer';
import { usePathname } from 'next/navigation';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapse();
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
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(prev => !prev)} />}
        sidebarWidth={sidebarCollapsed ? 80 : 288}
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
    </ToastProvider>
  );
}
