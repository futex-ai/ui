import assert from "node:assert/strict";
import test from "node:test";

import {
  annotateRichTextDocument,
  clipRangeToBlock,
  comparePositions,
  hasRichTextAnnotations,
  orderRange,
  richTextRangeText,
} from "../../src/rich-text/richTextCollabModel";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";

const document: RichTextDocument = [
  { spans: [{ marks: [], text: "The quick brown fox" }], type: "paragraph" },
  { spans: [{ marks: [], text: "jumps over" }], type: "paragraph" },
  { code: "const a = 1;", type: "codeBlock" },
];

const position = (block: number, offset: number) => ({ block, offset });
const range = (
  fromBlock: number,
  fromOffset: number,
  toBlock: number,
  toOffset: number,
) => ({
  from: position(fromBlock, fromOffset),
  to: position(toBlock, toOffset),
});

test("runs tile every block from 0 to its text length", () => {
  const annotations = annotateRichTextDocument(document, {
    suggestions: [
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 4, 0, 9) },
    ],
  });

  assert.deepEqual(
    annotations[0].runs.map((run) => [run.from, run.to]),
    [
      [0, 4],
      [4, 9],
      [9, 19],
    ],
  );
  assert.equal(annotations[0].runs[1].suggestion?.id, "s1");
  assert.equal(annotations[0].runs[0].suggestion, null);
  assert.equal(annotations[0].runs[2].suggestion, null);
  // Undecorated blocks still tile, so a renderer never special-cases them.
  assert.deepEqual(
    annotations[1].runs.map((run) => [run.from, run.to]),
    [[0, 10]],
  );
});

test("a range spanning blocks covers the intermediate blocks end to end", () => {
  const annotations = annotateRichTextDocument(document, {
    commentThreads: [{ comments: [], id: "t1", range: range(0, 16, 2, 5) }],
  });

  assert.deepEqual(
    annotations[0].runs
      .filter((run) => run.commentThreadIds.length > 0)
      .map((run) => [run.from, run.to]),
    [[16, 19]],
  );
  assert.deepEqual(
    annotations[1].runs.map((run) => [
      run.from,
      run.to,
      run.commentThreadIds.length,
    ]),
    [[0, 10, 1]],
  );
  assert.deepEqual(
    annotations[2].runs.map((run) => [
      run.from,
      run.to,
      run.commentThreadIds.length,
    ]),
    [
      [0, 5, 1],
      [5, 12, 0],
    ],
  );
});

test("only pending suggestions and unresolved threads decorate text", () => {
  const annotations = annotateRichTextDocument(document, {
    commentThreads: [
      { comments: [], id: "t1", range: range(0, 0, 0, 3), resolved: true },
    ],
    suggestions: [
      {
        authorId: "a",
        id: "s1",
        kind: "delete",
        range: range(0, 0, 0, 3),
        status: "accepted",
      },
    ],
  });

  assert.deepEqual(
    annotations[0].runs.map((run) => [run.from, run.to]),
    [[0, 19]],
  );
  assert.equal(annotations[0].runs[0].suggestion, null);
  assert.deepEqual(annotations[0].runs[0].commentThreadIds, []);
});

test("overlapping suggestions collapse to one mark, deletion first", () => {
  const annotations = annotateRichTextDocument(document, {
    suggestions: [
      { authorId: "a", id: "s2", kind: "insert", range: range(0, 0, 0, 10) },
      { authorId: "b", id: "s1", kind: "delete", range: range(0, 4, 0, 19) },
    ],
  });

  const marks = annotations[0].runs.map((run) => run.suggestion?.id ?? null);
  assert.deepEqual(marks, ["s2", "s1", "s1"]);
});

test("same-kind overlaps break the tie on id, not array order", () => {
  const forward = annotateRichTextDocument(document, {
    suggestions: [
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 0, 0, 10) },
      { authorId: "b", id: "s0", kind: "insert", range: range(0, 0, 0, 10) },
    ],
  });
  const reversed = annotateRichTextDocument(document, {
    suggestions: [
      { authorId: "b", id: "s0", kind: "insert", range: range(0, 0, 0, 10) },
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 0, 0, 10) },
    ],
  });

  assert.equal(forward[0].runs[0].suggestion?.id, "s0");
  assert.equal(reversed[0].runs[0].suggestion?.id, "s0");
});

test("presence tints its selection and drops a caret at the moving end", () => {
  const annotations = annotateRichTextDocument(document, {
    presence: [{ collaboratorId: "robin", selection: range(0, 4, 0, 9) }],
  });

  assert.deepEqual(annotations[0].carets, [
    { collaboratorId: "robin", offset: 9 },
  ]);
  assert.deepEqual(
    annotations[0].runs
      .filter((run) => run.presenceIds.length > 0)
      .map((run) => [run.from, run.to]),
    [[4, 9]],
  );
});

