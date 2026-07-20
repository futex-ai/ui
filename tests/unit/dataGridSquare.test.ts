import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("DataGrid exposes a square prop wired into the themed styles", () => {
  const props = readSource("../../src/data-grid/DataGrid.tsx");

  // Public, defaulted-off prop.
  assert.match(props, /square\?: boolean;/);
  assert.match(props, /square = false,/);
  // Threaded into the memoized style factory (and its dependency list).
  assert.match(props, /createDataGridStyles\(theme, size, square\)/);
  assert.match(props, /\[theme, size, square\]/);
});

test("square flattens the grid frame and mobile card corners", () => {
  const styles = readSource("../../src/data-grid/dataGridStyles.ts");

  // A single shared radius drives both the desktop frame and the card.
  assert.match(styles, /square = false,/);
  assert.match(styles, /const frameRadius = square \? 0 : theme\.radii\.lg;/);
  // Both surfaces read the shared radius rather than a hardcoded token.
  const frameRadiusUses = styles.match(/borderRadius: frameRadius,/g) ?? [];
  assert.equal(frameRadiusUses.length, 2, "grid + card both use frameRadius");
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
