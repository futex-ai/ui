/** Pure block document model and structural operations for RichTextEditor. */
import { devWarn } from "../devWarn";

/** Inline text mark names stored in canonical nesting order. */
export type InlineMark = "bold" | "italic" | "strike" | "code";

/** Run of text sharing one mark set. `text` may contain `"\n"` soft breaks. */
export type InlineSpan = { marks: readonly InlineMark[]; text: string };

/** Rich-text block variants supported by the M1 editor. */
export type RichTextBlock =
  | {
      spans: InlineSpan[];
      type:
        | "paragraph"
        | "heading1"
        | "heading2"
        | "heading3"
        | "bullet"
        | "numbered"
        | "quote";
    }
  | { checked: boolean; spans: InlineSpan[]; type: "check" }
  | { code: string; type: "codeBlock" }
  | { type: "divider" };

/** Ordered list of rich-text blocks. Normalization guarantees it is non-empty. */
export type RichTextDocument = RichTextBlock[];

/** Caret or selection endpoint: block index plus plain-text offset. */
export type DocPosition = { block: number; offset: number };

/** Ordered document selection endpoints. Collapsed selections have equal ends. */
export type DocSelection = { from: DocPosition; to: DocPosition };

/** Text block type accepted by `turnInto`. Dividers are inserted, not converted. */
export type RichTextTurnIntoType = Exclude<RichTextBlock["type"], "divider">;

const MARK_ORDER: readonly InlineMark[] = ["bold", "italic", "strike", "code"];
const TEXT_TYPES = new Set<RichTextBlock["type"]>([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bullet",
  "numbered",
  "quote",
  "check",
]);

/** Empty canonical document used by uncontrolled editors and blank markdown. */
export function emptyDocument(): RichTextDocument {
  return [{ spans: [], type: "paragraph" }];
}

/** Return the plain text represented by a span list. */
export function spansText(spans: readonly InlineSpan[]): string {
  return spans.map((span) => span.text).join("");
}

/** Split a span list at a plain-text offset, preserving marks on both sides. */
export function splitSpans(
  spans: readonly InlineSpan[],
  offset: number,
): [InlineSpan[], InlineSpan[]] {
  const target = clamp(offset, 0, spansText(spans).length);
  const before: InlineSpan[] = [];
  const after: InlineSpan[] = [];
  let cursor = 0;
  for (const span of normalizeSpans(spans)) {
    const next = cursor + span.text.length;
    if (next <= target) {
      before.push(span);
    } else if (cursor >= target) {
      after.push(span);
    } else {
      const split = target - cursor;
      before.push({ marks: span.marks, text: span.text.slice(0, split) });
      after.push({ marks: span.marks, text: span.text.slice(split) });
    }
    cursor = next;
  }
  return [normalizeSpans(before), normalizeSpans(after)];
}

/** Return a normalized slice of a span list over plain-text offsets. */
export function sliceSpans(
  spans: readonly InlineSpan[],
  from: number,
  to: number,
): InlineSpan[] {
  const textLength = spansText(spans).length;
  const start = clamp(Math.min(from, to), 0, textLength);
  const end = clamp(Math.max(from, to), 0, textLength);
  const [, tail] = splitSpans(spans, start);
  const [slice] = splitSpans(tail, end - start);
  return slice;
}

/** Enforce model invariants: non-empty docs, canonical marks, merged spans. */
export function normalizeDocument(
  document: readonly RichTextBlock[],
): RichTextDocument {
  const blocks = document.map(normalizeBlock);
  const normalized = blocks.length === 0 ? emptyDocument() : blocks;
  if (normalized[normalized.length - 1]?.type === "divider") {
    normalized.push({ spans: [], type: "paragraph" });
  }
  return normalized;
}

