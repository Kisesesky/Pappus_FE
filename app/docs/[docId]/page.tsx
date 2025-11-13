import { Suspense } from "react";
import DocView from "@/components/docs/DocView";

type DocPageProps = {
  params: { docId: string };
};

export default function DocDetailPage({ params }: DocPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">문서를 불러오는 중입니다…</div>}>
      <DocView initialPageId={params.docId} />
    </Suspense>
  );
}
