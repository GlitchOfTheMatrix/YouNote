// components/NotesView/NotesView.tsx
// Renders AI-generated markdown using the shared parser/renderer in
// lib/markdown.ts. This file only wires class names — no parsing logic.

import { useMemo } from "react";
import { parseMarkdown, renderMarkdown } from "../../lib/markdown";
import styles from "./NotesView.module.css";

type NotesViewProps = {
  markdown: string;
};

export function NotesView({ markdown }: NotesViewProps) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  const classNames = {
    root: styles.notes,
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    h4: styles.h4,
    paragraph: styles.paragraph,
    ul: styles.ul,
    ol: styles.ol,
    inlineCode: styles.inlineCode,
    pre: styles.pre,
    code: styles.code,
    codeWrapper: styles.codeWrapper,
    copyButton: styles.copyButton,
  };

  return <>{renderMarkdown(blocks, classNames)}</>;
}
