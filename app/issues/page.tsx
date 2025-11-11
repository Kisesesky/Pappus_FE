// app/issues/page.tsx
import { Suspense } from "react";
import KanbanView from "@/components/issues/KanbanView";

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <KanbanView />
    </Suspense>
  );
}
