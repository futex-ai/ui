import assert from "node:assert/strict";
import test from "node:test";

import {
  RichTextDocument,
  deleteForward,
  deleteRange,
  insertBlocks,
  insertSoftBreak,
  insertText,
  mergeBackward,
  normalizeDocument,
  sliceSpans,
  splitBlock,
  splitSpans,
  spansText,
  toggleMarkInRange,
  turnInto,
} from "../../src/rich-text/richTextModel";

test("normalizes empty documents, marks, adjacent spans, and trailing dividers", () => {
  assert.deepEqual(normalizeDocument([]), [{ spans: [], type: "paragraph" }]);
  assert.deepEqual(
    normalizeDocument([
      {
        spans: [
          { marks: ["code", "bold"], text: "a" },
          { marks: ["bold", "code"], text: "b" },
          { marks: ["italic"], text: "" },
        ],
        type: "paragraph",
      },
      { type: "divider" },
    ]),
    [
      { spans: [{ marks: ["bold", "code"], text: "ab" }], type: "paragraph" },
      { type: "divider" },
      { spans: [], type: "paragraph" },
    ],
  );
});

test("span helpers split, slice, and flatten marked text", () => {
  const spans = [
    { marks: ["bold" as const], text: "Hello" },
    { marks: ["italic" as const], text: " world" },
  ];
  assert.equal(spansText(spans), "Hello world");
  assert.deepEqual(splitSpans(spans, 7), [
    [
      { marks: ["bold"], text: "Hello" },
      { marks: ["italic"], text: " w" },
    ],
    [{ marks: ["italic"], text: "orld" }],
  ]);
  assert.deepEqual(sliceSpans(spans, 3, 8), [
    { marks: ["bold"], text: "lo" },
    { marks: ["italic"], text: " wo" },
  ]);
});

test("splitBlock continues lists and exits empty list-like blocks", () => {
  const doc: RichTextDocument = [
    { spans: [{ marks: [], text: "abc" }], type: "bullet" },
    { spans: [], type: "check", checked: true },
  ];
  assert.deepEqual(splitBlock(doc, { block: 0, offset: 1 }), [
    { spans: [{ marks: [], text: "a" }], type: "bullet" },
    { spans: [{ marks: [], text: "bc" }], type: "bullet" },
    { spans: [], type: "check", checked: true },
  ]);
  assert.deepEqual(splitBlock(doc, { block: 1, offset: 0 }), [
    { spans: [{ marks: [], text: "abc" }], type: "bullet" },
    { spans: [], type: "paragraph" },
  ]);
});

test("splitBlock turns heading and quote continuations into paragraphs", () => {
  assert.deepEqual(
    splitBlock([{ spans: [{ marks: [], text: "Title" }], type: "heading1" }], {
      block: 0,
      offset: 2,
    }),
    [
      { spans: [{ marks: [], text: "Ti" }], type: "heading1" },
      { spans: [{ marks: [], text: "tle" }], type: "paragraph" },
    ],
  );
  assert.deepEqual(
    splitBlock([{ spans: [{ marks: [], text: "Quoted" }], type: "quote" }], {
      block: 0,
      offset: 3,
    }),
    [
      { spans: [{ marks: [], text: "Quo" }], type: "quote" },
      { spans: [{ marks: [], text: "ted" }], type: "paragraph" },
    ],
  );
});

test("splitBlock inserts and exits code block lines", () => {
  assert.deepEqual(
    splitBlock([{ code: "ab", type: "codeBlock" }], { block: 0, offset: 1 }),
    [{ code: "a\nb", type: "codeBlock" }],
  );
  assert.deepEqual(
    splitBlock([{ code: "ab\n", type: "codeBlock" }], {
      block: 0,
      offset: 3,
    }),
    [
      { code: "ab", type: "codeBlock" },
      { spans: [], type: "paragraph" },
    ],
  );
});

