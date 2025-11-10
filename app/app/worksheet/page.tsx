// app/app/worksheet/page.tsx
import { Suspense } from "react";
import { WorksheetListView } from "@/components/views";

export default function WorksheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">�ε� ��...</div>}>
      <WorksheetListView />
    </Suspense>
  );
}
