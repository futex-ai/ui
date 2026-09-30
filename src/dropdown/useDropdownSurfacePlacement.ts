/** Web placement for portal surfaces, from their own measured height. */
import { useEffect, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import type { View } from "../primitives/reactNative";

import {
  type DropdownAnchorRect,
  type DropdownPlacement,
  type DropdownPlacementOptions,
  type DropdownViewport,
  dropdownMeasuringPlacement,
  dropdownPlacement,
} from "./dropdownGeometry";

// Measure before paint, falling back to useEffect during server pre-render.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type MeasurableNode = { getBoundingClientRect?: () => { height: number } };

/** Where a web portal surface renders, and whether it has been measured. */
export type DropdownSurfacePlacement = {
  /**
   * `false` while the surface renders at its natural height only to be
   * measured; that layout is replaced before the browser paints, so effects
   * that read the surface's geometry should wait for `true`.
   */
  measured: boolean;
  /** Where to render the surface, or `null` while there is no anchor. */
  placement: DropdownPlacement | null;
};

/**
 * Places a web portal surface by its own rendered height.
 *
 * The height is unknown until the surface renders, so its first layout is
 * clamped only by `maxHeight`, a layout effect measures it, and it is placed
 * again — below the anchor when that height fits there, otherwise on the
 * roomier side — before the browser paints. It is measured once per open, so
 * content that changes size while open (a filtered list, a paged month) keeps
 * the surface on its side instead of jumping it across the anchor. Pass a
 * `null` anchor while closed, so the next open measures afresh.
 */
export function useDropdownSurfacePlacement(
  surfaceRef: RefObject<View | null>,
  anchor: DropdownAnchorRect | null,
  viewport: DropdownViewport,
  options: DropdownPlacementOptions,
  preferredWidth?: number,
): DropdownSurfacePlacement {
  const [surfaceHeight, setSurfaceHeight] = useState<number>();
  const anchored = anchor !== null;

  useIsoLayoutEffect(() => {
    if (!anchored) {
      setSurfaceHeight(undefined);
      return;
    }
    if (surfaceHeight !== undefined) {
      return;
    }
    const node = surfaceRef.current as unknown as MeasurableNode | null;
    const height = node?.getBoundingClientRect?.().height;
    if (height !== undefined && height > 0) {
      setSurfaceHeight(height);
    }
  }, [anchored, surfaceHeight, surfaceRef]);

  if (!anchor) {
    return { measured: false, placement: null };
  }
  if (surfaceHeight === undefined) {
    return {
      measured: false,
      placement: dropdownMeasuringPlacement(
        anchor,
        viewport,
        options,
        preferredWidth,
      ),
    };
  }
  return {
    measured: true,
    placement: dropdownPlacement(
      anchor,
      viewport,
      options,
      preferredWidth,
      surfaceHeight,
    ),
  };
}