test("a collapsed selection draws a caret with no tinted run", () => {
  const annotations = annotateRichTextDocument(document, {
    presence: [{ collaboratorId: "robin", selection: range(1, 6, 1, 6) }],
  });

  assert.deepEqual(annotations[1].carets, [
    { collaboratorId: "robin", offset: 6 },
  ]);
  assert.deepEqual(
    annotations[1].runs.map((run) => [
      run.from,
      run.to,
      run.presenceIds.length,
    ]),
    [
      [0, 6, 0],
      [6, 10, 0],
    ],
  );
});

test("every caret offset lands on a run boundary", () => {
  const annotations = annotateRichTextDocument(document, {
    presence: [{ collaboratorId: "robin", selection: range(0, 7, 0, 7) }],
    suggestions: [
      { authorId: "a", id: "s1", kind: "insert", range: range(0, 4, 0, 9) },
    ],
  });

  const boundaries = new Set(
    annotations[0].runs.flatMap((run) => [run.from, run.to]),
  );
  for (const caret of annotations[0].carets) {
    assert.equal(boundaries.has(caret.offset), true);
  }
});

test("the viewer never sees their own caret", () => {
  const annotations = annotateRichTextDocument(document, {
    localCollaboratorId: "cal",
    presence: [
      { collaboratorId: "cal", selection: range(0, 2, 0, 6) },
      { collaboratorId: "robin", selection: range(0, 9, 0, 9) },
    ],
  });

  assert.deepEqual(annotations[0].carets, [
    { collaboratorId: "robin", offset: 9 },
  ]);
  assert.deepEqual(
    annotations[0].runs.flatMap((run) => run.presenceIds),
    [],
  );
});

test("the active thread is flagged only on the runs it covers", () => {
  const annotations = annotateRichTextDocument(document, {
    activeCommentThreadId: "t2",
    commentThreads: [
      { comments: [], id: "t1", range: range(0, 0, 0, 3) },
      { comments: [], id: "t2", range: range(0, 10, 0, 15) },
    ],
  });

  assert.deepEqual(
    annotations[0].runs.map((run) => run.activeCommentThreadId),
    [null, null, "t2", null],
  );
});

test("overlapping threads are reported together in supplied order", () => {
  const annotations = annotateRichTextDocument(document, {
    commentThreads: [
      { comments: [], id: "t1", range: range(0, 0, 0, 10) },
      { comments: [], id: "t2", range: range(0, 4, 0, 19) },
    ],
  });

  assert.deepEqual(
    annotations[0].runs.map((run) => run.commentThreadIds),
    [["t1"], ["t1", "t2"], ["t2"]],
  );
});

test("ranges are clamped to the block and accepted in either direction", () => {
  assert.deepEqual(clipRangeToBlock(range(0, 5, 0, 900), 0, 19), {
    from: 5,
    to: 19,
  });
  assert.equal(clipRangeToBlock(range(1, 0, 1, 4), 0, 19), null);
  assert.deepEqual(orderRange(range(2, 1, 0, 3)), range(0, 3, 2, 1));
  assert.equal(comparePositions(position(0, 9), position(1, 0)) < 0, true);
});

test("a backwards presence range still tints and drops its caret", () => {
  const annotations = annotateRichTextDocument(document, {
    presence: [{ collaboratorId: "robin", selection: range(0, 9, 0, 4) }],
  });

  assert.deepEqual(annotations[0].carets, [
    { collaboratorId: "robin", offset: 9 },
  ]);
  assert.deepEqual(
    annotations[0].runs
      .filter((run) => run.presenceIds.length > 0)
      .map((run) => [run.from, run.to]),
    [[4, 9]],
  );
});

test("range text reads across blocks, including code blocks", () => {
  assert.equal(richTextRangeText(document, range(0, 4, 0, 9)), "quick");
  assert.equal(
    richTextRangeText(document, range(0, 16, 2, 5)),
    "fox\njumps over\nconst",
  );
});

test("an overlay with nothing in it is reported as empty", () => {
  assert.equal(hasRichTextAnnotations(null), false);
  assert.equal(hasRichTextAnnotations({}), false);
  assert.equal(
    hasRichTextAnnotations({
      commentThreads: [],
      presence: [],
      suggestions: [],
    }),
    false,
  );
  assert.equal(
    hasRichTextAnnotations({
      presence: [{ collaboratorId: "a", selection: range(0, 0, 0, 0) }],
    }),
    true,
  );
});
