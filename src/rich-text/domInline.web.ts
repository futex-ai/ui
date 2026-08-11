/**
 * Inline text rendering for the web editor, plain and decorated. A block's
 * spans are drawn straight into the contentEditable tree; when a collaboration
 * overlay is present the same spans are sliced along the overlay's runs, each
 * slice is wrapped in the decoration elements from `domDecoration.web`, and
 * remote carets are dropped in between.
 */
import type { SharedUiTheme } from "../theme";

import type {
  RichTextAnnotatedRun,
  RichTextBlockAnnotations,
  RichTextCaretMark,
} from "./richTextCollabModel";
import type { RichTextCollabPalette } from "./richTextCollabPalette";
import {
  caretElement,
  commentElement,
  selectionElement,
  suggestionElement,
} from "./domDecoration.web";
import type { InlineSpan } from "./richTextModel";
import { sliceSpans } from "./richTextModel";

/** Overlay applied to one block's inline content. */
export type RichTextInlineDecoration = {
  annotations: RichTextBlockAnnotations;
  palette: RichTextCollabPalette;
  theme: SharedUiTheme;
};

const editorBoundarySpace = "\u00a0";
const editorCaretBoundary = "\u200b";

/** Render a block's inline spans, decorated when an overlay is supplied. */
export function renderInlineSpans(
  parent: HTMLElement,
  spans: readonly InlineSpan[],
  decoration: RichTextInlineDecoration | null,
): void {
  if (!decoration || decoration.annotations.runs.length === 0) {
    appendPlainSpans(parent, spans);
    appendCarets(parent, decoration, () => true);
    return;
  }
  renderDecorated(parent, decoration, (host, run) =>
    appendPlainSpans(host, sliceSpans(spans, run.from, run.to)),
  );
}

/** Render a code block's text, decorated when an overlay is supplied. */
export function renderInlineCode(
  parent: HTMLElement,
  code: string,
  decoration: RichTextInlineDecoration | null,
): void {
  if (!decoration || decoration.annotations.runs.length === 0) {
    parent.textContent = code;
    appendCarets(parent, decoration, () => true);
    return;
  }
  renderDecorated(parent, decoration, (host, run) => {
    const text = code.slice(run.from, run.to);
    if (text.length > 0) host.appendChild(document.createTextNode(text));
  });
}

/** Give an empty block a line box so it stays clickable and caret-addressable. */
export function ensureCaretTarget(element: HTMLElement): void {
  if (element.textContent === "" && element.querySelector("br") === null) {
    element.append(document.createElement("br"));
  }
}

/** Plain text of an element, ignoring non-editable decoration subtrees. */
export function editableTextContent(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (!(node instanceof HTMLElement) || node.contentEditable === "false") {
    return "";
  }
  return [...node.childNodes].map(editableTextContent).join("");
}

function renderDecorated(
  parent: HTMLElement,
  decoration: RichTextInlineDecoration,
  fill: (host: HTMLElement, run: RichTextAnnotatedRun) => void,
): void {
  const carets = [...decoration.annotations.carets].sort(
    (left, right) => left.offset - right.offset,
  );
  let emitted = 0;
  const flushTo = (offset: number) => {
    while (emitted < carets.length && carets[emitted].offset <= offset) {
      parent.append(caretElement(carets[emitted], decoration));
      emitted += 1;
    }
  };
  for (const run of decoration.annotations.runs) {
    flushTo(run.from);
    fill(runHost(parent, run, decoration), run);
  }
  flushTo(Number.POSITIVE_INFINITY);
}

function appendCarets(
  parent: HTMLElement,
  decoration: RichTextInlineDecoration | null,
  accept: (caret: RichTextCaretMark) => boolean,
): void {
  if (!decoration) return;
  for (const caret of decoration.annotations.carets) {
    if (accept(caret)) parent.append(caretElement(caret, decoration));
  }
}

/**
 * Build the wrapper chain for one run and return the element its text belongs
 * in. Live selection sits outermost so its tint reads behind everything, then
 * comment anchors (one per thread, so overlapping threads deepen), then the
 * tracked change closest to the text it is changing.
 */
function runHost(
  parent: HTMLElement,
  run: RichTextAnnotatedRun,
  decoration: RichTextInlineDecoration,
): HTMLElement {
  let host = parent;
  const [presenceId] = run.presenceIds;
  if (presenceId !== undefined) {
    host = appendChild(host, selectionElement(presenceId, decoration));
  }
  for (const threadId of run.commentThreadIds) {
    host = appendChild(
      host,
      commentElement(
        threadId,
        threadId === run.activeCommentThreadId,
        decoration.theme,
      ),
    );
  }
  if (run.suggestion) {
    host = appendChild(host, suggestionElement(run.suggestion, decoration));
  }
  return host;
}

function appendChild(parent: HTMLElement, child: HTMLElement): HTMLElement {
  parent.append(child);
  return child;
}

function appendPlainSpans(
  parent: HTMLElement,
  spans: readonly InlineSpan[],
): void {
  for (const span of spans) {
    appendMarkedText(parent, span, 0);
    if (span.marks.length > 0) {
      parent.appendChild(document.createTextNode(editorCaretBoundary));
    }
  }
}

function appendMarkedText(
  parent: Node,
  span: InlineSpan,
  markIndex: number,
): void {
  if (markIndex >= span.marks.length) {
    appendTextWithBreaks(parent, span.text);
    return;
  }
  const wrapper = document.createElement(markTag(span.marks[markIndex]));
  parent.appendChild(wrapper);
  appendMarkedText(wrapper, span, markIndex + 1);
}

function appendTextWithBreaks(parent: Node, text: string): void {
  const parts = text.split("\n");
  parts.forEach((part, index) => {
    if (index > 0) {
      parent.appendChild(document.createElement("br"));
    }
    if (part.length > 0) {
      parent.appendChild(document.createTextNode(renderEditableText(part)));
    }
  });
}

function renderEditableText(text: string): string {
  return text.replace(/^ +| +$/g, (spaces) =>
    editorBoundarySpace.repeat(spaces.length),
  );
}

function markTag(
  mark: InlineSpan["marks"][number],
): "code" | "em" | "s" | "strong" {
  switch (mark) {
    case "bold":
      return "strong";
    case "italic":
      return "em";
    case "strike":
      return "s";
    case "code":
      return "code";
  }
}
