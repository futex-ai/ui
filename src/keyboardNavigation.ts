import { useEffect, type RefObject } from "react";

/**
 * Shared keyboard-navigation primitives for composite widgets.
 *
 * React Native Web maps `accessibilityRole` to ARIA roles, so a radio group,
 * segmented control, calendar grid, or heatmap announces a composite role to
 * assistive tech — but the role is a promise the keyboard must keep. WAI-ARIA
 * authoring practices (and WCAG 2.1 — 2.1.1 Keyboard, A; 4.1.2 Name/Role/Value,
 * A) expect those widgets to be a single Tab stop with arrow keys moving a
 * "roving" focus between items. These helpers centralise that index math and the
 * web key plumbing so each widget wires the same, tested behaviour.
 */

export type NavOrientation = "horizontal" | "vertical" | "grid";

export type NextNavIndexParams = {
  /** `KeyboardEvent.key` (e.g. "ArrowRight", "Home"). */
  key: string;
  /** Currently focused item index. */
  index: number;
  /** Total number of navigable items. */
  count: number;
  /**
   * `"horizontal"` reacts to Left/Right, `"vertical"` to Up/Down, `"grid"` to
   * all four (Up/Down move by a full row). Default `"horizontal"`.
   */
  orientation?: NavOrientation;
  /** Columns per row — required for `"grid"` Up/Down movement. */
  columns?: number;
  /** Wrap around the ends. Default `true`. */
  loop?: boolean;
};

/**
 * Resolves the next focused index for an arrow/Home/End key press, or `null`
 * when the key is not a navigation key (so the caller can ignore it). Pure and
 * unit-testable — focus movement and selection stay in the component.
 */
export function nextNavIndex(params: NextNavIndexParams): number | null {
  const { key, index, count } = params;
  const orientation = params.orientation ?? "horizontal";
  const loop = params.loop ?? true;
  const columns = params.columns ?? 1;

  if (count <= 0) {
    return null;
  }

  const clamp = (value: number): number => {
    if (loop) {
      return ((value % count) + count) % count;
    }
    return Math.max(0, Math.min(count - 1, value));
  };

  const horizontal = orientation === "horizontal" || orientation === "grid";
  const vertical = orientation === "vertical" || orientation === "grid";
  const rowStep = orientation === "grid" ? Math.max(1, columns) : 1;

  switch (key) {
    case "ArrowRight":
      return horizontal ? clamp(index + 1) : null;
    case "ArrowLeft":
      return horizontal ? clamp(index - 1) : null;
    case "ArrowDown":
      return vertical ? clamp(index + rowStep) : null;
    case "ArrowUp":
      return vertical ? clamp(index - rowStep) : null;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/** The `tabIndex` for a roving-focus item: only the active item is tabbable. */
export function rovingTabIndex(index: number, activeIndex: number): 0 | -1 {
  return index === activeIndex ? 0 : -1;
}

/** A focusable host node, as exposed by a react-native-web component ref. */
export type FocusableRef = { focus?: () => void } | null | undefined;

/** Calls `.focus()` on the ref at `index`, guarding against native/null nodes. */
export function focusItemAt(
  refs: ReadonlyArray<RefObject<FocusableRef> | null | undefined>,
  index: number,
): void {
  const node = refs[index]?.current;
  node?.focus?.();
}

/**
 * Registers a capture-phase `keydown` listener on `document` while `active`.
 *
 * react-native-web's `TextInput` swallows a forwarded `onKeyDown`, so widgets
 * built around a text field (the combobox, the dropdown selector filter) cannot
 * receive arrow keys through normal props. Listening on `document` in the
 * capture phase — the pattern already proven in the dropdown selector — lets
 * those widgets handle navigation keys reliably on web.
 */
export function useDocumentKeyCapture(
  active: boolean,
  handler: (event: KeyboardEvent) => void,
): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return;
    }
    const listener = (event: KeyboardEvent) => handler(event);
    document.addEventListener("keydown", listener, true);
    return () => document.removeEventListener("keydown", listener, true);
  }, [active, handler]);
}
