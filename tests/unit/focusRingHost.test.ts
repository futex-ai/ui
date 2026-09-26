import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { focusRingDomPropsFor } from "../../src/focusRingHost";

test("focusRingDomPropsFor spells every dataSet marker as its DOM attribute", () => {
  assert.deepEqual(
    focusRingDomPropsFor({
      dataSet: {
        firnaFocusHost: "descendant",
        firnaFocusRing: "descendant",
        firnaFocusRingInset: "true",
      },
    }),
    {
      "data-firna-focus-host": "descendant",
      "data-firna-focus-ring": "descendant",
      "data-firna-focus-ring-inset": "true",
    },
  );
  assert.deepEqual(
    focusRingDomPropsFor({ dataSet: { firnaFocusTarget: "true" } }),
    {
      "data-firna-focus-target": "true",
    },
  );
});

test("focusRingDomPropsFor drops unset markers and empty hosts", () => {
  // A `self` host sets `firnaFocusHost: undefined`; that must not become a
  // literal `data-firna-focus-host="undefined"` attribute on the DOM element.
  assert.deepEqual(
    focusRingDomPropsFor({
      dataSet: { firnaFocusHost: undefined, firnaFocusRing: "self" },
    }),
    { "data-firna-focus-ring": "self" },
  );
  assert.deepEqual(focusRingDomPropsFor({}), {});
  // The empty result is a stable frozen object, safe to spread on every render.
  assert.equal(focusRingDomPropsFor({}), focusRingDomPropsFor({}));
});

test("useFocusRing returns DOM-spelled markers beside the dataSet ones", () => {
  // focusRing.ts reaches `Platform` through the primitives seam, so its wiring
  // is asserted at the source level like the other focus-ring tests.
  const source = readFileSync(
    new URL("../../src/focusRing.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /focusRingDomProps = useMemo<FocusRingDomProps>/);
  assert.match(source, /focusRingDomPropsFor\(focusRingProps\)/);
  assert.match(source, /focusTargetDomProps = useMemo<FocusRingDomProps>/);
  assert.match(source, /focusRingDomPropsFor\(focusTargetProps\)/);
  assert.match(source, /focusRingDomProps,\s*focusTargetDomProps,/);
  // The variables are typed for both a primitive `style` and a DOM `style`.
  assert.match(
    source,
    /export type FocusRingVariables = ViewStyle & CSSProperties/,
  );
});

test("the rich text editor marks its contentEditable target through the hook", () => {
  const source = readFileSync(
    new URL("../../src/rich-text/RichTextEditor.web.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /<div\s+\{\.\.\.focus\.focusTargetDomProps\}/);
  assert.doesNotMatch(source, /data-firna-focus-target="true"/);
});