/** Whether two documents contain the same canonical blocks and inline spans. */
export function richTextDocumentsEqual(
  left: readonly RichTextBlock[],
  right: readonly RichTextBlock[],
): boolean {
  const leftDocument = normalizeDocument(left);
  const rightDocument = normalizeDocument(right);
  return (
    leftDocument.length === rightDocument.length &&
    leftDocument.every((block, index) =>
      richTextBlocksEqual(block, rightDocument[index]),
    )
  );
}

function richTextBlocksEqual(
  left: RichTextBlock,
  right: RichTextBlock,
): boolean {
  if (left.type !== right.type) return false;
  if (left.type === "divider") return true;
  if (left.type === "codeBlock") {
    return right.type === "codeBlock" && left.code === right.code;
  }
  if (right.type === "divider" || right.type === "codeBlock") return false;
  const sameCheckState =
    left.type !== "check" ||
    (right.type === "check" && left.checked === right.checked);
  return sameCheckState && richTextSpansEqual(left.spans, right.spans);
}

function richTextSpansEqual(
  left: readonly InlineSpan[],
  right: readonly InlineSpan[],
): boolean {
  return (
    left.length === right.length &&
    left.every((span, index) => {
      const other = right[index];
      if (!other) return false;
      return (
        span.text === other.text &&
        span.marks.length === other.marks.length &&
        span.marks.every((mark, markIndex) => mark === other.marks[markIndex])
      );
    })
  );
}

/** Split a block with Enter semantics. */
export function splitBlock(
  document: readonly RichTextBlock[],
  position: DocPosition,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const index = clamp(position.block, 0, doc.length - 1);
  const block = doc[index];
  if (block.type === "divider") {
    return normalizeDocument([
      ...doc.slice(0, index + 1),
      { spans: [], type: "paragraph" },
      ...doc.slice(index + 1),
    ]);
  }
  const offset = clamp(position.offset, 0, blockTextLength(block));
  if (block.type === "codeBlock") {
    if (offset === block.code.length && block.code.endsWith("\n")) {
      return normalizeDocument([
        ...doc.slice(0, index),
        { code: block.code.slice(0, -1), type: "codeBlock" },
        { spans: [], type: "paragraph" },
        ...doc.slice(index + 1),
      ]);
    }
    return normalizeDocument([
      ...doc.slice(0, index),
      {
        code: `${block.code.slice(0, offset)}\n${block.code.slice(offset)}`,
        type: "codeBlock",
      },
      ...doc.slice(index + 1),
    ]);
  }
  if (isExitOnEmpty(block) && spansText(block.spans).length === 0) {
    return normalizeDocument([
      ...doc.slice(0, index),
      { spans: [], type: "paragraph" },
      ...doc.slice(index + 1),
    ]);
  }
  const [before, after] = splitSpans(block.spans, offset);
  return normalizeDocument([
    ...doc.slice(0, index),
    withSpans(block, before),
    continuationBlock(block, after),
    ...doc.slice(index + 1),
  ]);
}

/** Insert a soft line break at the position. */
export function insertSoftBreak(
  document: readonly RichTextBlock[],
  position: DocPosition,
): RichTextDocument {
  return insertText(document, position, "\n");
}

/** Apply Backspace-at-block-start semantics. */
export function mergeBackward(
  document: readonly RichTextBlock[],
  position: DocPosition,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const index = clamp(position.block, 0, doc.length - 1);
  const block = doc[index];
  if (
    block.type === "divider" ||
    clamp(position.offset, 0, blockTextLength(block)) > 0
  ) {
    return doc;
  }
  if (isDemotable(block)) {
    return normalizeDocument([
      ...doc.slice(0, index),
      { spans: block.spans, type: "paragraph" },
      ...doc.slice(index + 1),
    ]);
  }
  if (block.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, index),
      {
        spans: block.code ? [{ marks: [], text: block.code }] : [],
        type: "paragraph",
      },
      ...doc.slice(index + 1),
    ]);
  }
  if (index === 0) {
    return doc;
  }
  const previous = doc[index - 1];
  if (previous.type === "divider") {
    return normalizeDocument([...doc.slice(0, index - 1), ...doc.slice(index)]);
  }
  if (previous.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, index - 1),
      { code: previous.code + spansText(block.spans), type: "codeBlock" },
      ...doc.slice(index + 1),
    ]);
  }
  if (isTextBlock(previous)) {
    return normalizeDocument([
      ...doc.slice(0, index - 1),
      withSpans(previous, [...previous.spans, ...block.spans]),
      ...doc.slice(index + 1),
    ]);
  }
  return doc;
}

