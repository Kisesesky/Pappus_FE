// components/docs/DocEditorContext.tsx
'use client';
import React, { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/react';

const DocEditorCtx = createContext<Editor | null>(null);

export function DocEditorProvider({ editor, children }: { editor: Editor | null; children: React.ReactNode }) {
  return <DocEditorCtx.Provider value={editor}>{children}</DocEditorCtx.Provider>;
}

export function useDocEditor() {
  return useContext(DocEditorCtx);
}
