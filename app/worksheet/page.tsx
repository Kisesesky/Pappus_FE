// app/worksheet/page.tsx
import { Suspense } from "react";
import WorksheetListView from "@/components/worksheet/WorksheetListView";

export default function WorksheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">�ε� ��...</div>}>
      <WorksheetListView />
    </Suspense>
  );
}
