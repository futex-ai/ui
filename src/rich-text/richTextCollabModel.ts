/**
 * Pure projection of the collaboration overlay onto the block document. Given
 * suggestions, comment threads, and presence expressed as document ranges, it
 * returns, per block, a tiling of non-overlapping runs plus the remote caret
 * offsets — everything a renderer needs and nothing platform-specific.
 */
import type {
  RichTextCommentThread,
  RichTextPresence,
  RichTextRange,
  RichTextSuggestion,
  RichTextSuggestionKind,
} from "./richTextCollabTypes";
import type { DocPosition, RichTextBlock } from "./richTextModel";
import {
  blockTextLength,
  normalizeDocument,
  sliceSpans,
} from "./richTextModel";

/** The tracked change covering a run of text. */
export type RichTextSuggestionMark = {
  authorId: string;
  id: string;
  kind: RichTextSuggestionKind;
};

/** A remote caret sitting at one offset in a block. */
export type RichTextCaretMark = { collaboratorId: string; offset: number };

/**
 * One contiguous run of a block's plain text that shares a decoration set.
 * Runs tile the block from 0 to its text length with no gaps or overlaps, so a
 * renderer can walk them in order and slice the block's spans by `from`/`to`.
 */
export type RichTextAnnotatedRun = {
  /** Set when one of `commentThreadIds` is the active thread. */
  activeCommentThreadId: string | null;
  /** Threads anchored over this run, in the order they were supplied. */
  commentThreadIds: readonly string[];
  from: number;
  /** Collaborators whose live selection covers this run. */
  presenceIds: readonly string[];
  /** The tracked change covering this run, if any. */
  suggestion: RichTextSuggestionMark | null;
  to: number;
};

/** The collaboration decorations that apply to a single block. */
export type RichTextBlockAnnotations = {
  carets: readonly RichTextCaretMark[];
  runs: readonly RichTextAnnotatedRun[];
};

/** Overlay inputs projected onto a document. */
export type RichTextAnnotationInput = {
  activeCommentThreadId?: string | null;
  commentThreads?: readonly RichTextCommentThread[];
  /** Presence entry for this id is skipped: nobody sees their own remote caret. */
  localCollaboratorId?: string;
  presence?: readonly RichTextPresence[];
  suggestions?: readonly RichTextSuggestion[];
};

type BlockSpan = { from: number; to: number };

/** Whether any overlay input would draw something. */
export function hasRichTextAnnotations(
  input: RichTextAnnotationInput | null | undefined,
): boolean {
  if (!input) return false;
  return (
    (input.suggestions?.length ?? 0) > 0 ||
    (input.commentThreads?.length ?? 0) > 0 ||
    (input.presence?.length ?? 0) > 0
  );
}

/**
 * Project the overlay onto every block of `document`, in block order. Only
 * pending suggestions and unresolved threads decorate text; the rest are the
 * caller's history to keep and are ignored here.
 */
export function annotateRichTextDocument(
  document: readonly RichTextBlock[],
  input: RichTextAnnotationInput,
): RichTextBlockAnnotations[] {
  const doc = normalizeDocument(document);
  const suggestions = (input.suggestions ?? []).filter(
    (suggestion) => (suggestion.status ?? "pending") === "pending",
  );
  const threads = (input.commentThreads ?? []).filter(
    (thread) => !thread.resolved,
  );
  const presence = (input.presence ?? []).filter(
    (entry) => entry.collaboratorId !== input.localCollaboratorId,
  );
  return doc.map((block, index) =>
    annotateBlock(blockTextLength(block), index, {
      activeCommentThreadId: input.activeCommentThreadId ?? null,
      presence,
      suggestions,
      threads,
    }),
  );
}

