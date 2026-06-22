// lib/markdown.ts
// Lightweight markdown → AST parser and AST → React renderer.
// Deliberately narrow: only the shapes our AI output uses. Splitting parse
// from render keeps NotesView thin and makes the parser easy to unit test.

import { createElement, Fragment, useState, type ReactNode } from "react";

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string; lang?: string };

export type MarkdownClassNames = {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  paragraph: string;
  ul: string;
  ol: string;
  inlineCode: string;
  pre: string;
  code: string;
  root: string;
  codeWrapper: string;
  copyButton: string;
};

const FENCE_RE = /^```\s*(\w*)\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;

/**
 * Parses a markdown string into a flat list of block nodes.
 * Blank lines are ignored; unsupported syntax falls through as paragraphs.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const lang = fence[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", code: codeLines.join("\n"), lang });
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, "$1"));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, "$1"));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE_RE.test(lines[i]) &&
      !HEADING_RE.test(lines[i]) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function parseInline(text: string, keyPrefix: string, inlineCodeClass: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let count = 0;
  let match: RegExpExecArray | null;

  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(createElement("strong", { key: `${keyPrefix}-${count++}` }, token.slice(2, -2)));
    } else {
      nodes.push(
        createElement("code", { key: `${keyPrefix}-${count++}`, className: inlineCodeClass }, token.slice(1, -1))
      );
    }
    lastIndex = INLINE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/** Small stateful component for the copy-to-clipboard button on code blocks. */
function CodeCopyButton({ code, className }: { code: string; className: string }) {
  const [label, setLabel] = useState("Copy");

  function handleClick() {
    navigator.clipboard.writeText(code).then(() => {
      setLabel("Copied!");
      setTimeout(() => setLabel("Copy"), 1500);
    }).catch(() => {
      // Ignore if clipboard access is denied
    });
  }

  return createElement("button", {
    type: "button",
    className,
    onClick: handleClick,
    "aria-label": "Copy code to clipboard",
  }, label);
}

function renderBlock(block: MarkdownBlock, key: number, classes: MarkdownClassNames): ReactNode {
  switch (block.type) {
    case "heading": {
      const level = Math.min(block.level, 6);
      const tag = `h${level}`;
      const className =
        classes[`h${Math.min(block.level, 4)}` as "h1" | "h2" | "h3" | "h4"] || classes.h4;
      return createElement(
        tag,
        { key, className },
        parseInline(block.text, `h${key}`, classes.inlineCode)
      );
    }
    case "paragraph":
      return createElement(
        "p",
        { key, className: classes.paragraph },
        parseInline(block.text, `p${key}`, classes.inlineCode)
      );
    case "ul":
      return createElement(
        "ul",
        { key, className: classes.ul },
        block.items.map((item, index) =>
          createElement("li", { key: index }, parseInline(item, `ul${key}-${index}`, classes.inlineCode))
        )
      );
    case "ol":
      return createElement(
        "ol",
        { key, className: classes.ol },
        block.items.map((item, index) =>
          createElement("li", { key: index }, parseInline(item, `ol${key}-${index}`, classes.inlineCode))
        )
      );
    case "code":
      // Wrap <pre> in a positioned container with a copy button overlay.
      return createElement(
        "div",
        { key, className: classes.codeWrapper },
        createElement(CodeCopyButton, { code: block.code, className: classes.copyButton }),
        createElement(
          "pre",
          { className: classes.pre },
          createElement("code", { className: classes.code }, block.code)
        )
      );
    default:
      return createElement(Fragment, { key });
  }
}

/**
 * Turns parsed blocks into React elements using caller-supplied class names.
 * NotesView passes its CSS module tokens so styling stays in one place.
 */
export function renderMarkdown(blocks: MarkdownBlock[], classes: MarkdownClassNames): ReactNode {
  return createElement("div", { className: classes.root }, blocks.map((block, index) => renderBlock(block, index, classes)));
}
