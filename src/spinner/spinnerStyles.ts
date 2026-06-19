import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";

/**
 * Preset diameters for the shared `sm` / `md` / `lg` size scale. An explicit
 * numeric `size` overrides these. `md` is the 24px default; `sm` is the compact
 * density for dense rows and inline-with-text spinners, and `lg` the roomier
 * density for prominent loading states.
 */
const SPINNER_DIAMETERS: Record<ControlSize, number> = {
  lg: 32,
  md: 24,
  sm: 16,
};

/**
 * Resolve a {@link ControlSize} token or an explicit pixel diameter into the
 * ring geometry. The stroke thickness is derived from the diameter (≈ 1/8,
 * floored at 2px) so every spinner keeps the same stroke-to-size ratio.
 */
export function resolveSpinnerSize(size: ControlSize | number): {
  diameter: number;
  thickness: number;
} {
  const diameter = typeof size === "number" ? size : SPINNER_DIAMETERS[size];
  return { diameter, thickness: Math.max(2, Math.round(diameter / 8)) };
}

export function createSpinnerStyles(diameter: number) {
  return StyleSheet.create({
    // The container holds a stable, non-rotating box so layout and assistive
    // technology see a steady size while only the inner ring spins.
    container: {
      alignItems: "center",
      height: diameter,
      justifyContent: "center",
      width: diameter,
    },
  });
}

export type SpinnerStyles = ReturnType<typeof createSpinnerStyles>;
