/** Pure reconciliation and structural actions for the native rich-text editor. */
import { matchInlineInputRule, matchPrefixInputRule } from "./inputRules";
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

/** Plain-text selection offsets reported by a native block TextInput. */
export type NativeTextSelection = { end: number; start: number };

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
  prefixRule?: NativePrefixRule;
  target: NativeRichTextTarget;
};

type NativeTextEdit = { from: number; insertedText: string; to: number };

/** Infer the replaced range, preferring the selection captured before input. */
export function inferNativeTextEdit(
  before: string,
  after: string,
  selection: NativeTextSelection,
): NativeTextEdit {
  const start = clamp(selection.start, 0, before.length);
  const end = clamp(selection.end, start, before.length);
  const insertedLength = after.length - (before.length - (end - start));
  if (
    insertedLength >= 0 &&
    after.slice(0, start) === before.slice(0, start) &&
    after.slice(start + insertedLength) === before.slice(end)
  ) {
    return {
      from: start,
      insertedText: after.slice(start, start + insertedLength),
      to: end,
    };
  }
  let from = 0;
  while (from < before.length && before[from] === after[from]) {
    from += 1;
  }
  let suffix = 0;
  while (
    suffix < before.length - from &&
    suffix < after.length - from &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return {
    from,
    insertedText: after.slice(from, after.length - suffix),
    to: before.length - suffix,
  };
}

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
  if (prefix) {
    return applyPrefixRule(doc, blockIndex, edit, prefix);
  }
  const inline = inlineRuleFor(current, before, edit);
  const base = deleteRange(doc, position, {
    block: blockIndex,
    offset: edit.to,
  });
  const inserted = insertNativeText(base, position, edit.insertedText, marks);
  if (!inline || inserted.target.block !== blockIndex) {
    return inserted;
  }
  const text = nativeBlockText(inserted.document[blockIndex]);
  const content = text.slice(inline.contentFrom, inline.contentTo);
  const triggerFrom = { block: blockIndex, offset: inline.triggerFrom };
  let formatted = deleteRange(inserted.document, triggerFrom, {
    block: blockIndex,
    offset: inline.triggerTo,
  });
  formatted = insertText(formatted, triggerFrom, content);
  formatted = toggleMarkInRange(
    formatted,
    triggerFrom,
    {
      block: blockIndex,
      offset: inline.triggerFrom + content.length,
    },
    inline.mark,
  );
  return editResult(formatted, blockIndex, inline.triggerFrom + content.length);
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
  doc: RichTextDocument,
  block: number,
  edit: NativeTextEdit,
  rule: NonNullable<ReturnType<typeof matchPrefixInputRule>>,
): NativeRichTextEditResult {
  const from = Math.max(0, edit.from - rule.deleteTriggerLength);
  const cleared = deleteRange(
    doc,
    { block, offset: from },
    { block, offset: edit.to },
  );
  if (rule.type === "divider") {
    const next = insertBlocks(cleared, { block, offset: 0 }, [
      { type: "divider" },
    ]);
    return editResult(next, block + 1, 0);
  }
  return {
    document: turnInto(cleared, block, rule.value),
    prefixRule: { block, literal: rule.literal },
    target: collapsedTarget(block, 0),
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
