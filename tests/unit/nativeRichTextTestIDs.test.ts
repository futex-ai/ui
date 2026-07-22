import assert from "node:assert/strict";
import test from "node:test";

import { buildNativeRichTextTestIDs } from "../../src/rich-text/nativeRichTextTestIDs";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";

test("keeps the exact native editor testID on the first editable block", () => {
  const document: RichTextDocument = [
    { spans: [{ marks: [], text: "First" }], type: "paragraph" },
    { spans: [{ marks: [], text: "Second" }], type: "paragraph" },
  ];

  assert.deepEqual(buildNativeRichTextTestIDs(document, "notes"), {
    blocks: ["notes", "notes-block-1"],
    field: "notes-field",
  });
});

test("skips dividers when assigning the editable native editor testID", () => {
  const document: RichTextDocument = [
    { type: "divider" },
    { spans: [], type: "paragraph" },
  ];

  assert.deepEqual(buildNativeRichTextTestIDs(document, "notes"), {
    blocks: ["notes-block-0", "notes"],
    field: "notes-field",
  });
  assert.deepEqual(buildNativeRichTextTestIDs(document), {
    blocks: [undefined, undefined],
    field: undefined,
  });
});
