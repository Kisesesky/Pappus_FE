// app/app/chat/page.tsx
import { Suspense } from "react";
import { ChatView } from "@/components/views";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ChatView />
    </Suspense>
  );
}
