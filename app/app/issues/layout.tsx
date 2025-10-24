// app/app/issues/layout.tsx
'use client';
import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RightPanel from "@/components/RightPanel";
import Drawer from "@/components/ui/Drawer";
import { useParams } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";

export default function IssuesLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const params = useParams<{ id?: string }>();
  const hasRouteId = !!params?.id;

  // 라우트에 id가 있으면 모바일에서 자동으로 Drawer 오픈
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

      {/* 모바일 Drawer */}
      <Drawer open={open} onOpenChange={setOpen} title="Issue">
        <RightPanel />
      </Drawer>

      {/* 모바일 토글 버튼 */}
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
