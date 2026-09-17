/**
 * Accessibility props, roles and state shared by every primitive.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Components/View/ViewAccessibility.d.ts`) so the web build's
 * declarations never reference the `react-native` package. Trimmed to the
 * props the library sets plus the `aria-*` mirrors the shared-UI protocol
 * requires components to emit.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { NativeSyntheticEvent } from "./events";

/** What kind of element assistive technology should announce. */
export type AccessibilityRole =
  | "none"
  | "button"
  | "togglebutton"
  | "link"
  | "search"
  | "image"
  | "keyboardkey"
  | "text"
  | "adjustable"
  | "imagebutton"
  | "header"
  | "summary"
  | "alert"
  | "checkbox"
  | "combobox"
  | "menu"
  | "menubar"
  | "menuitem"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "scrollbar"
  | "spinbutton"
  | "switch"
  | "tab"
  | "tabbar"
  | "tablist"
  | "timer"
  | "list"
  | "toolbar";

/** The ARIA role vocabulary, accepted through the `role` prop. */
export type Role =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "button"
  | "cell"
  | "checkbox"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "dialog"
  | "directory"
  | "document"
  | "feed"
  | "figure"
  | "form"
  | "grid"
  | "group"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "menu"
  | "menubar"
  | "menuitem"
  | "meter"
  | "navigation"
  | "none"
  | "note"
  | "option"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "summary"
  | "switch"
  | "tab"
  | "table"
  | "tablist"
  | "tabpanel"
  | "term"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem";

/** The interaction state assistive technology should report. */
export interface AccessibilityState {
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
  checked?: boolean | "mixed" | undefined;
  busy?: boolean | undefined;
  expanded?: boolean | undefined;
}

/** The value of a range-like element (slider, progress bar). */
export interface AccessibilityValue {
  min?: number | undefined;
  max?: number | undefined;
  now?: number | undefined;
  text?: string | undefined;
}

/** A custom accessibility action offered on an element. */
export type AccessibilityActionInfo = Readonly<{
  name: string;
  label?: string | undefined;
}>;

/** Fired when assistive technology invokes a custom action. */
export type AccessibilityActionEvent = NativeSyntheticEvent<
  Readonly<{ actionName: string }>
>;

/**
 * Accessibility props every primitive accepts.
 *
 * @see https://reactnative.dev/docs/accessibility#accessibility-properties
 */
export interface AccessibilityProps {
  /** Whether the element is an accessibility element in its own right. */
  accessible?: boolean | undefined;
  /** Custom actions offered on the element. */
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo> | undefined;
  /** Invoked when a custom action fires. */
  onAccessibilityAction?:
    | ((event: AccessibilityActionEvent) => void)
    | undefined;
  /** Text read instead of the element's contents. */
  accessibilityLabel?: string | undefined;
  /** Extra hint about what activating the element does. */
  accessibilityHint?: string | undefined;
  /** Id of the element that labels this one. */
  accessibilityLabelledBy?: string | string[] | undefined;
  /** How the element should be announced. */
  accessibilityRole?: AccessibilityRole | undefined;
  /** The element's interaction state. */
  accessibilityState?: AccessibilityState | undefined;
  /** The element's value, for range-like controls. */
  accessibilityValue?: AccessibilityValue | undefined;
  /** How urgently changes inside the element should be announced. */
  accessibilityLiveRegion?: "none" | "polite" | "assertive" | undefined;
  /** Heading depth, honoured when the role is `header`. */
  accessibilityLevel?: number | undefined;
  /** iOS: hide descendants from the screen reader. */
  accessibilityElementsHidden?: boolean | undefined;
  /** iOS: confine the screen reader to this subtree. */
  accessibilityViewIsModal?: boolean | undefined;
  /** iOS: BCP 47 language the element should be read in. */
  accessibilityLanguage?: string | undefined;
  /** Android: whether the element is reported to accessibility services. */
  importantForAccessibility?:
    | "auto"
    | "yes"
    | "no"
    | "no-hide-descendants"
    | undefined;
  /** Android: whether the element takes screen-reader focus only. */
  screenReaderFocusable?: boolean | undefined;
  /** iOS: whether the element keeps its colours when colours are inverted. */
  accessibilityIgnoresInvertColors?: boolean | undefined;
  /** iOS: whether the element appears in the large content viewer. */
  accessibilityShowsLargeContentViewer?: boolean | undefined;
  /** iOS: title used in the large content viewer. */
  accessibilityLargeContentTitle?: string | undefined;
  /** iOS: whether the element blocks keyboard interaction. */
  accessibilityRespondsToUserInteraction?: boolean | undefined;
  /** iOS: fired on the two-finger scrub escape gesture. */
  onAccessibilityEscape?: (() => void) | undefined;
  /** iOS: fired on an accessibility tap. */
  onAccessibilityTap?: (() => void) | undefined;
  /** iOS: fired on the magic tap gesture. */
  onMagicTap?: (() => void) | undefined;
  /** ARIA role; takes precedence over `accessibilityRole` on web. */
  role?: Role | undefined;
  "aria-busy"?: boolean | undefined;
  "aria-checked"?: boolean | "mixed" | undefined;
  "aria-disabled"?: boolean | undefined;
  "aria-expanded"?: boolean | undefined;
  "aria-hidden"?: boolean | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-level"?: number | undefined;
  "aria-live"?: "polite" | "assertive" | "off" | undefined;
  "aria-modal"?: boolean | undefined;
  "aria-selected"?: boolean | undefined;
  "aria-valuemax"?: number | undefined;
  "aria-valuemin"?: number | undefined;
  "aria-valuenow"?: number | undefined;
  "aria-valuetext"?: string | undefined;
}
