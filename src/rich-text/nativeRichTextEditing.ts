/** Pure reconciliation and structural actions for the native rich-text editor. */
import {
  applyInlineInputRule,
  matchInlineInputRule,
  matchPrefixInputRule,
} from "./inputRules";
import { inferNativeTextEdit } from "./nativeTextEdit";
import type { NativeTextEdit, NativeTextSelection } from "./nativeTextEdit";
import type { RichTextHistorySnapshot } from "./richTextHistory";
import {
  blockTextLength,
  deleteRange,
  insertBlocks,
  insertText,
  normalizeDocument,
  sliceSpans,
  spansText,
  splitBlock,
  toggleMarkInRange,
  turnInto,
} from "./richTextModel";
import type {
  DocPosition,
  InlineMark,
  RichTextBlock,
  RichTextDocument,
} from "./richTextModel";

/** Focus and selection target after a native model operation. */
export type NativeRichTextTarget = {
  block: number;
  selection: NativeTextSelection;
};

/** Reversible prefix conversion recorded for immediate Backspace. */
export type NativePrefixRule = { block: number; literal: string };

/** Result of reconciling a TextInput change with the rich document. */
export type NativeRichTextEditResult = {
  document: RichTextDocument;
  historySnapshot?: RichTextHistorySnapshot;
  prefixRule?: NativePrefixRule;
  target: NativeRichTextTarget;
};

/** Apply a native block's next plain text while preserving its rich spans. */
export function applyNativeTextChange({
  block,
  document,
  marks,
  nextText,
  selection,
}: {
  block: number;
  document: readonly RichTextBlock[];
  marks: readonly InlineMark[];
  nextText: string;
  selection: NativeTextSelection;
}): NativeRichTextEditResult {
  const doc = normalizeDocument(document);
  const blockIndex = clamp(block, 0, doc.length - 1);
  const current = doc[blockIndex];
  const before = nativeBlockText(current);
  const edit = inferNativeTextEdit(before, nextText, selection);
  const position = { block: blockIndex, offset: edit.from };
  const prefix = prefixRuleFor(current, before, edit);
  const inline = inlineRuleFor(current, before, edit);
  const base = deleteRange(doc, position, {
    block: blockIndex,
    offset: edit.to,
  });
  const inserted = insertNativeText(base, position, edit.insertedText, marks);
  if (prefix) {
    return applyPrefixRule(inserted, blockIndex, edit, prefix);
  }
  if (!inline || inserted.target.block !== blockIndex) {
    return inserted;
  }
  const formatted = applyInlineInputRule(inserted.document, blockIndex, inline);
  return {
    ...editResult(formatted.document, blockIndex, formatted.contentTo),
    historySnapshot: nativeHistorySnapshot(inserted),
  };
}

/** Return marks shared by every selected character, or adjacent to a caret. */
export function marksForNativeSelection(
  document: readonly RichTextBlock[],
  block: number,
  selection: NativeTextSelection,
): InlineMark[] {
  const doc = normalizeDocument(document);
  const target = doc[clamp(block, 0, doc.length - 1)];
  if (target.type === "codeBlock" || target.type === "divider") return [];
  const length = spansText(target.spans).length;
  const start = clamp(Math.min(selection.start, selection.end), 0, length);
  const end = clamp(Math.max(selection.start, selection.end), 0, length);
  const spans =
    start === end
      ? sliceSpans(
          target.spans,
          start > 0 ? start - 1 : 0,
          start > 0 ? start : 1,
        )
      : sliceSpans(target.spans, start, end);
  return MARK_ORDER.filter(
    (mark) =>
      spans.length > 0 && spans.every((span) => span.marks.includes(mark)),
  );
}

/** Return a block's editable plain text. */
export function nativeBlockText(block: RichTextBlock): string {
  if (block.type === "divider") return "";
  return block.type === "codeBlock" ? block.code : spansText(block.spans);
}

const MARK_ORDER: readonly InlineMark[] = ["bold", "italic", "strike", "code"];

