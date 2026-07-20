import assert from "node:assert/strict";
import test from "node:test";

import {
  RICH_TEXT_HISTORY_LIMIT,
  collapsedHistoryCaret,
  createRichTextHistoryState,
  recordRichTextHistory,
  redoRichTextHistory,
  undoRichTextHistory,
} from "../../src/rich-text/richTextHistory";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";

function doc(text: string): RichTextDocument {
  return [{ spans: [{ marks: [], text }], type: "paragraph" }];
}

function snapshot(text: string, offset = text.length) {
  return {
    caret: collapsedHistoryCaret({ block: 0, offset }),
    doc: doc(text),
  };
}

test("records every model edit and clears redo on new edits", () => {
  let history = createRichTextHistoryState();
  history = recordRichTextHistory(history, snapshot("one"), "model", 0);
  let undo = undoRichTextHistory(history, snapshot("two"));
  assert.equal(undo?.snapshot.doc[0]?.type, "paragraph");
  assert.deepEqual(undo?.snapshot, snapshot("one"));
  assert.equal(undo?.history.redoStack.length, 1);

  history = recordRichTextHistory(undo!.history, snapshot("new"), "model", 10);
  assert.equal(history.undoStack.length, 1);
  assert.equal(history.redoStack.length, 0);
});

test("coalesces typing within one second and starts a new burst afterward", () => {
  let history = createRichTextHistoryState();
  history = recordRichTextHistory(history, snapshot(""), "typing", 0);
  history = recordRichTextHistory(history, snapshot("a"), "typing", 500);
  history = recordRichTextHistory(history, snapshot("ab"), "typing", 1000);
  assert.equal(history.undoStack.length, 1);

  history = recordRichTextHistory(history, snapshot("abc"), "typing", 1001);
  assert.equal(history.undoStack.length, 2);
});

test("typing after a model edit records a fresh snapshot", () => {
  let history = createRichTextHistoryState();
  history = recordRichTextHistory(history, snapshot("block"), "model", 0);
  history = recordRichTextHistory(history, snapshot("block"), "typing", 100);

  assert.equal(history.undoStack.length, 2);
});

test("undo and redo restore document and caret snapshots", () => {
  let history = createRichTextHistoryState();
  history = recordRichTextHistory(history, snapshot("before", 2), "model", 0);

  const undo = undoRichTextHistory(history, snapshot("after", 5));
  assert.deepEqual(undo?.snapshot, snapshot("before", 2));

  const redo = redoRichTextHistory(undo!.history, snapshot("before", 2));
  assert.deepEqual(redo?.snapshot, snapshot("after", 5));
});

test("history caps undo snapshots at the configured limit", () => {
  let history = createRichTextHistoryState();
  for (let index = 0; index < RICH_TEXT_HISTORY_LIMIT + 5; index += 1) {
    history = recordRichTextHistory(
      history,
      snapshot(String(index)),
      "model",
      index,
    );
  }

  assert.equal(history.undoStack.length, RICH_TEXT_HISTORY_LIMIT);
  assert.deepEqual(history.undoStack[0], snapshot("5"));
});
