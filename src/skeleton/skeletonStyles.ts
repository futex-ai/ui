import { StyleSheet } from "react-native";

import type { SharedUiRadii, SharedUiTheme } from "../theme";

/** Milliseconds for one full left-to-right sheen sweep across a placeholder. */
export const SKELETON_SWEEP_DURATION = 1300;

/**
 * Peak opacity of the white sheen that sweeps over the placeholder on the light
 * `soft` base. The sheen is a horizontal `transparent → white → transparent`
 * gradient, so only its centre reaches this opacity as it crosses.
 */
export const SKELETON_SHEEN_OPACITY = 0.65;

/**
 * Dark-scheme peak: the same white sweep reads as a glare on a dark base, so
 * it drops to a subtle 0.12 highlight (GitHub-dark-style shimmer).
 */
export const SKELETON_SHEEN_OPACITY_DARK = 0.12;

/** A shared radii token (`sm` / `md` / `lg` / `pill` / …) or an explicit pixel radius. */
export type SkeletonRadius = keyof SharedUiRadii | number;

/** Resolve a {@link SkeletonRadius} token or explicit pixel value into a corner radius. */
export function resolveSkeletonRadius(
  theme: SharedUiTheme,
  radius: SkeletonRadius,
): number {
  return typeof radius === "number" ? radius : theme.radii[radius];
}

/**
 * Build the skeleton's themed styles. The placeholder base uses the decorative
 * `soft` neutral — the same faint fill the mockups use — with `overflow: hidden`
 * so the white sheen sweep is clipped to the placeholder's rounded shape. Like
 * the list separator and the spinner track, the fill carries no content, so it
 * is exempt from text-contrast rules (WCAG 2.1 — 1.4.3 / 1.4.11). The sweep is
 * layered as an animated child by the components, not baked into the stylesheet.
 */
export function createSkeletonStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    placeholder: { backgroundColor: theme.colors.soft, overflow: "hidden" },
  });
}

export type SkeletonStyles = ReturnType<typeof createSkeletonStyles>;
