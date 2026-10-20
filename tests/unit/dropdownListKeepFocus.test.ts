import assert from "node:assert/strict";
import test from "node:test";

import { dropdownListKeepFocusProps } from "../../src/dropdown/dropdownListKeepFocus";
import type { DropdownListPressEvent } from "../../src/dropdown/dropdownListKeepFocus";

/** A list region 200px wide, right edge at x=300, with a 15px scrollbar. */
const scrollingRegion = {
  clientHeight: 300,
  clientWidth: 185,
  getBoundingClientRect: () => ({ right: 300 }),
  offsetWidth: 200,
  scrollHeight: 900,
};

/** Presses the region and reports whether the default action was cancelled. */
function press(
  props: object,
  event: Omit<DropdownListPressEvent, "preventDefault">,
): boolean {
  const { onMouseDown } = props as {
    onMouseDown?: (event: DropdownListPressEvent) => void;
  };
  let cancelled = false;
  onMouseDown?.({ ...event, preventDefault: () => (cancelled = true) });
  return cancelled;
}

const keepFocus = dropdownListKeepFocusProps({
  inputKeepsFocus: true,
  isWeb: true,
});

test("a primary press on a line of an input-controlled list keeps focus", () => {
  assert.equal(
    press(keepFocus, {
      button: 0,
      clientX: 120,
      currentTarget: scrollingRegion,
    }),
    true,
  );
  // A secondary press keeps its default, so the context menu still opens.
  assert.equal(
    press(keepFocus, {
      button: 2,
      clientX: 120,
      currentTarget: scrollingRegion,
    }),
    false,
  );
});

test("a press on the scrollbar keeps its default", () => {
  assert.equal(
    press(keepFocus, {
      button: 0,
      clientX: 290,
      currentTarget: scrollingRegion,
    }),
    false,
  );
  // Without overflow there is no scrollbar, so the right edge is a line.
  assert.equal(
    press(keepFocus, {
      button: 0,
      clientX: 290,
      currentTarget: { ...scrollingRegion, scrollHeight: 300 },
    }),
    true,
  );
});

test("only an input-controlled list on web keeps focus", () => {
  assert.deepEqual(
    dropdownListKeepFocusProps({ inputKeepsFocus: false, isWeb: true }),
    {},
  );
  assert.deepEqual(
    dropdownListKeepFocusProps({ inputKeepsFocus: true, isWeb: false }),
    {},
  );
});
