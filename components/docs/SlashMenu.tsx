// components/docs/SlashMenu.tsx
'use client';
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { key: "h2", label: "Heading 2", run: (ed:any)=> ed.chain().focus().setHeading({level:2}).run() },
  { key: "h3", label: "Heading 3", run: (ed:any)=> ed.chain().focus().setHeading({level:3}).run() },
  { key: "ul", label: "Bullet List", run: (ed:any)=> ed.chain().focus().toggleBulletList().run() },
  { key: "hr", label: "Divider", run: (ed:any)=> ed.chain().focus().setHorizontalRule().run() },
];

export default function SlashMenu({ editor }: { editor:any }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{x:number,y:number}>({x:0,y:0});
  const idxRef = useRef(0);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        const { from } = editor.state.selection;
        const rect = editor.view.coordsAtPos(from);
        setPos({ x: rect.left, y: rect.bottom + 6 }); setOpen(true); idxRef.current = 0;
      } else if (open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) {
        e.preventDefault();
        if (e.key === "ArrowDown") idxRef.current = (idxRef.current + 1) % ITEMS.length;
        if (e.key === "ArrowUp")   idxRef.current = (idxRef.current - 1 + ITEMS.length) % ITEMS.length;
        if (e.key === "Enter") { ITEMS[idxRef.current].run(editor); setOpen(false); }
        if (e.key === "Escape") setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editor, open]);

  if (!open) return null;
  return (
    <div className="fixed z-50 w-48 border border-border rounded-md bg-panel shadow-panel text-sm"
         style={{ left: pos.x, top: pos.y }}>
      {ITEMS.map((it, i) => (
        <button key={it.key}
          className={`w-full text-left px-3 py-2 hover:bg-subtle/60 ${i===idxRef.current ? 'bg-subtle/60' : ''}`}
          onMouseEnter={()=> idxRef.current = i}
          onClick={()=> { it.run(editor); setOpen(false); }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
