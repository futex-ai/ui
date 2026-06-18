import { useMemo, useState } from "react";
import { TextStyle, ViewStyle } from "react-native";

import { useSharedUiTheme } from "./theme";

export const hideWebOutline = { outlineStyle: "none" } as unknown as TextStyle;

export const hideWebOutlineView = {
  outlineStyle: "none",
} as unknown as ViewStyle;

/** Pressable style-callback state, widened with react-native-web's `hovered`. */
export type PressableHoverState = { pressed: boolean; hovered?: boolean };

export type FocusRingOptions = {
  /**
   * Ring color. Defaults to the active theme's `primary`. Pass a higher-contrast
   * value when the control sits on a tinted/primary surface so the ring keeps a
   * 3:1 contrast against its backdrop (WCAG 2.1 — 1.4.11 Non-text Contrast, AA).
   */
  color?: string;
  /** Ring thickness in px. Default 2. */
  width?: number;
  /**
   * Outline offset in px. A positive value draws the ring just outside the box;
   * pass a negative value to inset the ring when the control lives inside an
   * `overflow: hidden` ancestor (e.g. the segmented pill, switch track) that
   * would otherwise clip an outset outline. Default 2.
   */
  offset?: number;
};

/**
 * Builds a geometry-bearing focus ring style.
 *
 * Older callers relied on `focusRingStyle` only recoloring an existing border,
 * which left borderless controls (the switch track, the segmented pill) with no
 * visible keyboard-focus indicator. This now layers a real `outline` ring on top
 * of the border recolor so every control — bordered or not — satisfies WCAG 2.1
 * Focus Visible (2.4.7, AA). `outline` is painted outside the layout box, so it
 * adds no layout shift; on native the `outline*` props are inert and the OS
 * focus affordance applies instead.
 */
export function focusRingStyleFor(options: FocusRingOptions): ViewStyle {
  const { color, width = 2, offset = 2 } = options;
  return {
    borderColor: color,
    outlineStyle: "solid",
    outlineColor: color,
    outlineWidth: width,
    outlineOffset: offset,
  } as unknown as ViewStyle;
}

export function useFocusRing(options: FocusRingOptions = {}) {
  const [focused, setFocused] = useState(false);
  const theme = useSharedUiTheme();
  const color = options.color ?? theme.colors.primary;
  const { width, offset } = options;
  const focusRingStyle = useMemo<ViewStyle>(
    () => focusRingStyleFor({ color, width, offset }),
    [color, width, offset],
  );
  return {
    focusRingStyle,
    focused,
    onBlur: () => setFocused(false),
    onFocus: () => setFocused(true),
  };
}
