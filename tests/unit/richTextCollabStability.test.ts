import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Both editors fold the collaboration props into a memo, and the web editor
 * re-renders its whole `contentEditable` document tree whenever that memo
 * changes. A `= []` default parameter is a fresh array on every render, so it
 * would invalidate the memo every time — rebuilding the document DOM on every
 * render of an editor that has no collaboration session at all, and taking the
 * DOM selection with it.
 *
 * The fix is a module-scope constant per prop. This guard is source-level
 * because the failure is an identity regression that renders correctly and only
 * shows up as churn, so no rendered assertion would catch it.
 */
const EDITORS = [
  "src/rich-text/RichTextEditor.web.tsx",
  "src/rich-text/RichTextEditor.tsx",
];

const COLLAB_ARRAY_PROPS = [
  "collaborators",
  "commentThreads",
  "presence",
  "suggestions",
];

test("collaboration array props default to a stable module constant", () => {
  for (const file of EDITORS) {
    const source = readSource(file);
    for (const prop of COLLAB_ARRAY_PROPS) {
      const match = new RegExp(`^\\s*${prop} = (.+),$`, "m").exec(source);
      assert.ok(match, `${file} should destructure a default for \`${prop}\``);
      assert.notEqual(
        match[1],
        "[]",
        `${file}: \`${prop} = []\` is a new array every render, which rebuilds the document DOM on every render. Default it to a module-scope constant instead.`,
      );
      assert.match(
        match[1],
        /^[A-Z][A-Z0-9_]*$/,
        `${file}: \`${prop}\` should default to a module-scope constant, got \`${match[1]}\``,
      );
      assert.match(
        source,
        new RegExp(`^const ${match[1]}: readonly `, "m"),
        `${file} should declare \`${match[1]}\` once at module scope`,
      );
    }
  }
});

function readSource(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}
