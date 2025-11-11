// app/dashboard/page.tsx
'use client';

import { Suspense } from 'react';
import DashboardView from '@/components/dashboard/DashboardView';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DashboardView />
    </Suspense>
  );
}
