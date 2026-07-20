import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("DataGrid exposes optional borderRadius / borderWidth props with square defaults", () => {
  const props = readSource("../../src/data-grid/DataGrid.tsx");

  // Optional, numeric props — square (0 radius) with a 1px frame by default.
  assert.match(props, /borderRadius\?: number;/);
  assert.match(props, /borderWidth\?: number;/);
  assert.match(props, /borderRadius = 0,/);
  assert.match(props, /borderWidth = 1,/);
  // The old boolean `square` prop is gone.
  assert.doesNotMatch(props, /square\?: boolean;/);

  // Threaded into the memoized style factory (and its dependency list).
  assert.match(
    props,
    /createDataGridStyles\(theme, size, borderRadius, borderWidth\)/,
  );
  assert.match(props, /\[theme, size, borderRadius, borderWidth\]/);

  // The content-box inset tracks the (now-configurable) frame border width.
  assert.match(props, /measuredWidth - borderWidth \* 2/);
});

test("border props drive the grid frame + mobile card, square by default", () => {
  const styles = readSource("../../src/data-grid/dataGridStyles.ts");

  // Square corners + a hairline frame are the defaults.
  assert.match(styles, /borderRadius = 0,/);
  assert.match(styles, /borderWidth = 1,/);

  // Both the frame and the card read the shared border radius + width, and the
  // old `frameRadius` (square-toggle) indirection is gone.
  assert.doesNotMatch(styles, /frameRadius/);
  assert.doesNotMatch(styles, /square = false/);
  const radiusUses = styles.match(/^\s*borderRadius,$/gm) ?? [];
  const widthUses = styles.match(/^\s*borderWidth,$/gm) ?? [];
  assert.equal(radiusUses.length, 2, "grid + card both use borderRadius");
  assert.equal(widthUses.length, 2, "grid + card both use borderWidth");
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
