// app/app/worksheet/page.tsx
import { Suspense } from "react";
import { WorksheetView } from "@/components/views";

export default function WorksheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">로드 중...</div>}>
      <WorksheetView />
    </Suspense>
  );
}
