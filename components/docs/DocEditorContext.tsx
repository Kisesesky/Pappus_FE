// components/docs/DocEditorContext.tsx
'use client';
import React, { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/react';

export type DocPresencePeer = { id: string; name: string; color: string; ts: number };

type DocEditorContextValue = {
  editor: Editor | null;
  presence: DocPresencePeer[];
  presenceSummary: string;
  pageTitle: string;
};

const DocEditorCtx = createContext<DocEditorContextValue>({
  editor: null,
  presence: [],
  presenceSummary: '',
  pageTitle: '',
});

export function DocEditorProvider({
  editor,
  presence = [],
  presenceSummary = '',
  pageTitle = '',
  children,
}: {
  editor: Editor | null;
  presence?: DocPresencePeer[];
  presenceSummary?: string;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <DocEditorCtx.Provider value={{ editor, presence, presenceSummary, pageTitle }}>
      {children}
    </DocEditorCtx.Provider>
  );
}

export function useDocEditor() {
  return useContext(DocEditorCtx).editor;
}

export function useDocCollaboration() {
  const ctx = useContext(DocEditorCtx);
  return {
    presence: ctx.presence,
    presenceSummary: ctx.presenceSummary,
    pageTitle: ctx.pageTitle,
  };
}
