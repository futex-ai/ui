/** Public types for drag-selectable target state and subscriptions. */
import type { ReactNode } from "react";
import type {
  AccessibilityRole,
  AccessibilityState,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

import type { DragSelectableBox } from "./dragSelectableModel";

export type DragSelectableTargetSnapshot = {
  data?: unknown;
  id: string;
};

export type DragSelectableSelection = {
  selectedCount: number;
  selectedIds: string[];
  selectedTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableSelectionLabelContext = {
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableSelectionLabel = (
  count: number,
  context: DragSelectableSelectionLabelContext,
) => string;

export type DragSelectableState = DragSelectableSelection & {
  dragBox: DragSelectableBox | null;
  dragging: boolean;
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableChangeListener = (state: DragSelectableState) => void;

/**
 * Builds the screen-reader announcement spoken (politely, without moving focus)
 * each time the committed selection count changes. Receives the new count plus
 * the full selection so consumers can name the items.
 */
export type DragSelectableSelectionAnnouncement = (
  count: number,
  selection: DragSelectableSelection,
) => string;

export type DragSelectableProviderProps = {
  /**
   * Accessible name for the selectable group container. Exposed via
   * `accessibilityRole` (`list`/`group`) + `accessibilityLabel` so assistive
   * tech announces the collection of selectable targets (WCAG 2.1 — 1.3.1, A).
   */
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  minimumDragDistance?: number;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  overlayZIndex?: number;
  /**
   * Container ARIA role. Defaults to `"group"`. Pass `"list"` (with targets
   * laid out like list items) for a single-axis collection.
   */
  role?: "group" | "list";
  /**
   * Customizes the polite live-region announcement made whenever the committed
   * selection count changes (WCAG 2.1 — 4.1.3 Status Messages, AA). Return an
   * empty string to suppress the announcement.
   */
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
  selectionLabel?: DragSelectableSelectionLabel;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export type DragSelectableTargetOptions = {
  data?: unknown;
  disabled?: boolean;
  id: string;
  /**
   * Accessible name for the target. Defaults to the target `id`. Surfaced as
   * `accessibilityLabel` on the spreadable `a11yProps` so each selectable item
   * has a programmatic name (WCAG 2.1 — 4.1.2 Name, Role, Value, A; 2.5.3 Label
   * in Name, A — pass the visible label here).
   */
  label?: string;
  /**
   * Explicit position of the target within the group for keyboard arrow
   * navigation. When omitted, registration order (DOM order) is used.
   */
  order?: number;
};

/**
 * Spreadable accessibility + keyboard props for a selectable target. Spread
 * these onto the target's outer `View`/`Pressable` so it becomes a focusable,
 * keyboard-toggleable `checkbox` with correct role/state — the non-pointer
 * alternative to the marquee (WCAG 2.1 — 2.5.1 Pointer Gestures, A; 2.1.1
 * Keyboard, A; 4.1.2 Name, Role, Value, A).
 */
export type DragSelectableTargetAccessibilityProps = {
  accessibilityLabel?: string;
  accessibilityRole: AccessibilityRole;
  accessibilityState: AccessibilityState;
  "aria-checked"?: boolean;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown?: (event: DragSelectableTargetKeyEvent) => void;
  tabIndex?: 0 | -1;
};

export type DragSelectableTargetKeyEvent = {
  key?: string;
  shiftKey?: boolean;
  nativeEvent?: { key?: string; shiftKey?: boolean };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type DragSelectableTargetResult = {
  /**
   * Accessibility + keyboard props to spread onto the target. Makes the target
   * a focusable `checkbox` with Space/Enter toggle and arrow-key roving nav.
   */
  a11yProps: DragSelectableTargetAccessibilityProps;
  dragging: boolean;
  /** True while this target shows keyboard focus; pair with `focusRingStyle`. */
  focused: boolean;
  /** Geometry-bearing focus ring style; apply when `focused` (WCAG 2.4.7, AA). */
  focusRingStyle: ViewStyle;
  matching: boolean;
  ref: (node: View | null) => void;
  selected: boolean;
};

export type DragSelectableTargetRegistration = DragSelectableTargetOptions & {
  node: View;
};
