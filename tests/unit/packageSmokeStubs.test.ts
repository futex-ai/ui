import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * The package smoke installs a stubbed `lucide-react` that exports only the
 * glyph names in `scripts/package-smoke-stubs.mjs`. A glyph added to the icon
 * modules but not to that list fails the import smoke late in `npm run verify`,
 * so the two lists are compared here instead.
 */
test("package smoke stubs export every glyph the icon modules import", () => {
  const stubs = readSource("../../scripts/package-smoke-stubs.mjs");
  const stubList = stubs.match(/const ICON_NAMES = \[([\s\S]*?)\];/)?.[1];
  assert.ok(stubList, "ICON_NAMES list not found");
  const stubbed = [...stubList.matchAll(/"([A-Za-z0-9]+)"/g)].map(
    ([, name]) => name,
  );

  const icons = readSource("../../src/primitives/icons.ts");
  const exportList = icons.match(
    /export \{([\s\S]*?)\} from "lucide-react-native"/,
  )?.[1];
  assert.ok(exportList, "icon export list not found");
  const imported = exportList
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  assert.deepEqual([...stubbed].sort(), [...imported].sort());
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
