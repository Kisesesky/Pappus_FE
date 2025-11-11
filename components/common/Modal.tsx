// components/common/Modal.tsx
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  widthClass?: string; // e.g. "max-w-4xl"
  heightClass?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  widthClass = 'max-w-5xl',
  heightClass
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={clsx(
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] rounded-2xl bg-white shadow-xl',
        widthClass, heightClass, className
      )}>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
