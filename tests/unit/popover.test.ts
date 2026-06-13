import assert from "node:assert/strict";
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
  // A single flat `aria-expanded` (no nested accessibilityState) so a
  // consumer's own accessibilityState can't clobber the expanded state.
  assert.deepEqual(closed, {
    "aria-expanded": false,
    onPress: toggle,
  });
  assert.equal(closed.onPress, toggle);
  assert.equal(popoverTriggerProps(true, toggle)["aria-expanded"], true);
});
