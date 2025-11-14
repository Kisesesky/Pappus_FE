// app/chat/page.tsx
import { Suspense } from "react";
import ChatDashboard from "@/components/chat/ChatDashboard";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">채팅 데이터를 불러오는 중입니다…</div>}>
      <ChatDashboard />
    </Suspense>
  );
}
