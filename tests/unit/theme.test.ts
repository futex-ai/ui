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

test("radii expose the avatar rounded-square ratio", () => {
  assert.equal(defaultSharedUiTheme.radii.avatarRatio, 0.25);
  // Themes built through createSharedUiTheme inherit the default token.
  assert.equal(junoSharedUiTheme.radii.avatarRatio, 0.25);
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

test("themes carry the onSolid token and a scheme", () => {
  assert.equal(defaultSharedUiTheme.colors.onSolid, "#ffffff");
  assert.equal(junoSharedUiTheme.colors.onSolid, "#ffffff");
  assert.equal(defaultSharedUiTheme.scheme, "light");
  assert.equal(junoSharedUiTheme.scheme, "light");
  // An unrelated override must not drop them (per-key spread guard).
  const overridden = createSharedUiTheme({ colors: { primary: "#123456" } });
  assert.equal(overridden.colors.onSolid, "#ffffff");
  assert.equal(overridden.scheme, "light");
});

test("createSharedUiTheme accepts a base theme to extend", () => {
  const base = createSharedUiTheme({ colors: { primary: "#123456" } });
  const derived = createSharedUiTheme({ colors: { rose: "#654321" } }, base);
  assert.equal(derived.colors.primary, "#123456"); // inherited from base
  assert.equal(derived.colors.rose, "#654321");
  assert.equal(derived.radii.md, base.radii.md);
});

test("focus ring uses the active shared theme primary color", () => {
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /theme\.colors\.primary/);
  assert.match(source, /focusRingStyle/);
});

test("the focus-ring primitive has public root and subpath exports", () => {
  // Consumers import every other primitive by subpath, so wiring a custom
  // control's focus glow through the package root would pull the whole barrel
  // through Metro. `./focusRing` mirrors `./theme`: a single-module subpath
  // named after the module it exposes.
  const rootSource = readFileSync(
    new URL("../../src/index.ts", import.meta.url),
    "utf8",
  );
  const packageJson = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  ) as { exports: Record<string, Record<string, string>> };

  assert.match(rootSource, /export \* from "\.\/focusRing"/);
  assert.deepEqual(packageJson.exports["./focusRing"], {
    types: "./dist/node/focusRing.d.ts",
    "react-native": "./dist/focusRing.js",
    import: "./dist/node/focusRing.js",
  });
});

test("theme defaults the focus indicator to the ring and honors an override", () => {
  // The theme-wide focus indicator defaults to the shared glow, and every mode
  // can be chosen per theme without touching any component.
  assert.equal(defaultSharedUiTheme.focusIndicator, "ring");
  assert.equal(junoSharedUiTheme.focusIndicator, "ring");
  assert.equal(createSharedUiTheme({}).focusIndicator, "ring");
  for (const focusIndicator of ["ring", "outline", "none"] as const) {
    assert.equal(
      createSharedUiTheme({ focusIndicator }).focusIndicator,
      focusIndicator,
    );
  }
  // An unrelated override must not drop the default (guards the per-key
  // spread in createSharedUiTheme), and a derived theme inherits its base's.
  assert.equal(
    createSharedUiTheme({ colors: { primary: "#123456" } }).focusIndicator,
    "ring",
  );
  const base = createSharedUiTheme({ focusIndicator: "none" });
  assert.equal(
    createSharedUiTheme({ colors: { primary: "#123456" } }, base)
      .focusIndicator,
    "none",
  );
});

test("web theme root injects the DOM backend stylesheet on the client", () => {
  // The provider is the one Firna component a raw-DOM-only page is guaranteed
  // to render, so it must inject `domBackendCss` like View/Text/TextInput do;
  // otherwise `focusRingDomProps` markers have no rules to read them. The
  // native sibling has no stylesheet to inject.
  const web = readFileSync(
    new URL("../../src/themeRoot.web.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    web,
    /import \{ useDomBackendCss \} from "\.\/primitives\/dom\/css"/,
  );
  assert.match(web, /useDomBackendCss\(\);/);
  const native = readFileSync(
    new URL("../../src/themeRoot.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(native, /useDomBackendCss/);
});

test("useFocusRing resolves the focus indicator and its markers", () => {
  // focusRing.ts imports react-native (Platform) and so cannot be imported in
  // the node test runner; assert its wiring at the source level instead,
  // matching the focus-ring convention above. The markers themselves come from
  // the pure `focusRingHostPropsFor`, covered in focusRingHost.test.ts.
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );

  // The per-instance `indicator` option wins over the theme's
  // `focusIndicator`, and only the `ring` mode paints the glow.
  assert.match(source, /indicator\?:\s*FocusIndicator/);
  assert.match(
    source,
    /const indicator = options\.indicator \?\? theme\.focusIndicator/,
  );
  assert.match(source, /const ringEnabled = indicator === "ring"/);
  // Web markers come from the resolved indicator; native gets none.
  assert.match(
    source,
    /Platform\.OS === "web"\s*\? focusRingHostPropsFor\(\{\s*indicator,\s*inset: \(offset \?\? 2\) < 0,\s*target,\s*\}\)\s*: EMPTY_RING_PROPS/,
  );
  // Only the ring paints, so every other mode omits the geometry variables.
  assert.match(source, /!ringEnabled \|\| Platform\.OS !== "web"/);
  // The hook still returns state plus the marker and geometry variables, and
  // the resolved mode so callers can gate focus-only decoration on `none`.
  assert.match(source, /indicator,\s*ringEnabled,/);
  assert.match(source, /focusRingProps,/);
  assert.match(source, /focusVisible:\s*focusState\.focusVisible/);
  assert.match(source, /target\?\.matches\(":focus-visible"\) \?\? true/);
  // A native DOM blur subscription covers React's missed synthetic onBlur when
  // a focused web button becomes disabled during its own press handler.
  assert.match(
    source,
    /target\?\.addEventListener\("blur", clearFocus, \{ once: true \}\)/,
  );
  // Modality can switch while the same element remains focused, so the custom
  // ring must re-read the browser pseudo-class without waiting for another focus.
  assert.match(
    source,
    /target\?\.addEventListener\("keydown", syncFocusVisible\)/,
  );
  assert.match(
    source,
    /target\?\.addEventListener\("pointerdown", syncFocusVisible\)/,
  );
  assert.match(
    source,
    /focusRingVariables:\s*ringEnabled \? focusRingVariables : null/,
  );
  assert.match(
    source,
    /ringEnabled\s*\?\s*focusRingStyleFor\(\{ color, width, offset, alpha \}\)\s*:\s*EMPTY_RING_STYLE/,
  );
  assert.match(source, /webOutlineReset:\s*null as ViewStyle \| null/);
});
