/**
 * The shape vocabulary shared by the loader family.
 *
 * `LoaderVariant` is the public switch on {@link Loader}; `LoaderShapeProps` is
 * the internal contract every shape renderer receives once {@link Loader} has
 * resolved the theme color, the cycle length, and the pixel box.
 */
import type { ColorValue } from "react-native";

/**
 * The indeterminate loading shapes.
 *
 * - `ring` — the {@link Spinner} ring, an accent arc turning over a faint track.
 * - `dot-grid` — nine dots on a 3×3 grid lit by a diagonal wave.
 * - `dots` — three dots in a row bouncing in sequence.
 * - `bars` — four vertical bars rising and falling like an equalizer.
 * - `blades` — ten spokes around a circle, brightening in turn.
 * - `pulse` — concentric rings expanding outward and fading.
 */
export type LoaderVariant =
  | "bars"
  | "blades"
  | "dot-grid"
  | "dots"
  | "pulse"
  | "ring";

/**
 * What a shape renderer needs from {@link Loader}. The shapes are decorative:
 * the labelled `progressbar` container is owned by {@link Loader}, so a shape
 * never carries its own accessibility semantics or `testID`.
 */
export type LoaderShapeProps = {
  /**
   * Resolved accent color — already defaulted to the theme primary. Typed as a
   * `ColorValue` rather than a `string` because every shape feeds it straight
   * into a `backgroundColor` or `borderColor`, so a caller can hand over any
   * React Native color — {@link Avatar} forwards its `textColor` override.
   */
  color: ColorValue;
  /** Resolved cycle length in milliseconds for one full animation loop. */
  duration: number;
  /** Resolved box size in pixels; every shape draws inside a `size` square. */
  size: number;
};
