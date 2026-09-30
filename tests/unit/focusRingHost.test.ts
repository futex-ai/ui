import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  focusRingDomPropsFor,
  focusRingHostPropsFor,
  type FocusRingTarget,
} from "../../src/focusRingHost";

const TARGETS: FocusRingTarget[] = ["self", "descendant", "parent"];

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

test("focusRingDomPropsFor spells the no-indicator marker", () => {
  for (const target of TARGETS) {
    assert.deepEqual(
      focusRingDomPropsFor({ dataSet: { firnaFocusNone: target } }),
      { "data-firna-focus-none": target },
    );
  }
});

test("the ring marks the painted box for the glow", () => {
  assert.deepEqual(
    focusRingHostPropsFor({ indicator: "ring", inset: false, target: "self" }),
    { dataSet: { firnaFocusRing: "self" } },
  );
  assert.deepEqual(
    focusRingHostPropsFor({
      indicator: "ring",
      inset: true,
      target: "descendant",
    }),
    {
      dataSet: {
        firnaFocusHost: "descendant",
        firnaFocusRing: "descendant",
        firnaFocusRingInset: "true",
      },
    },
  );
  assert.deepEqual(
    focusRingHostPropsFor({
      indicator: "ring",
      inset: false,
      target: "parent",
    }),
    { dataSet: { firnaFocusHost: "parent", firnaFocusRing: "parent" } },
  );
});

test("the outline leaves a self box unmarked and moves split outlines", () => {
  // A `self` control keeps the browser's own outline untouched; a split
  // control marks only its visible box, so the outline lands there instead of
  // on the hidden focus target.
  const self = focusRingHostPropsFor({
    indicator: "outline",
    inset: true,
    target: "self",
  });
  assert.deepEqual(self, {});
  assert.ok(Object.isFrozen(self));
  for (const target of ["descendant", "parent"] as const) {
    assert.deepEqual(
      focusRingHostPropsFor({ indicator: "outline", inset: true, target }),
      { dataSet: { firnaFocusHost: target } },
    );
  }
});

test("none carries only the no-indicator marker for every target", () => {
  // No glow marker, no host marker (which would restore the browser outline on
  // the box), and no inset flag: the box is marked only so the stylesheet can
  // strip the browser outline from its focus target.
  for (const target of TARGETS) {
    for (const inset of [false, true]) {
      assert.deepEqual(
        focusRingHostPropsFor({ indicator: "none", inset, target }),
        { dataSet: { firnaFocusNone: target } },
      );
    }
  }
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
