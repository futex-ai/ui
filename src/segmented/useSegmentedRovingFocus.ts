/**
 * Roving keyboard focus across the options of {@link SegmentedControl}: the
 * group is one Tab stop, and the arrow, Home, and End keys move focus past
 * disabled options and select the option they land on.
 */
import { useCallback, useRef } from "react";

import {
  type FocusableRef,
  focusItemAt,
  nextNavIndex,
} from "../keyboardNavigation";

import type { SegmentOption } from "./segmentedControlTypes";

export function useSegmentedRovingFocus<T extends string>({
  disabled,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  value: T;
}) {
  // Each segment needs a focusable ref so arrow keys can move a roving focus
  // between options (WCAG 2.1.1 Keyboard / 4.1.2). The whole group is a single
  // Tab stop: only the active option carries `tabIndex 0`.
  const itemRefs = useRef<{ current: FocusableRef }[]>([]);
  itemRefs.current = options.map(
    (_, index) => itemRefs.current[index] ?? { current: null },
  );

  // The roving tab stop is the selected option, falling back to the first
  // enabled option when the selected value is itself disabled/absent.
  const selectedIndex = options.findIndex((option) => option.value === value);
  const firstEnabledIndex = options.findIndex(
    (option) => !(disabled || option.disabled === true),
  );
  const activeIndex =
    selectedIndex >= 0 &&
    !(disabled || options[selectedIndex]?.disabled === true)
      ? selectedIndex
      : firstEnabledIndex;

  const moveFocus = useCallback(
    (key: string, fromIndex: number) => {
      const count = options.length;
      if (count === 0) {
        return;
      }
      let nextIndex = nextNavIndex({
        key,
        index: fromIndex,
        count,
        orientation: "horizontal",
      });
      if (nextIndex === null) {
        return;
      }
      // Skip disabled options in the arrow direction, wrapping with the helper.
      const forward = key === "ArrowRight" || key === "Home";
      let guard = 0;
      while (
        (disabled || options[nextIndex]?.disabled === true) &&
        guard < count
      ) {
        const step = nextNavIndex({
          key: forward ? "ArrowRight" : "ArrowLeft",
          index: nextIndex,
          count,
          orientation: "horizontal",
        });
        if (step === null) {
          return;
        }
        nextIndex = step;
        guard += 1;
      }
      if (disabled || options[nextIndex]?.disabled === true) {
        return;
      }
      focusItemAt(itemRefs.current, nextIndex);
      // Follow the APG radio pattern: moving focus selects the option.
      const nextValue = options[nextIndex]?.value;
      if (nextValue !== undefined && nextValue !== value) {
        onChange(nextValue);
      }
    },
    [disabled, onChange, options, value],
  );

  return { activeIndex, itemRefs, moveFocus, selectedIndex };
}
