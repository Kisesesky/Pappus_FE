// components/ui/ThemeToggle.tsx
'use client';

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = 'light' | 'dark' | 'system';
const KEY = 'fd.theme';

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = t === 'system' ? prefersDark : t === 'dark';
  root.classList.toggle('dark', dark);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || 'system';
    setTheme(stored);
    applyTheme(stored);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (stored === 'system') applyTheme('system'); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, theme);
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="rounded-full border border-border bg-panel shadow-panel overflow-hidden flex">
        <button
          className={`p-2 ${theme==='light'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('light')}
          title="라이트"
        ><Sun size={16}/></button>
        <button
          className={`p-2 ${theme==='dark'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('dark')}
          title="다크"
        ><Moon size={16}/></button>
        <button
          className={`p-2 ${theme==='system'?'bg-subtle/60':''}`}
          onClick={()=> setTheme('system')}
          title="시스템"
        ><Monitor size={16}/></button>
      </div>
    </div>
  );
}