function prefixRuleFor(
  block: RichTextBlock,
  before: string,
  edit: NativeTextEdit,
) {
  if (
    block.type === "codeBlock" ||
    block.type === "divider" ||
    edit.from !== edit.to
  )
    return null;
  return matchPrefixInputRule({
    insertedText: edit.insertedText,
    textAfterCaret: before.slice(edit.to),
    textBeforeCaret: before.slice(0, edit.from),
  });
}

function inlineRuleFor(
  block: RichTextBlock,
  before: string,
  edit: NativeTextEdit,
) {
  if (
    block.type === "codeBlock" ||
    block.type === "divider" ||
    edit.from !== edit.to
  )
    return null;
  return matchInlineInputRule({
    insertedText: edit.insertedText,
    textBeforeCaret: before.slice(0, edit.from),
  });
}

function applyPrefixRule(
  inserted: NativeRichTextEditResult,
  block: number,
  edit: NativeTextEdit,
  rule: NonNullable<ReturnType<typeof matchPrefixInputRule>>,
): NativeRichTextEditResult {
  const from = Math.max(0, edit.from - rule.deleteTriggerLength);
  const cleared = deleteRange(
    inserted.document,
    { block, offset: from },
    { block, offset: edit.from + edit.insertedText.length },
  );
  const historySnapshot = nativeHistorySnapshot(inserted);
  if (rule.type === "divider") {
    const next = insertBlocks(cleared, { block, offset: 0 }, [
      { type: "divider" },
    ]);
    return {
      ...editResult(next, block + 1, 0),
      historySnapshot,
    };
  }
  return {
    document: turnInto(cleared, block, rule.value),
    historySnapshot,
    prefixRule: { block, literal: rule.literal },
    target: collapsedTarget(block, 0),
  };
}

function nativeHistorySnapshot(
  result: NativeRichTextEditResult,
): RichTextHistorySnapshot {
  const { block, selection } = result.target;
  return {
    caret: {
      from: { block, offset: selection.start },
      to: { block, offset: selection.end },
    },
    doc: result.document,
  };
}

function insertNativeText(
  doc: RichTextDocument,
  position: DocPosition,
  text: string,
  marks: readonly InlineMark[],
): NativeRichTextEditResult {
  const source = doc[position.block];
  if (source.type === "codeBlock" || !text.includes("\n")) {
    const next = insertMarkedText(doc, position, text, marks);
    return editResult(next, position.block, position.offset + text.length);
  }
  let next = doc;
  let target = position;
  const parts = text.split("\n");
  parts.forEach((part, index) => {
    next = insertMarkedText(next, target, part, marks);
    target = { block: target.block, offset: target.offset + part.length };
    if (index < parts.length - 1) {
      const current = next[target.block];
      const exitsEmpty =
        isExitOnEmpty(current) && blockTextLength(current) === 0;
      next = splitBlock(next, target);
      target = exitsEmpty
        ? { block: target.block, offset: 0 }
        : { block: target.block + 1, offset: 0 };
    }
  });
  return editResult(next, target.block, target.offset);
}

function insertMarkedText(
  doc: RichTextDocument,
  position: DocPosition,
  text: string,
  marks: readonly InlineMark[],
): RichTextDocument {
  let next = insertText(doc, position, text);
  for (const mark of MARK_ORDER) {
    if (marks.includes(mark) && text.length > 0) {
      next = toggleMarkInRange(
        next,
        position,
        { block: position.block, offset: position.offset + text.length },
        mark,
      );
    }
  }
  return next;
}

function editResult(
  document: readonly RichTextBlock[],
  block: number,
  offset: number,
): NativeRichTextEditResult {
  return {
    document: normalizeDocument(document),
    target: collapsedTarget(block, offset),
  };
}

function collapsedTarget(block: number, offset: number): NativeRichTextTarget {
  return { block, selection: { end: offset, start: offset } };
}

function isExitOnEmpty(block: RichTextBlock): boolean {
  return (
    block.type === "bullet" ||
    block.type === "numbered" ||
    block.type === "check" ||
    block.type === "quote"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