/** Apply Delete-at-block-end semantics. */
export function deleteForward(
  document: readonly RichTextBlock[],
  position: DocPosition,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const index = clamp(position.block, 0, doc.length - 1);
  const block = doc[index];
  if (block.type === "divider") {
    return doc;
  }
  const offset = clamp(position.offset, 0, blockTextLength(block));
  if (offset < blockTextLength(block)) {
    return doc;
  }
  if (isDemotable(block)) {
    return normalizeDocument([
      ...doc.slice(0, index),
      { spans: block.spans, type: "paragraph" },
      ...doc.slice(index + 1),
    ]);
  }
  if (block.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, index),
      {
        spans: block.code ? [{ marks: [], text: block.code }] : [],
        type: "paragraph",
      },
      ...doc.slice(index + 1),
    ]);
  }
  if (index >= doc.length - 1) {
    return doc;
  }
  const next = doc[index + 1];
  if (next.type === "divider") {
    return normalizeDocument([
      ...doc.slice(0, index + 1),
      ...doc.slice(index + 2),
    ]);
  }
  if (next.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, index),
      withSpans(block, [
        ...block.spans,
        ...(next.code ? [{ marks: [], text: next.code } as InlineSpan] : []),
      ]),
      ...doc.slice(index + 2),
    ]);
  }
  if (isTextBlock(next)) {
    return normalizeDocument([
      ...doc.slice(0, index),
      withSpans(block, [...block.spans, ...next.spans]),
      ...doc.slice(index + 2),
    ]);
  }
  return doc;
}

/** Delete a plain-text range that may cross block boundaries. */
export function deleteRange(
  document: readonly RichTextBlock[],
  from: DocPosition,
  to: DocPosition,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const [start, end] = orderedPositions(doc, from, to);
  if (start.block === end.block) {
    return deleteWithinBlock(doc, start, end);
  }
  const head = headBlock(doc[start.block], start.offset);
  const tail = tailBlock(doc[end.block], end.offset);
  const middle = mergeSelectionEdges(head, tail);
  return normalizeDocument([
    ...doc.slice(0, start.block),
    ...middle,
    ...doc.slice(end.block + 1),
  ]);
}

/** Insert plain text at a collapsed position. */
export function insertText(
  document: readonly RichTextBlock[],
  position: DocPosition,
  text: string,
): RichTextDocument {
  if (text.length === 0) {
    return normalizeDocument(document);
  }
  const doc = normalizeDocument(document);
  const index = clamp(position.block, 0, doc.length - 1);
  const block = doc[index];
  const offset = clamp(position.offset, 0, blockTextLength(block));
  if (block.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, index),
      {
        code: `${block.code.slice(0, offset)}${text}${block.code.slice(offset)}`,
        type: "codeBlock",
      },
      ...doc.slice(index + 1),
    ]);
  }
  if (isTextBlock(block)) {
    const [before, after] = splitSpans(block.spans, offset);
    return normalizeDocument([
      ...doc.slice(0, index),
      withSpans(block, [...before, { marks: [], text }, ...after]),
      ...doc.slice(index + 1),
    ]);
  }
  return normalizeDocument([
    ...doc.slice(0, index),
    { spans: [{ marks: [], text }], type: "paragraph" },
    ...doc.slice(index + 1),
  ]);
}

