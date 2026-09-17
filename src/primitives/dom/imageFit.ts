/**
 * `resizeMode` to the CSS `object-fit` that frames a picture the same way.
 *
 * `react-native-web`'s `Image` reads the mode from the prop *or* the flattened
 * style (`props.resizeMode || flatStyle.resizeMode || 'cover'`), so both
 * spellings are honoured here. The style key itself never reaches the DOM —
 * `IGNORED_STYLE_PROPS` drops it, exactly as that backend's `preprocess` did.
 */
import type { CSSProperties } from "react";

import type { ImageResizeMode } from "../types";

import { flattenStyle, type StyleInput } from "./resolveStyle";

const OBJECT_FIT: Record<ImageResizeMode, CSSProperties["objectFit"]> = {
  center: "none",
  contain: "contain",
  cover: "cover",
  none: "none",
  // CSS has no tiling for a replaced element; `none` at least keeps the scale.
  repeat: "none",
  stretch: "fill",
};

/** The `object-fit` an `Image` should paint with. */
export function objectFitFor(
  resizeMode: ImageResizeMode | undefined,
  style: StyleInput,
): CSSProperties["objectFit"] {
  const fromStyle = flattenStyle(style).resizeMode;
  const mode =
    resizeMode ??
    (typeof fromStyle === "string"
      ? (fromStyle as ImageResizeMode)
      : undefined);
  return OBJECT_FIT[mode ?? "cover"] ?? "cover";
}
