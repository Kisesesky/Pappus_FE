// app/app/docs/page.tsx
import { Suspense } from "react";
import { DocView } from "@/components/views";

export default function DocsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DocView />
    </Suspense>
  );
}
