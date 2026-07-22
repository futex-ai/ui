import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { applyNativeTextChange } from "../../src/rich-text/nativeRichTextEditing";
import { nativeTextAfterSubmit } from "../../src/rich-text/nativeTextEdit";

test("native structural blocks submit Return without retaining a local newline", () => {
  const source = readFileSync(
    new URL("../../src/rich-text/NativeRichTextBlock.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /onSubmitEditing=\{\(\) => onSubmitEditing\(index\)\}/);
  assert.match(
    source,
    /submitBehavior=\{block\.type === "codeBlock" \? "newline" : "submit"\}/,
  );
});

test("one native heading submit creates one paragraph continuation", () => {
  const selection = { end: 5, start: 5 };
  const result = applyNativeTextChange({
    block: 0,
    document: [{ spans: [{ marks: [], text: "Title" }], type: "heading1" }],
    marks: [],
    nextText: nativeTextAfterSubmit("Title", selection),
    selection,
  });

  assert.deepEqual(result.document, [
    { spans: [{ marks: [], text: "Title" }], type: "heading1" },
    { spans: [], type: "paragraph" },
  ]);
  assert.deepEqual(result.target, {
    block: 1,
    selection: { end: 0, start: 0 },
  });
});