/** Insert rich blocks at a collapsed position, used by paste and divider rules. */
export function insertBlocks(
  document: readonly RichTextBlock[],
  position: DocPosition,
  blocks: readonly RichTextBlock[],
): RichTextDocument {
  const inserted = normalizeDocument(blocks);
  const doc = normalizeDocument(document);
  const index = clamp(position.block, 0, doc.length - 1);
  const block = doc[index];
  const offset = clamp(position.offset, 0, blockTextLength(block));
  if (isEmptyTextBlock(block)) {
    return normalizeDocument([
      ...doc.slice(0, index),
      ...inserted,
      ...doc.slice(index + 1),
    ]);
  }
  const head = headBlock(block, offset);
  const tail = tailBlock(block, offset);
  return normalizeDocument([
    ...doc.slice(0, index),
    ...(head ? [head] : []),
    ...inserted,
    ...(tail ? [tail] : []),
    ...doc.slice(index + 1),
  ]);
}

/** Convert a block to another text/code/list type. Dividers are not accepted. */
export function turnInto(
  document: readonly RichTextBlock[],
  index: number,
  type: RichTextTurnIntoType | "divider",
): RichTextDocument {
  if (type === "divider") {
    devWarn(
      'RichTextEditor: `turnInto(..., "divider")` is invalid; insert a divider block instead.',
    );
    return normalizeDocument(document);
  }
  const doc = normalizeDocument(document);
  const blockIndex = clamp(index, 0, doc.length - 1);
  const block = doc[blockIndex];
  if (block.type === "divider") {
    return normalizeDocument([
      ...doc.slice(0, blockIndex),
      emptyBlock(type),
      ...doc.slice(blockIndex + 1),
    ]);
  }
  if (block.type === type) {
    return doc;
  }
  const next =
    type === "codeBlock"
      ? ({ code: blockPlainText(block), type } as RichTextBlock)
      : ({ ...emptyBlock(type), spans: blockToSpans(block) } as RichTextBlock);
  return normalizeDocument([
    ...doc.slice(0, blockIndex),
    next,
    ...doc.slice(blockIndex + 1),
  ]);
}

/** Toggle an inline mark across a plain-text range. */
export function toggleMarkInRange(
  document: readonly RichTextBlock[],
  from: DocPosition,
  to: DocPosition,
  mark: InlineMark,
): RichTextDocument {
  const doc = normalizeDocument(document);
  const [start, end] = orderedPositions(doc, from, to);
  if (samePosition(start, end)) {
    return doc;
  }
  const ranges = selectedTextRanges(doc, start, end);
  if (ranges.length === 0) {
    return doc;
  }
  const remove = ranges.every(({ block, from: blockFrom, to: blockTo }) => {
    const target = doc[block];
    return (
      isTextBlock(target) &&
      everySpanCharacterHasMark(
        sliceSpans(target.spans, blockFrom, blockTo),
        mark,
      )
    );
  });
  return normalizeDocument(
    doc.map((block, index) => {
      const range = ranges.find((entry) => entry.block === index);
      return range
        ? markTextBlock(block, range.from, range.to, mark, remove)
        : block;
    }),
  );
}

/** Return the plain-text length of a block. */
export function blockTextLength(block: RichTextBlock): number {
  if (block.type === "divider") {
    return 0;
  }
  if (block.type === "codeBlock") {
    return block.code.length;
  }
  return spansText(block.spans).length;
}

/** Whether a block is one empty paragraph, the editor's placeholder state. */
export function isEmptyDocument(document: readonly RichTextBlock[]): boolean {
  const doc = normalizeDocument(document);
  return (
    doc.length === 1 && isEmptyTextBlock(doc[0]) && doc[0].type === "paragraph"
  );
}

