// app/app/worksheet/[worksheetId]/page.tsx
import { Suspense } from "react";
import { WorksheetDetailView } from "@/components/views";

type WorksheetDetailPageProps = {
  params: { worksheetId: string };
};

export default function WorksheetDetailPage({ params }: WorksheetDetailPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">워크시트를 불러오는 중...</div>}>
      <WorksheetDetailView worksheetId={params.worksheetId} />
    </Suspense>
  );
}
