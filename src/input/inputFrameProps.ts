/** The props of {@link InputFrame}, the bare bordered input box. */
import type { IconComponent } from "../primitives/icons";
import type { Ref } from "react";
import type {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";

export type InputFrameProps = Omit<TextInputProps, "style"> & {
  /**
   * Space-separated id list of the element(s) describing this input (hint /
   * error text). RNW forwards it as a literal `aria-describedby` on the DOM
   * input — RNW does NOT map `accessibilityHint` to it. (WCAG 2.1 3.3.1 / 3.3.2)
   */
  "aria-describedby"?: string;
  /**
   * Id of the error-message element. Forwarded as a literal `aria-errormessage`;
   * only meaningful while `invalid` (which sets `aria-invalid`). (WCAG 2.1 3.3.1)
   */
  "aria-errormessage"?: string;
  /** Renders the rose invalid border (independent of any message). */
  invalid?: boolean;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /**
   * Box treatment. `framed` (default) draws the bordered surface box; `plain`
   * drops the border, background, and horizontal padding for a chrome-less
   * inline editor embedded in a row (an inline title / label editor), while
   * keeping the focus ring, the clear button, and the invalid / required a11y
   * wiring. `seamless` goes further: it also drops the reserved control height
   * and all padding so the field collapses onto its text and reads as ordinary
   * copy that is invisibly editable — an inline-editable title, cell, or
   * paragraph. It works on a single-line field and a `multiline` one (which
   * grows to fit its content, capped by `maxLines` if set); style the text
   * through `inputStyle` to match the surrounding copy. On `plain` / `seamless`
   * the invalid state has no border to recolor — surface the error via the
   * surrounding field / message instead.
   */
  variant?: "framed" | "plain" | "seamless";
  /**
   * Opt a `multiline` field into auto-grow: it starts at `numberOfLines` rows
   * (the min) and grows one line at a time as content is added, up to `maxLines`
   * rows, after which it scrolls. Ignored on a single-line field, or when
   * `maxLines` is not greater than `numberOfLines`. On web this needs a
   * controlled `value` — growth is measured whenever `value` changes. A
   * `seamless` multiline field auto-grows even without `maxLines` (it grows to
   * fit ALL its content so it reads as body text); pass `maxLines` to cap it.
   */
  maxLines?: number;
  /** Force the active (primary) border, e.g. while an attached popover is open. */
  active?: boolean;
  /**
   * Draw the focus ring *inset* (inside the box) rather than as the default
   * outset glow. An outset glow is clipped by an `overflow: hidden` ancestor, so
   * a chrome-less `plain` / `seamless` field embedded in a table cell, data-grid
   * cell, or truncating card — which has no border to recolor and hides the
   * native outline — should opt in to keep a visible focus indicator (WCAG 2.1
   * 2.4.7). On a zero-padding `seamless` field the inset ring paints over the
   * text edges, so prefer reserving a little padding on the clipping ancestor
   * where you can. Ignored on native, where the OS focus affordance applies.
   */
  focusRingInset?: boolean;
  /**
   * How this field shows keyboard focus. `ring` paints the shared glow around
   * the box; `outline` paints the browser's default outline on the box instead.
   * `none` turns focus styling off completely — no glow, no outline, and no
   * active border while focused (an explicit `active` still applies) — for a
   * field embedded in a surface that shows focus itself; the caller then owns
   * a visible indicator (WCAG 2.1 — 2.4.7 Focus Visible, AA). The clear and
   * suffix buttons keep the browser outline either way. Defaults to the
   * theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  /** Marks the input required (wires `aria-required`). */
  required?: boolean;
  /** Leading decorative icon shown inside the box. */
  prefixIcon?: IconComponent;
  /** Trailing icon shown inside the box, after the clear button. */
  suffixIcon?: IconComponent;
  /**
   * Accessible label for the suffix icon. When set together with
   * {@link onSuffixIconPress} the icon becomes a focusable button; without it,
   * an `onSuffixIconPress` icon stays a mouse-only affordance (out of the tab
   * order and a11y tree) for actions that already have a keyboard path.
   */
  suffixIconLabel?: string;
  /** Press handler for the suffix icon. Omit for a purely decorative icon. */
  onSuffixIconPress?: () => void;
  /** Extra style for the suffix icon wrapper (e.g. an optical nudge). */
  suffixIconStyle?: StyleProp<ViewStyle>;
  /** Show an accessible clear (✕) button while there is a value to remove. */
  clearable?: boolean;
  /**
   * Override the clear button's visibility instead of deriving it from `value`.
   * Use when the value is committed separately from the live input text (e.g.
   * the date field, whose `value` is the typed buffer, not the committed date).
   */
  clearVisible?: boolean;
  /** Press handler for the clear button. Defaults to `onChangeText("")`. */
  onClear?: () => void;
  /** Accessible label for the clear button. Defaults to `Clear {accessibilityLabel}`. */
  clearAccessibilityLabel?: string;
  /** Ref forwarded to the underlying `TextInput` (e.g. for programmatic focus). */
  inputRef?: Ref<TextInput>;
  /** Style for the underlying `TextInput`. */
  inputStyle?: StyleProp<TextStyle>;
  /** Style for the outer box. */
  style?: StyleProp<ViewStyle>;
};