function normalizeBlock(block: RichTextBlock): RichTextBlock {
  switch (block.type) {
    case "check":
      return {
        checked: Boolean(block.checked),
        spans: normalizeSpans(block.spans),
        type: "check",
      };
    case "codeBlock":
      return { code: block.code, type: "codeBlock" };
    case "divider":
      return { type: "divider" };
    default:
      return { spans: normalizeSpans(block.spans), type: block.type };
  }
}

function normalizeSpans(spans: readonly InlineSpan[]): InlineSpan[] {
  const normalized: InlineSpan[] = [];
  for (const span of spans) {
    if (span.text.length === 0) {
      continue;
    }
    const marks = canonicalMarks(span.marks);
    const previous = normalized[normalized.length - 1];
    if (previous && sameMarks(previous.marks, marks)) {
      normalized[normalized.length - 1] = {
        marks,
        text: previous.text + span.text,
      };
    } else {
      normalized.push({ marks, text: span.text });
    }
  }
  return normalized;
}

function canonicalMarks(marks: readonly InlineMark[]): InlineMark[] {
  const set = new Set(marks);
  return MARK_ORDER.filter((mark) => set.has(mark));
}

function sameMarks(left: readonly InlineMark[], right: readonly InlineMark[]) {
  return (
    left.length === right.length &&
    left.every((mark, index) => mark === right[index])
  );
}

function continuationBlock(
  block: RichTextBlock,
  spans: InlineSpan[],
): RichTextBlock {
  switch (block.type) {
    case "bullet":
    case "numbered":
      return { spans, type: block.type };
    case "check":
      return { checked: false, spans, type: "check" };
    default:
      return { spans, type: "paragraph" };
  }
}

function emptyBlock(type: RichTextTurnIntoType): RichTextBlock {
  if (type === "check") {
    return { checked: false, spans: [], type };
  }
  if (type === "codeBlock") {
    return { code: "", type };
  }
  return { spans: [], type };
}

function blockToSpans(block: RichTextBlock): InlineSpan[] {
  if (block.type === "divider") {
    return [];
  }
  if (block.type === "codeBlock") {
    return block.code ? [{ marks: [], text: block.code }] : [];
  }
  return block.spans;
}

function blockPlainText(block: RichTextBlock): string {
  return block.type === "codeBlock"
    ? block.code
    : block.type === "divider"
      ? ""
      : spansText(block.spans);
}

function withSpans(block: RichTextBlock, spans: InlineSpan[]): RichTextBlock {
  if (block.type === "check") {
    return { checked: block.checked, spans, type: "check" };
  }
  if (isTextBlock(block)) {
    return { spans, type: block.type };
  }
  return block;
}

function isTextBlock(
  block: RichTextBlock,
): block is Extract<RichTextBlock, { spans: InlineSpan[] }> {
  return TEXT_TYPES.has(block.type);
}

function isEmptyTextBlock(block: RichTextBlock): boolean {
  return isTextBlock(block) && spansText(block.spans).length === 0;
}

function isExitOnEmpty(block: RichTextBlock): boolean {
  return (
    block.type === "bullet" ||
    block.type === "numbered" ||
    block.type === "check" ||
    block.type === "quote"
  );
}

function isDemotable(
  block: RichTextBlock,
): block is Extract<
  RichTextBlock,
  { type: "bullet" | "check" | "numbered" | "quote" }
> {
  return (
    block.type === "bullet" ||
    block.type === "numbered" ||
    block.type === "check" ||
    block.type === "quote"
  );
}

function orderedPositions(
  doc: RichTextDocument,
  from: DocPosition,
  to: DocPosition,
): [DocPosition, DocPosition] {
  const left = clampPosition(doc, from);
  const right = clampPosition(doc, to);
  if (
    left.block < right.block ||
    (left.block === right.block && left.offset <= right.offset)
  ) {
    return [left, right];
  }
  return [right, left];
}

function clampPosition(
  doc: RichTextDocument,
  position: DocPosition,
): DocPosition {
  const block = clamp(position.block, 0, doc.length - 1);
  return {
    block,
    offset: clamp(position.offset, 0, blockTextLength(doc[block])),
  };
}

