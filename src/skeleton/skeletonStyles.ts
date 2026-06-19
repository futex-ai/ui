import { StyleSheet } from "react-native";

import type { SharedUiRadii, SharedUiTheme } from "../theme";

/**
 * Opacity bounds the placeholder breathes between while pulsing. The fill stays
 * fully opaque at the top of the breath and fades to {@link SKELETON_OPACITY_MIN}
 * at the bottom, so the placeholder reads as a calm "loading" shimmer rather than
 * a hard blink.
 */
export const SKELETON_OPACITY_MAX = 1;
export const SKELETON_OPACITY_MIN = 0.45;

/** Milliseconds for one full breathe (fade out and back in). */
export const SKELETON_PULSE_DURATION = 1200;

/**
 * Opacity shown when the user prefers reduced motion: a clear, static placeholder
 * (still an obvious "loading" affordance) instead of an animated pulse — best
 * practice for WCAG 2.1 — 2.3.3 Animation from Interactions (AAA).
 */
export const SKELETON_STATIC_OPACITY = SKELETON_OPACITY_MAX;

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
 * Build the skeleton's themed styles. The placeholder fill uses the decorative
 * `border2` neutral: it is visible on a surface yet, like the list separator and
 * the spinner track, carries no content, so it is exempt from text-contrast
 * rules (WCAG 2.1 — 1.4.3 / 1.4.11). The pulse is layered as an animated
 * `opacity` by the components, not baked into the stylesheet.
 */
export function createSkeletonStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    placeholder: { backgroundColor: theme.colors.border2 },
  });
}

export type SkeletonStyles = ReturnType<typeof createSkeletonStyles>;
