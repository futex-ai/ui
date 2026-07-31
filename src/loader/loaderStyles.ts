import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import { resolveSpinnerSize } from "../spinner/spinnerStyles";

import type { LoaderVariant } from "./types";

/**
 * Cycle length in milliseconds for one full loop of each shape, used when the
 * caller does not pass a `duration`. They differ on purpose: a travelling wave
 * over nine dots needs longer to read than a three-dot bounce, and a ripple
 * needs longer still to look like it is expanding rather than flickering. The
 * `ring` entry matches the {@link Spinner} default so `<Loader />` and
 * `<Spinner />` turn at the same rate.
 */
export const LOADER_DURATIONS: Record<LoaderVariant, number> = {
  bars: 900,
  blades: 900,
  "dot-grid": 1200,
  dots: 1000,
  pulse: 1600,
  ring: 800,
};

/**
 * Resolve a {@link ControlSize} token or an explicit pixel size into the
 * loader's box height. This deliberately reuses the {@link Spinner} scale
 * (`sm` 16 / `md` 24 / `lg` 32) so any variant can be swapped in wherever a
 * spinner sits without the surrounding layout shifting.
 */
export function resolveLoaderSize(size: ControlSize | number): number {
  return resolveSpinnerSize(size).diameter;
}

/**
 * The labelled container every non-ring shape is drawn inside. It keeps a fixed
 * box so layout and assistive technology see a steady size while the shape
 * animates, and centres shapes that are narrower than their box.
 */
export function createLoaderStyles(size: number) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      height: size,
      justifyContent: "center",
    },
  });
}

export type LoaderStyles = ReturnType<typeof createLoaderStyles>;