function samePosition(left: DocPosition, right: DocPosition): boolean {
  return left.block === right.block && left.offset === right.offset;
}

function selectedTextRanges(
  doc: RichTextDocument,
  start: DocPosition,
  end: DocPosition,
): { block: number; from: number; to: number }[] {
  const ranges: { block: number; from: number; to: number }[] = [];
  for (let index = start.block; index <= end.block; index += 1) {
    const block = doc[index];
    if (!isTextBlock(block)) {
      continue;
    }
    const from = index === start.block ? start.offset : 0;
    const to = index === end.block ? end.offset : blockTextLength(block);
    if (from < to) {
      ranges.push({ block: index, from, to });
    }
  }
  return ranges;
}

function everySpanCharacterHasMark(
  spans: readonly InlineSpan[],
  mark: InlineMark,
): boolean {
  return spans.length > 0 && spans.every((span) => span.marks.includes(mark));
}

function markTextBlock(
  block: RichTextBlock,
  from: number,
  to: number,
  mark: InlineMark,
  remove: boolean,
): RichTextBlock {
  if (!isTextBlock(block)) {
    return block;
  }
  const [head, rest] = splitSpans(block.spans, from);
  const [middle, tail] = splitSpans(rest, to - from);
  return withSpans(block, [
    ...head,
    ...middle.map((span) => ({
      marks: remove
        ? span.marks.filter((entry) => entry !== mark)
        : canonicalMarks([...span.marks, mark]),
      text: span.text,
    })),
    ...tail,
  ]);
}

function deleteWithinBlock(
  doc: RichTextDocument,
  start: DocPosition,
  end: DocPosition,
): RichTextDocument {
  const block = doc[start.block];
  if (block.type === "codeBlock") {
    return normalizeDocument([
      ...doc.slice(0, start.block),
      {
        code: block.code.slice(0, start.offset) + block.code.slice(end.offset),
        type: "codeBlock",
      },
      ...doc.slice(start.block + 1),
    ]);
  }
  if (isTextBlock(block)) {
    return normalizeDocument([
      ...doc.slice(0, start.block),
      withSpans(block, [
        ...sliceSpans(block.spans, 0, start.offset),
        ...sliceSpans(block.spans, end.offset, blockTextLength(block)),
      ]),
      ...doc.slice(start.block + 1),
    ]);
  }
  return doc;
}

function headBlock(block: RichTextBlock, offset: number): RichTextBlock | null {
  if (block.type === "divider") {
    return null;
  }
  if (block.type === "codeBlock") {
    return { code: block.code.slice(0, offset), type: "codeBlock" };
  }
  return withSpans(block, sliceSpans(block.spans, 0, offset));
}

function tailBlock(block: RichTextBlock, offset: number): RichTextBlock | null {
  if (block.type === "divider") {
    return null;
  }
  if (block.type === "codeBlock") {
    return { code: block.code.slice(offset), type: "codeBlock" };
  }
  return withSpans(
    block,
    sliceSpans(block.spans, offset, blockTextLength(block)),
  );
}

function mergeSelectionEdges(
  head: RichTextBlock | null,
  tail: RichTextBlock | null,
): RichTextBlock[] {
  if (!head && !tail) {
    return [];
  }
  if (!head) {
    return tail ? [tail] : [];
  }
  if (!tail) {
    return [head];
  }
  if (head.type === "codeBlock") {
    return [{ code: head.code + blockPlainText(tail), type: "codeBlock" }];
  }
  if (isTextBlock(head)) {
    return [
      withSpans(head, [
        ...head.spans,
        ...(tail.type === "codeBlock" && tail.code
          ? [{ marks: [], text: tail.code } as InlineSpan]
          : blockToSpans(tail)),
      ]),
    ];
  }
  return [head, tail];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
