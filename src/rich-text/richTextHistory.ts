/** Pure undo/redo stack helpers for RichTextEditor. */
import {
  DocPosition,
  DocSelection,
  RichTextDocument,
  blockTextLength,
  normalizeDocument,
} from "./richTextModel";

/** Maximum undo or redo snapshots retained by the editor. */
export const RICH_TEXT_HISTORY_LIMIT = 200;

/** Native typing edits within this window share one undo snapshot. */
export const RICH_TEXT_TYPING_WINDOW_MS = 1000;

/** Edit categories used to decide whether a snapshot should be coalesced. */
export type RichTextHistoryEditKind = "model" | "typing";

/** Document snapshot restored by history traversal. */
export type RichTextHistorySnapshot = {
  caret: DocSelection;
  doc: RichTextDocument;
};

/** Immutable history stack state. */
export type RichTextHistoryState = {
  lastEditKind: RichTextHistoryEditKind | "history" | null;
  lastPushAt: number | null;
  redoStack: readonly RichTextHistorySnapshot[];
  undoStack: readonly RichTextHistorySnapshot[];
};

/** Result returned by an undo or redo traversal. */
export type RichTextHistoryTransition = {
  history: RichTextHistoryState;
  snapshot: RichTextHistorySnapshot;
};

/** Create an empty history stack. */
export function createRichTextHistoryState(): RichTextHistoryState {
  return {
    lastEditKind: null,
    lastPushAt: null,
    redoStack: [],
    undoStack: [],
  };
}

/** Record a pre-edit snapshot, coalescing rapid native typing. */
export function recordRichTextHistory(
  state: RichTextHistoryState,
  snapshot: RichTextHistorySnapshot,
  kind: RichTextHistoryEditKind,
  now: number,
): RichTextHistoryState {
  const shouldPush =
    kind === "model" ||
    state.lastEditKind !== "typing" ||
    state.lastPushAt === null ||
    now - state.lastPushAt > RICH_TEXT_TYPING_WINDOW_MS;
  return {
    lastEditKind: kind,
    lastPushAt: shouldPush ? now : state.lastPushAt,
    redoStack: [],
    undoStack: shouldPush
      ? pushCapped(state.undoStack, normalizeSnapshot(snapshot))
      : state.undoStack,
  };
}

/** Move one undo snapshot into place, pushing the current state onto redo. */
export function undoRichTextHistory(
  state: RichTextHistoryState,
  current: RichTextHistorySnapshot,
): RichTextHistoryTransition | null {
  const snapshot = state.undoStack[state.undoStack.length - 1];
  if (!snapshot) {
    return null;
  }
  return {
    history: {
      lastEditKind: "history",
      lastPushAt: state.lastPushAt,
      redoStack: pushCapped(state.redoStack, normalizeSnapshot(current)),
      undoStack: state.undoStack.slice(0, -1),
    },
    snapshot,
  };
}

/** Move one redo snapshot into place, pushing the current state onto undo. */
export function redoRichTextHistory(
  state: RichTextHistoryState,
  current: RichTextHistorySnapshot,
): RichTextHistoryTransition | null {
  const snapshot = state.redoStack[state.redoStack.length - 1];
  if (!snapshot) {
    return null;
  }
  return {
    history: {
      lastEditKind: "history",
      lastPushAt: state.lastPushAt,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: pushCapped(state.undoStack, normalizeSnapshot(current)),
    },
    snapshot,
  };
}

/** Build a collapsed caret selection. */
export function collapsedHistoryCaret(position: DocPosition): DocSelection {
  return { from: position, to: position };
}

function pushCapped(
  stack: readonly RichTextHistorySnapshot[],
  snapshot: RichTextHistorySnapshot,
): RichTextHistorySnapshot[] {
  const next = [...stack, snapshot];
  return next.length > RICH_TEXT_HISTORY_LIMIT
    ? next.slice(next.length - RICH_TEXT_HISTORY_LIMIT)
    : next;
}

function normalizeSnapshot(
  snapshot: RichTextHistorySnapshot,
): RichTextHistorySnapshot {
  const doc = normalizeDocument(snapshot.doc);
  return { caret: normalizeCaret(doc, snapshot.caret), doc };
}

function normalizeCaret(
  doc: RichTextDocument,
  caret: DocSelection,
): DocSelection {
  const from = clampPosition(doc, caret.from);
  const to = clampPosition(doc, caret.to);
  return comparePosition(from, to) <= 0 ? { from, to } : { from: to, to: from };
}

function clampPosition(
  doc: RichTextDocument,
  position: DocPosition,
): DocPosition {
  const block = Math.min(Math.max(position.block, 0), doc.length - 1);
  return {
    block,
    offset: Math.min(Math.max(position.offset, 0), blockTextLength(doc[block])),
  };
}

function comparePosition(left: DocPosition, right: DocPosition): number {
  if (left.block !== right.block) {
    return left.block - right.block;
  }
  return left.offset - right.offset;
}
