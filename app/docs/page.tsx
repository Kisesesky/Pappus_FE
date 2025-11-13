// app/docs/page.tsx
import { Suspense } from "react";
import DocsDashboard from "@/components/docs/DocsDashboard";

export default function DocsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">문서 데이터를 불러오는 중입니다…</div>}>
      <DocsDashboard />
    </Suspense>
  );
}
