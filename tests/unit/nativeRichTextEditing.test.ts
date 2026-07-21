import assert from "node:assert/strict";
import test from "node:test";

import {
  insertNativeBlockAfter,
  mergeNativeBlockBackward,
  toggleNativeChecklist,
  turnNativeBlockInto,
} from "../../src/rich-text/nativeRichTextActions";
import {
  applyNativeTextChange,
  inferNativeTextEdit,
  marksForNativeSelection,
} from "../../src/rich-text/nativeRichTextEditing";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";

test("infers an insertion at the native selection when text repeats", () => {
  assert.deepEqual(inferNativeTextEdit("aaaa", "aaaaa", { end: 2, start: 2 }), {
    from: 2,
    insertedText: "a",
    to: 2,
  });
});

test("falls back to a minimal replacement when autocorrect widens the edit", () => {
  assert.deepEqual(
    inferNativeTextEdit("teh cat", "the cat", { end: 7, start: 7 }),
    { from: 1, insertedText: "he", to: 3 },
  );
});

test("applies typing marks and preserves marks outside a replacement", () => {
  const document: RichTextDocument = [
    {
      spans: [{ marks: ["bold"], text: "Hello" }],
      type: "paragraph",
    },
  ];
  const result = applyNativeTextChange({
    document,
    marks: ["italic"],
    nextText: "Hio",
    selection: { end: 4, start: 1 },
    block: 0,
  });

  assert.deepEqual(result.document, [
    {
      spans: [
        { marks: ["bold"], text: "H" },
        { marks: ["italic"], text: "i" },
        { marks: ["bold"], text: "o" },
      ],
      type: "paragraph",
    },
  ]);
  assert.deepEqual(result.target, {
    block: 0,
    selection: { end: 2, start: 2 },
  });
});

test("splits a heading on native Enter and focuses its paragraph continuation", () => {
  const result = applyNativeTextChange({
    block: 0,
    document: [{ spans: [{ marks: [], text: "Title" }], type: "heading1" }],
    marks: [],
    nextText: "Ti\ntle",
    selection: { end: 2, start: 2 },
  });

  assert.deepEqual(result.document, [
    { spans: [{ marks: [], text: "Ti" }], type: "heading1" },
    { spans: [{ marks: [], text: "tle" }], type: "paragraph" },
  ]);
  assert.deepEqual(result.target, {
    block: 1,
    selection: { end: 0, start: 0 },
  });
});

test("keeps native Enter inside code blocks", () => {
  const result = applyNativeTextChange({
    block: 0,
    document: [{ code: "ab", type: "codeBlock" }],
    marks: [],
    nextText: "a\nb",
    selection: { end: 1, start: 1 },
  });

  assert.deepEqual(result.document, [{ code: "a\nb", type: "codeBlock" }]);
  assert.deepEqual(result.target.selection, { end: 2, start: 2 });
});

test("applies native heading and divider prefix shortcuts", () => {
  const heading = applyNativeTextChange({
    block: 0,
    document: [{ spans: [{ marks: [], text: "#" }], type: "paragraph" }],
    marks: [],
    nextText: "# ",
    selection: { end: 1, start: 1 },
  });
  assert.deepEqual(heading.document, [{ spans: [], type: "heading1" }]);
  assert.deepEqual(heading.prefixRule, { block: 0, literal: "# " });

  const divider = applyNativeTextChange({
    block: 0,
    document: [{ spans: [{ marks: [], text: "--" }], type: "paragraph" }],
    marks: [],
    nextText: "---",
    selection: { end: 2, start: 2 },
  });
  assert.deepEqual(divider.document, [
    { type: "divider" },
    { spans: [], type: "paragraph" },
  ]);
  assert.deepEqual(divider.target, {
    block: 1,
    selection: { end: 0, start: 0 },
  });
});

test("applies native inline delimiter autoformat", () => {
  const result = applyNativeTextChange({
    block: 0,
    document: [{ spans: [{ marks: [], text: "**bold*" }], type: "paragraph" }],
    marks: [],
    nextText: "**bold**",
    selection: { end: 7, start: 7 },
  });

  assert.deepEqual(result.document, [
    { spans: [{ marks: ["bold"], text: "bold" }], type: "paragraph" },
  ]);
  assert.deepEqual(result.target.selection, { end: 4, start: 4 });
});

test("reports marks shared by the caret or full selection", () => {
  const document: RichTextDocument = [
    {
      spans: [
        { marks: ["bold", "italic"], text: "ab" },
        { marks: ["bold"], text: "cd" },
      ],
      type: "paragraph",
    },
  ];

  assert.deepEqual(marksForNativeSelection(document, 0, { end: 1, start: 1 }), [
    "bold",
    "italic",
  ]);
  assert.deepEqual(marksForNativeSelection(document, 0, { end: 4, start: 0 }), [
    "bold",
  ]);
});

test("merges native Backspace targets and demotes list blocks", () => {
  const merged = mergeNativeBlockBackward(
    [
      { spans: [{ marks: [], text: "Hello" }], type: "paragraph" },
      { spans: [{ marks: ["bold"], text: "world" }], type: "heading2" },
    ],
    1,
  );
  assert.deepEqual(merged.document, [
    {
      spans: [
        { marks: [], text: "Hello" },
        { marks: ["bold"], text: "world" },
      ],
      type: "paragraph",
    },
  ]);
  assert.deepEqual(merged.target, {
    block: 0,
    selection: { end: 5, start: 5 },
  });

  const demoted = mergeNativeBlockBackward(
    [{ spans: [{ marks: [], text: "item" }], type: "bullet" }],
    0,
  );
  assert.equal(demoted.document[0]?.type, "paragraph");
  assert.equal(demoted.target.block, 0);
});

test("supports toolbar block insertion, conversion, and checklist toggling", () => {
  const inserted = insertNativeBlockAfter(
    [{ spans: [{ marks: [], text: "one" }], type: "paragraph" }],
    0,
    "check",
  );
  assert.deepEqual(inserted.document, [
    { spans: [{ marks: [], text: "one" }], type: "paragraph" },
    { checked: false, spans: [], type: "check" },
  ]);
  assert.equal(inserted.target.block, 1);

  const converted = turnNativeBlockInto(inserted.document, 1, "heading2");
  assert.equal(converted.document[1]?.type, "heading2");

  const toggled = toggleNativeChecklist(
    [{ checked: false, spans: [], type: "check" }],
    0,
  );
  assert.deepEqual(toggled, [{ checked: true, spans: [], type: "check" }]);
});