function annotateBlock(
  length: number,
  index: number,
  overlay: {
    activeCommentThreadId: string | null;
    presence: readonly RichTextPresence[];
    suggestions: readonly RichTextSuggestion[];
    threads: readonly RichTextCommentThread[];
  },
): RichTextBlockAnnotations {
  const suggestions = overlay.suggestions
    .map((suggestion) => ({
      span: clipRangeToBlock(suggestion.range, index, length),
      suggestion,
    }))
    .filter(
      (entry): entry is { span: BlockSpan; suggestion: RichTextSuggestion } =>
        entry.span !== null && entry.span.from < entry.span.to,
    );
  const threads = overlay.threads
    .map((thread) => ({
      span: clipRangeToBlock(thread.range, index, length),
      thread,
    }))
    .filter(
      (entry): entry is { span: BlockSpan; thread: RichTextCommentThread } =>
        entry.span !== null && entry.span.from < entry.span.to,
    );
  const selections = overlay.presence
    .map((entry) => ({
      entry,
      span: clipRangeToBlock(entry.selection, index, length),
    }))
    .filter(
      (item): item is { entry: RichTextPresence; span: BlockSpan } =>
        item.span !== null && item.span.from < item.span.to,
    );
  const carets = overlay.presence.flatMap((entry) => {
    const caret = orderRange(entry.selection).to;
    if (caret.block !== index) return [];
    return [
      {
        collaboratorId: entry.collaboratorId,
        offset: clamp(caret.offset, 0, length),
      },
    ];
  });

  const boundaries = new Set<number>([0, length]);
  for (const { span } of [...suggestions, ...threads, ...selections]) {
    boundaries.add(span.from);
    boundaries.add(span.to);
  }
  // Carets must land on a run boundary so a renderer can emit them between
  // runs instead of splitting a run's text a second time.
  for (const caret of carets) boundaries.add(caret.offset);

  const points = [...boundaries].sort((left, right) => left - right);
  const runs: RichTextAnnotatedRun[] = [];
  for (let point = 0; point + 1 < points.length; point += 1) {
    const from = points[point];
    const to = points[point + 1];
    const commentThreadIds = threads
      .filter(({ span }) => covers(span, from, to))
      .map(({ thread }) => thread.id);
    runs.push({
      activeCommentThreadId:
        overlay.activeCommentThreadId !== null &&
        commentThreadIds.includes(overlay.activeCommentThreadId)
          ? overlay.activeCommentThreadId
          : null,
      commentThreadIds,
      from,
      presenceIds: selections
        .filter(({ span }) => covers(span, from, to))
        .map(({ entry }) => entry.collaboratorId),
      suggestion: pickSuggestion(
        suggestions
          .filter(({ span }) => covers(span, from, to))
          .map(({ suggestion }) => suggestion),
      ),
      to,
    });
  }
  return { carets, runs };
}

/**
 * Overlapping tracked changes collapse to one mark per run: a deletion wins
 * over an insertion because the stronger claim on the text is that it is
 * leaving, and ties break on id so the result never depends on array order.
 */
function pickSuggestion(
  candidates: readonly RichTextSuggestion[],
): RichTextSuggestionMark | null {
  let chosen: RichTextSuggestion | null = null;
  for (const candidate of candidates) {
    if (!chosen) {
      chosen = candidate;
      continue;
    }
    if (candidate.kind === chosen.kind) {
      if (candidate.id < chosen.id) chosen = candidate;
      continue;
    }
    if (candidate.kind === "delete") chosen = candidate;
  }
  return chosen
    ? { authorId: chosen.authorId, id: chosen.id, kind: chosen.kind }
    : null;
}

function covers(span: BlockSpan, from: number, to: number): boolean {
  return span.from <= from && span.to >= to;
}

/**
 * Narrow a document range to one block's plain-text offsets. Blocks fully
 * inside a multi-block range are covered end to end; blocks outside it return
 * `null`.
 */
export function clipRangeToBlock(
  range: RichTextRange,
  index: number,
  length: number,
): BlockSpan | null {
  const { from, to } = orderRange(range);
  if (index < from.block || index > to.block) return null;
  return {
    from: index === from.block ? clamp(from.offset, 0, length) : 0,
    to: index === to.block ? clamp(to.offset, 0, length) : length,
  };
}

/** Return the range with its endpoints in document order. */
export function orderRange(range: RichTextRange): RichTextRange {
  return comparePositions(range.from, range.to) <= 0
    ? range
    : { from: range.to, to: range.from };
}

/** Compare two document positions: negative when `left` comes first. */
export function comparePositions(
  left: DocPosition,
  right: DocPosition,
): number {
  return left.block === right.block
    ? left.offset - right.offset
    : left.block - right.block;
}

/**
 * Plain text a range covers, with a newline between blocks. Used for the rail
 * card previews so a caller does not have to carry a copy of the changed text.
 */
export function richTextRangeText(
  document: readonly RichTextBlock[],
  range: RichTextRange,
): string {
  const doc = normalizeDocument(document);
  const { from, to } = orderRange(range);
  const parts: string[] = [];
  for (
    let index = Math.max(0, from.block);
    index <= Math.min(to.block, doc.length - 1);
    index += 1
  ) {
    const block = doc[index];
    const span = clipRangeToBlock(range, index, blockTextLength(block));
    if (!span) continue;
    parts.push(blockRangeText(block, span.from, span.to));
  }
  return parts.join("\n");
}

function blockRangeText(
  block: RichTextBlock,
  from: number,
  to: number,
): string {
  if (block.type === "divider") return "";
  if (block.type === "codeBlock") return block.code.slice(from, to);
  return sliceSpans(block.spans, from, to)
    .map((span) => span.text)
    .join("");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
