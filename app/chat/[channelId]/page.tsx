import { Suspense } from "react";
import ChatView from "@/components/chat/view/ChatView";

type ChatChannelPageProps = {
  params: { channelId: string };
};

export default function ChatChannelPage({ params }: ChatChannelPageProps) {
  const channelId = decodeURIComponent(params.channelId);
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">채팅을 불러오는 중입니다…</div>}>
      <ChatView initialChannelId={channelId} />
    </Suspense>
  );
}
