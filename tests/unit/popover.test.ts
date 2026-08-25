import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  popoverTriggerProps,
  resolvePopoverOpen,
} from "../../src/popover/popoverModel";

test("popover open state follows internal state when uncontrolled", () => {
  assert.deepEqual(resolvePopoverOpen(undefined, false), {
    controlled: false,
    open: false,
  });
  assert.deepEqual(resolvePopoverOpen(undefined, true), {
    controlled: false,
    open: true,
  });
});

test("popover open state follows the controlled prop and ignores internal state", () => {
  assert.deepEqual(resolvePopoverOpen(true, false), {
    controlled: true,
    open: true,
  });
  assert.deepEqual(resolvePopoverOpen(false, true), {
    controlled: true,
    open: false,
  });
});

test("popover trigger props expose expanded state and the toggle handler", () => {
  const toggle = () => undefined;
  const closed = popoverTriggerProps(false, toggle);
  // Flat top-level `aria-*` props (no nested accessibilityState) so a
  // consumer's own accessibilityState can't clobber the expanded state.
  // `aria-haspopup` defaults to the generic "true" token, and `aria-controls`
  // is only advertised while the controlled surface is mounted (WCAG 1.3.1).
  assert.deepEqual(closed, {
    "aria-controls": undefined,
    "aria-expanded": false,
    "aria-haspopup": "true",
    onPress: toggle,
  });
  assert.equal(closed.onPress, toggle);

  // When open, the trigger advertises the surface id it controls.
  const open = popoverTriggerProps(true, toggle, { surfaceId: "popover-1" });
  assert.equal(open["aria-expanded"], true);
  assert.equal(open["aria-controls"], "popover-1");
  // A `dialog` surface advertises the matching `aria-haspopup` token.
  assert.equal(
    popoverTriggerProps(true, toggle, { hasPopup: "dialog" })["aria-haspopup"],
    "dialog",
  );
});

test("popover forwards z-index overrides to its dropdown portal", () => {
  const source = readSource("../../src/popover/Popover.tsx");

  assert.match(source, /zIndex\?: number;/);
  assert.match(source, /zIndex=\{zIndex\}/);
});

test("popover forwards the anchor-width sizing policy", () => {
  const source = readSource("../../src/popover/Popover.tsx");

  assert.match(source, /anchorWidthAsMinimum=\{anchorWidthAsMinimum\}/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