test("insertSoftBreak inserts newlines without exiting code blocks", () => {
  assert.deepEqual(
    insertSoftBreak(
      [{ spans: [{ marks: [], text: "ab" }], type: "paragraph" }],
      {
        block: 0,
        offset: 1,
      },
    ),
    [{ spans: [{ marks: [], text: "a\nb" }], type: "paragraph" }],
  );
  assert.deepEqual(
    insertSoftBreak([{ code: "ab\n", type: "codeBlock" }], {
      block: 0,
      offset: 3,
    }),
    [{ code: "ab\n\n", type: "codeBlock" }],
  );
});

test("mergeBackward demotes list-like blocks and merges text into previous blocks", () => {
  assert.deepEqual(
    mergeBackward([{ spans: [{ marks: [], text: "item" }], type: "bullet" }], {
      block: 0,
      offset: 0,
    }),
    [{ spans: [{ marks: [], text: "item" }], type: "paragraph" }],
  );
  assert.deepEqual(
    mergeBackward(
      [
        { spans: [{ marks: [], text: "Hello " }], type: "paragraph" },
        { spans: [{ marks: ["bold"], text: "world" }], type: "heading2" },
      ],
      { block: 1, offset: 0 },
    ),
    [
      {
        spans: [
          { marks: [], text: "Hello " },
          { marks: ["bold"], text: "world" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("mergeBackward deletes previous dividers and converts code blocks at start", () => {
  assert.deepEqual(
    mergeBackward(
      [
        { type: "divider" },
        { spans: [{ marks: [], text: "after" }], type: "paragraph" },
      ],
      { block: 1, offset: 0 },
    ),
    [{ spans: [{ marks: [], text: "after" }], type: "paragraph" }],
  );
  assert.deepEqual(
    mergeBackward([{ code: "let x = 1;", type: "codeBlock" }], {
      block: 0,
      offset: 0,
    }),
    [{ spans: [{ marks: [], text: "let x = 1;" }], type: "paragraph" }],
  );
});

test("deleteForward mirrors end-of-block merge behavior", () => {
  assert.deepEqual(
    deleteForward(
      [
        { spans: [{ marks: [], text: "Hello" }], type: "paragraph" },
        { spans: [{ marks: [], text: " world" }], type: "paragraph" },
      ],
      { block: 0, offset: 5 },
    ),
    [{ spans: [{ marks: [], text: "Hello world" }], type: "paragraph" }],
  );
  assert.deepEqual(
    deleteForward(
      [{ spans: [{ marks: [], text: "item" }], type: "check", checked: false }],
      {
        block: 0,
        offset: 4,
      },
    ),
    [{ spans: [{ marks: [], text: "item" }], type: "paragraph" }],
  );
});

test("deleteRange removes same-block and cross-block selections", () => {
  assert.deepEqual(
    deleteRange(
      [{ spans: [{ marks: [], text: "abcdef" }], type: "paragraph" }],
      { block: 0, offset: 2 },
      { block: 0, offset: 4 },
    ),
    [{ spans: [{ marks: [], text: "abef" }], type: "paragraph" }],
  );
  assert.deepEqual(
    deleteRange(
      [
        { spans: [{ marks: [], text: "Hello " }], type: "paragraph" },
        { spans: [{ marks: [], text: "drop" }], type: "heading1" },
        { spans: [{ marks: ["italic"], text: "world" }], type: "paragraph" },
      ],
      { block: 0, offset: 6 },
      { block: 2, offset: 0 },
    ),
    [
      {
        spans: [
          { marks: [], text: "Hello " },
          { marks: ["italic"], text: "world" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("insertText and insertBlocks handle collapsed insertion points", () => {
  assert.deepEqual(
    insertText(
      [{ spans: [{ marks: ["bold"], text: "ac" }], type: "paragraph" }],
      {
        block: 0,
        offset: 1,
      },
      "b",
    ),
    [
      {
        spans: [
          { marks: ["bold"], text: "a" },
          { marks: [], text: "b" },
          { marks: ["bold"], text: "c" },
        ],
        type: "paragraph",
      },
    ],
  );
  assert.deepEqual(
    insertBlocks([{ spans: [], type: "paragraph" }], { block: 0, offset: 0 }, [
      { spans: [{ marks: [], text: "pasted" }], type: "quote" },
    ]),
    [{ spans: [{ marks: [], text: "pasted" }], type: "quote" }],
  );
});

test("turnInto converts spans and code without converting to dividers", () => {
  assert.deepEqual(
    turnInto(
      [{ spans: [{ marks: ["bold"], text: "Title" }], type: "heading1" }],
      0,
      "codeBlock",
    ),
    [{ code: "Title", type: "codeBlock" }],
  );
  assert.deepEqual(
    turnInto([{ code: "plain", type: "codeBlock" }], 0, "check"),
    [{ checked: false, spans: [{ marks: [], text: "plain" }], type: "check" }],
  );
  const doc: RichTextDocument = [
    { spans: [{ marks: [], text: "x" }], type: "paragraph" },
  ];
  assert.deepEqual(turnInto(doc, 0, "divider"), doc);
});

test("toggleMarkInRange marks a single-block partial range", () => {
  assert.deepEqual(
    toggleMarkInRange(
      [{ spans: [{ marks: [], text: "hello" }], type: "paragraph" }],
      { block: 0, offset: 1 },
      { block: 0, offset: 4 },
      "bold",
    ),
    [
      {
        spans: [
          { marks: [], text: "h" },
          { marks: ["bold"], text: "ell" },
          { marks: [], text: "o" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("toggleMarkInRange marks text across blocks", () => {
  assert.deepEqual(
    toggleMarkInRange(
      [
        { spans: [{ marks: [], text: "one" }], type: "paragraph" },
        { spans: [{ marks: ["italic"], text: "two" }], type: "quote" },
      ],
      { block: 0, offset: 1 },
      { block: 1, offset: 2 },
      "strike",
    ),
    [
      {
        spans: [
          { marks: [], text: "o" },
          { marks: ["strike"], text: "ne" },
        ],
        type: "paragraph",
      },
      {
        spans: [
          { marks: ["italic", "strike"], text: "tw" },
          { marks: ["italic"], text: "o" },
        ],
        type: "quote",
      },
    ],
  );
});

test("toggleMarkInRange removes a mark when the whole range has it", () => {
  assert.deepEqual(
    toggleMarkInRange(
      [
        {
          spans: [
            { marks: ["bold"], text: "al" },
            { marks: ["bold", "code"], text: "pha" },
          ],
          type: "paragraph",
        },
      ],
      { block: 0, offset: 0 },
      { block: 0, offset: 5 },
      "bold",
    ),
    [
      {
        spans: [
          { marks: [], text: "al" },
          { marks: ["code"], text: "pha" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("toggleMarkInRange leaves code blocks and dividers untouched", () => {
  assert.deepEqual(
    toggleMarkInRange(
      [
        { spans: [{ marks: [], text: "plain" }], type: "paragraph" },
        { code: "const x = 1;", type: "codeBlock" },
        { type: "divider" },
        { spans: [{ marks: [], text: "tail" }], type: "paragraph" },
      ],
      { block: 0, offset: 2 },
      { block: 3, offset: 2 },
      "italic",
    ),
    [
      {
        spans: [
          { marks: [], text: "pl" },
          { marks: ["italic"], text: "ain" },
        ],
        type: "paragraph",
      },
      { code: "const x = 1;", type: "codeBlock" },
      { type: "divider" },
      {
        spans: [
          { marks: ["italic"], text: "ta" },
          { marks: [], text: "il" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("toggleMarkInRange treats empty ranges as no-ops", () => {
  const doc: RichTextDocument = [
    { spans: [{ marks: [], text: "same" }], type: "paragraph" },
  ];
  assert.deepEqual(
    toggleMarkInRange(
      doc,
      { block: 0, offset: 2 },
      { block: 0, offset: 2 },
      "code",
    ),
    doc,
  );
});
