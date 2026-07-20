import assert from "node:assert/strict";
import test from "node:test";

import { parseMarkdown } from "../../src/rich-text/markdownParse";
import { serializeMarkdown } from "../../src/rich-text/markdownSerialize";
import type { RichTextDocument } from "../../src/rich-text/richTextModel";
import { normalizeDocument } from "../../src/rich-text/richTextModel";

test("serializes block types and contiguous list runs", () => {
  const doc: RichTextDocument = [
    { spans: [{ marks: [], text: "Title" }], type: "heading1" },
    { spans: [{ marks: [], text: "Intro" }], type: "paragraph" },
    { spans: [{ marks: [], text: "One" }], type: "bullet" },
    { spans: [{ marks: [], text: "Two" }], type: "bullet" },
    { spans: [{ marks: [], text: "First" }], type: "numbered" },
    { spans: [{ marks: [], text: "Second" }], type: "numbered" },
    { checked: false, spans: [{ marks: [], text: "Todo" }], type: "check" },
    { checked: true, spans: [{ marks: [], text: "Done" }], type: "check" },
    { spans: [{ marks: [], text: "Quoted" }], type: "quote" },
    { type: "divider" },
  ];

  assert.equal(
    serializeMarkdown(doc),
    [
      "# Title",
      "",
      "Intro",
      "",
      "- One",
      "- Two",
      "",
      "1. First",
      "2. Second",
      "",
      "- [ ] Todo",
      "- [x] Done",
      "",
      "> Quoted",
      "",
      "---",
    ].join("\n"),
  );
});

test("serializes inline marks, escapes, soft breaks, and code fences", () => {
  assert.equal(
    serializeMarkdown([
      {
        spans: [
          { marks: ["bold"], text: "bold" },
          { marks: [], text: " # heading" },
          { marks: ["italic", "strike"], text: "mix" },
          { marks: ["code"], text: "a`b" },
          { marks: [], text: "\n- literal" },
        ],
        type: "paragraph",
      },
      { code: "``` inside", type: "codeBlock" },
    ]),
    "**bold** # heading*~~mix~~*``a`b``\\\n\\- literal\n\n````\n``` inside\n````",
  );
});

test("round-trips code spans with embedded and edge backticks", () => {
  const cases = ["a`b", "a``b", "`start", "end`", "`", " a`b "];

  for (const text of cases) {
    const doc: RichTextDocument = [
      { spans: [{ marks: ["code"], text }], type: "paragraph" },
    ];
    assert.deepEqual(parseMarkdown(serializeMarkdown(doc)), doc);
  }
});

test("round-trips paragraph text that resembles divider markers", () => {
  const cases = ["---", "***", "___", "--- x"];

  for (const text of cases) {
    const doc: RichTextDocument = [
      { spans: [{ marks: [], text }], type: "paragraph" },
    ];
    assert.deepEqual(parseMarkdown(serializeMarkdown(doc)), doc);
  }
});

test("parses recognized block prefixes in precedence order", () => {
  assert.deepEqual(
    parseMarkdown(
      [
        "# H1",
        "## H2",
        "### H3",
        "- [ ] Todo",
        "- [x] Done",
        "- Bullet",
        "* Star bullet",
        "+ Plus bullet",
        "9) Numbered",
        "> Quote",
        "---",
        "***",
        "___",
        "```",
        "# not heading",
        "```",
      ].join("\n"),
    ),
    [
      { spans: [{ marks: [], text: "H1" }], type: "heading1" },
      { spans: [{ marks: [], text: "H2" }], type: "heading2" },
      { spans: [{ marks: [], text: "H3" }], type: "heading3" },
      { checked: false, spans: [{ marks: [], text: "Todo" }], type: "check" },
      { checked: true, spans: [{ marks: [], text: "Done" }], type: "check" },
      { spans: [{ marks: [], text: "Bullet" }], type: "bullet" },
      { spans: [{ marks: [], text: "Star bullet" }], type: "bullet" },
      { spans: [{ marks: [], text: "Plus bullet" }], type: "bullet" },
      { spans: [{ marks: [], text: "Numbered" }], type: "numbered" },
      { spans: [{ marks: [], text: "Quote" }], type: "quote" },
      { type: "divider" },
      { type: "divider" },
      { type: "divider" },
      { code: "# not heading", type: "codeBlock" },
    ],
  );
});

test("parses inline marks, escapes, unmatched delimiters, and literal links", () => {
  assert.deepEqual(
    parseMarkdown(
      String.raw`\*literal\* **bold** *i* ~~s~~ \`c\` [x](url) **open`,
    ),
    [
      {
        spans: [
          { marks: [], text: "*literal* " },
          { marks: ["bold"], text: "bold" },
          { marks: [], text: " " },
          { marks: ["italic"], text: "i" },
          { marks: [], text: " " },
          { marks: ["strike"], text: "s" },
          { marks: [], text: " `c` [x](url) **open" },
        ],
        type: "paragraph",
      },
    ],
  );
});

test("leaves unsupported markdown forms as paragraph text", () => {
  assert.deepEqual(parseMarkdown("Title\n---ish\n\n| a | b |\n<div>x</div>"), [
    { spans: [{ marks: [], text: "Title\n---ish" }], type: "paragraph" },
    {
      spans: [{ marks: [], text: "| a | b |\n<div>x</div>" }],
      type: "paragraph",
    },
  ]);
});

test("parse(serialize(doc)) deep-equals normalizeDocument(doc)", () => {
  const docs: RichTextDocument[] = [
    [],
    [
      {
        spans: [
          { marks: ["code", "bold"], text: "A" },
          { marks: ["bold", "code"], text: "B" },
        ],
        type: "paragraph",
      },
    ],
    [
      { spans: [{ marks: [], text: "One" }], type: "numbered" },
      { spans: [{ marks: [], text: "Two" }], type: "numbered" },
      { spans: [{ marks: [], text: "Quote\nline" }], type: "quote" },
      {
        checked: true,
        spans: [{ marks: ["strike"], text: "Done" }],
        type: "check",
      },
      { code: "const fence = ```;", type: "codeBlock" },
      { type: "divider" },
    ],
  ];

  for (const doc of docs) {
    assert.deepEqual(
      parseMarkdown(serializeMarkdown(doc)),
      normalizeDocument(doc),
    );
  }
});

test("serialize(parse(markdown)) is idempotent", () => {
  const markdownCases = [
    "",
    "# Heading\n\nParagraph with **bold** and [literal](url)",
    "- b\n- a\n\n1. z\n1. y\n\n- [x] done",
    "> quote\\\n> next\n\n```\na```b\n```",
    "Setext\n---ish\n\n<table>",
  ];

  for (const markdown of markdownCases) {
    const once = serializeMarkdown(parseMarkdown(markdown));
    assert.equal(serializeMarkdown(parseMarkdown(once)), once);
  }
});
