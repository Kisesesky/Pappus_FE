// app/app/issues/layout.tsx
'use client';
import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RightPanel from "@/components/RightPanel";
import Drawer from "@/components/ui/Drawer";
import { useParams, usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";

export default function IssuesLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const hasRouteId = !!params?.id;

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) setOpen(hasRouteId);
  }, [hasRouteId]);

  return (
    <ToastProvider>
      <AppShell
        header={<Topbar />}
        sidebar={<Sidebar />}
        rightPanel={<div className="hidden md:block"><RightPanel /></div>}
        rightWidth={400}
      >
        {children}
      </AppShell>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation" width={320} side="left">
        <Sidebar />
      </Drawer>

      <Drawer open={open} onOpenChange={setOpen} title="Issue">
        <RightPanel />
      </Drawer>

      <button
        className="md:hidden fixed bottom-4 right-4 z-40 rounded-full border border-border bg-panel shadow-panel px-4 py-2 text-sm"
        onClick={() => setOpen(true)}
        aria-label="Open details"
      >
        Details
      </button>
    </ToastProvider>
  );
}