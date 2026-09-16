/**
 * `StyleSheet`, as the identity registry the DOM backend needs.
 *
 * Styles are translated per render by `resolveStyle.ts` rather than compiled
 * into classes (plan Decision 2), so `create` only has to hand its argument
 * back. `hairlineWidth` is `1` for the reason `react-native-web` documents:
 * a sub-pixel line can round to zero and disappear.
 */
import type { StyleProp, StyleSheetStatic } from "../types";

import { flattenStyle } from "./resolveStyle";

const absoluteFillObject = {
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
} as const;

export const StyleSheet: StyleSheetStatic = {
  absoluteFill: absoluteFillObject,
  absoluteFillObject,
  compose: ((style1: unknown, style2: unknown) => [
    style1,
    style2,
  ]) as StyleSheetStatic["compose"],
  create: (styles) => styles,
  flatten: (<T>(style?: StyleProp<T>) =>
    flattenStyle(style)) as StyleSheetStatic["flatten"],
  hairlineWidth: 1,
};
