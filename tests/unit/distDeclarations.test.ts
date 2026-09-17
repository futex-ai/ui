import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import test from "node:test";

/**
 * `dist/node` is the tree every consumer's TypeScript resolves: the package's
 * `types` condition points at `dist/node/index.d.ts` for the `react-native`
 * condition too. Those declarations are emitted by the web-resolution pass
 * (`tsconfig.build.web.json`) and the seam types them from
 * `src/primitives/types`, so nothing there may name `react-native` — a single
 * reference would put the package back on a strict consumer's install list.
 *
 * The check runs against build output, so it is skipped (loudly) when `dist`
 * has not been built. `npm run verify` builds before the package smoke, and
 * `npm test` alone stays runnable on a clean tree.
 */
const nodeRoot = fileURLToPath(new URL("../../dist/node/", import.meta.url));

/** `from "react-native"`, `import("react-native")`, and `/// <reference>`s. */
const REACT_NATIVE_REFERENCE =
  /["']react-native["']|types=["']react-native["']/;

test("dist/node declarations never reference react-native", (t) => {
  if (!existsSync(nodeRoot)) {
    t.skip("dist/node is absent — run `npm run build` first");
    return;
  }
  const declarations = walk(nodeRoot).filter((file) => file.endsWith(".d.ts"));
  assert.ok(
    declarations.length > 0,
    "dist/node has no declarations — the build is incomplete",
  );
  const offenders = declarations
    .filter((file) => REACT_NATIVE_REFERENCE.test(readFileSync(file, "utf8")))
    .map((file) => relative(nodeRoot, file));
  assert.deepEqual(
    offenders,
    [],
    `These declarations pull \`react-native\` back into a web consumer's install:\n${offenders.join("\n")}`,
  );
});

test("dist/node drops the native modules a .web sibling shadows", (t) => {
  if (!existsSync(nodeRoot)) {
    t.skip("dist/node is absent — run `npm run build` first");
    return;
  }
  const files = new Set(walk(nodeRoot).map((file) => relative(nodeRoot, file)));
  const shadowed = [...files]
    .filter((file) => file.endsWith(".web.js"))
    .map((file) => `${file.slice(0, -".web.js".length)}.js`)
    .filter((file) => files.has(file));
  assert.deepEqual(shadowed, []);
  // The seam's web module is what everything resolves to; its native sibling,
  // the one file that still imports `react-native`, must not be shipped here.
  assert.ok(files.has("primitives/reactNative.web.js"));
  assert.ok(!files.has("primitives/reactNative.js"));
});

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
