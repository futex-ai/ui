import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createSharedUiTheme,
  defaultSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

test("theme overrides preserve defaults for unspecified tokens", () => {
  const theme = createSharedUiTheme({
    colors: {
      primary: "#123456",
      primaryDeep: "#102030",
      primarySoft: "#eef4ff",
      primaryBorder: "#cad9ea",
    },
  });

  assert.equal(theme.colors.primary, "#123456");
  assert.equal(theme.colors.primaryDeep, "#102030");
  assert.equal(theme.colors.surface, defaultSharedUiTheme.colors.surface);
  assert.equal(theme.radii.md, defaultSharedUiTheme.radii.md);
});

test("juno theme maps the purple primary family", () => {
  assert.equal(junoSharedUiTheme.colors.primary, "#6F5BD0");
  assert.equal(junoSharedUiTheme.colors.primaryDeep, "#5A47BD");
  assert.equal(junoSharedUiTheme.colors.primarySoft, "#F0EBFA");
});

test("both themes define the deep amber/rose accents for badge tones", () => {
  // The deep accents back the warning/danger badge tones; the lighter
  // amber/rose accents fall below AA on their own soft tints, so these mirror
  // the existing primaryDeep precedent.
  assert.equal(defaultSharedUiTheme.colors.amberDeep, "#75531a");
  assert.equal(defaultSharedUiTheme.colors.roseDeep, "#8f3a30");
  assert.equal(junoSharedUiTheme.colors.amberDeep, "#80561c");
  assert.equal(junoSharedUiTheme.colors.roseDeep, "#9a4138");
});

test("focus ring uses the active shared theme primary color", () => {
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /theme\.colors\.primary/);
  assert.match(source, /focusRingStyle/);
});

test("theme defaults the focus-ring switch on and honors an override", () => {
  // The global focus-ring kill switch defaults on so existing callers keep the
  // glow, and can be flipped off per-theme without touching any component.
  assert.equal(defaultSharedUiTheme.focusRing, true);
  assert.equal(junoSharedUiTheme.focusRing, true);
  assert.equal(createSharedUiTheme({}).focusRing, true);
  assert.equal(createSharedUiTheme({ focusRing: false }).focusRing, false);
  // An unrelated override must not drop the focus-ring default (guards the
  // per-key spread in createSharedUiTheme).
  assert.equal(
    createSharedUiTheme({ colors: { primary: "#123456" } }).focusRing,
    true,
  );
});

test("useFocusRing exposes the disable primitive and outline fallback", () => {
  // focusRing.ts imports react-native (Platform) and so cannot be imported in
  // the node test runner; assert its disable wiring at the source level instead,
  // matching the focus-ring convention above.
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );

  // The per-instance `disabled` option and the global `theme.focusRing` flag
  // both gate the ring through a single `ringEnabled`.
  assert.match(source, /disabled\?:\s*boolean/);
  assert.match(
    source,
    /const ringEnabled =\s*!disabled && theme\.focusRing !== false/,
  );
  // A disabled ring collapses to an empty style so the usual gate paints nothing.
  assert.match(source, /ringEnabled\s*\n?\s*\?\s*focusRingStyleFor/);
  assert.match(source, /:\s*EMPTY_RING_STYLE/);
  // The hook returns both the Family-B gate flag and the web outline reset.
  assert.match(source, /ringEnabled,/);
  assert.match(
    source,
    /webOutlineReset:\s*ringEnabled \? hideWebOutlineView : null/,
  );
});
