import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";

import { rnwForms } from "../../src/primitives/rnwForms";

test("the RNW seam table names exactly the top-level seam pairs", () => {
  const primitives = new URL("../../src/primitives/", import.meta.url);
  const extension = /\.[jt]sx?$/;
  const modules = new Set(
    readdirSync(primitives, { withFileTypes: true })
      .filter((file) => file.isFile() && extension.test(file.name))
      .map((file) => file.name.replace(extension, "")),
  );
  const seams = [...modules]
    .filter((name) => name.endsWith(".web"))
    .map((name) => name.slice(0, -".web".length))
    .filter((name) => modules.has(name));

  assert.deepEqual(Object.keys(rnwForms).sort(), seams.sort());
});
