// app/members/page.tsx
import { Suspense } from "react";
import MembersView from "@/components/members/MembersView";

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">멤버 목록을 불러오는 중...</div>}>
      <MembersView />
    </Suspense>
  );
}
