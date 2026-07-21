/** Pure toolbar and Backspace actions for the native rich-text editor. */
import {
  blockTextLength,
  insertText,
  mergeBackward,
  normalizeDocument,
  turnInto,
} from "./richTextModel";
import type {
  RichTextBlock,
  RichTextDocument,
  RichTextTurnIntoType,
} from "./richTextModel";
import type {
  NativePrefixRule,
  NativeRichTextEditResult,
  NativeRichTextTarget,
} from "./nativeRichTextEditing";
import type { NativeTextSelection } from "./nativeTextEdit";

/** Apply Backspace-at-block-start and return the post-merge caret target. */
export function mergeNativeBlockBackward(
  document: readonly RichTextBlock[],
  block: number,
): NativeRichTextEditResult {
  const doc = normalizeDocument(document);
  const index = clamp(block, 0, doc.length - 1);
  const current = doc[index];
  const sameBlock = isDemotedAtStart(current) || index === 0;
  const previous = doc[index - 1];
  const targetBlock = sameBlock ? index : index - 1;
  const offset =
    sameBlock || previous?.type === "divider" ? 0 : blockTextLength(previous);
  return editResult(
    mergeBackward(doc, { block: index, offset: 0 }),
    targetBlock,
    offset,
  );
}

/** Insert an empty block after the active block and focus it. */
export function insertNativeBlockAfter(
  document: readonly RichTextBlock[],
  block: number,
  type: RichTextTurnIntoType | "divider" = "paragraph",
): NativeRichTextEditResult {
  const doc = normalizeDocument(document);
  const index = clamp(block, 0, doc.length - 1);
  const inserted =
    type === "divider"
      ? ([{ type: "divider" }, emptyBlock("paragraph")] as const)
      : [emptyBlock(type)];
  const next = normalizeDocument([
    ...doc.slice(0, index + 1),
    ...inserted,
    ...doc.slice(index + 1),
  ]);
  return editResult(next, index + inserted.length, 0);
}

/** Convert one native block while retaining and clamping its selection. */
export function turnNativeBlockInto(
  document: readonly RichTextBlock[],
  block: number,
  type: RichTextTurnIntoType,
  selection: NativeTextSelection = { end: 0, start: 0 },
): NativeRichTextEditResult {
  const next = turnInto(document, block, type);
  const index = clamp(block, 0, next.length - 1);
  const length = blockTextLength(next[index]);
  return {
    document: next,
    target: {
      block: index,
      selection: {
        end: clamp(selection.end, 0, length),
        start: clamp(selection.start, 0, length),
      },
    },
  };
}

/** Toggle a checklist block without changing other document content. */
export function toggleNativeChecklist(
  document: readonly RichTextBlock[],
  block: number,
): RichTextDocument {
  const doc = normalizeDocument(document);
  return doc.map((entry, index) =>
    index === block && entry.type === "check"
      ? { ...entry, checked: !entry.checked }
      : entry,
  );
}

/** Restore the literal text from the most recent native prefix shortcut. */
export function restoreNativePrefix(
  document: readonly RichTextBlock[],
  rule: NativePrefixRule,
): NativeRichTextEditResult {
  const paragraph = turnInto(document, rule.block, "paragraph");
  const next = insertText(
    paragraph,
    {
      block: rule.block,
      offset: 0,
    },
    rule.literal,
  );
  return editResult(next, rule.block, rule.literal.length);
}

function emptyBlock(type: RichTextTurnIntoType): RichTextBlock {
  if (type === "check") return { checked: false, spans: [], type };
  if (type === "codeBlock") return { code: "", type };
  return { spans: [], type };
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

function isDemotedAtStart(block: RichTextBlock): boolean {
  return (
    block.type === "bullet" ||
    block.type === "numbered" ||
    block.type === "check" ||
    block.type === "quote" ||
    block.type === "codeBlock"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
