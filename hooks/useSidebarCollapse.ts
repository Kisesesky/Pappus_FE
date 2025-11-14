'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'app:sidebar-collapsed';

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored != null) {
      setCollapsed(stored === '1');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return [collapsed, setCollapsed] as const;
}
