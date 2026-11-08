/**
 * The box of an action inside a framed field, such as Clear. The text field,
 * the date trigger, and the chip removal read it, so their actions keep one
 * target size. The family entry does not export it.
 */
import type { ControlSize } from "../controlSize";

import { inputSizeTokens, touchInputSizeTokens } from "./inputSizing";

/**
 * The action size of a field at the size that its caller asked for: 24px at
 * `xs` and 44px on a touch surface, from the shared input sizing. A family that
 * draws `xs` with its `sm` metrics reads it before that fallback, so its
 * actions keep the dense target. The other sizes give no action box.
 */
export function fieldActionSize(
  size: ControlSize,
  touch: boolean,
): number | undefined {
  return (touch ? touchInputSizeTokens() : inputSizeTokens(size)).actionSize;
}

/**
 * A square box of `actionSize` around an action's icon: 24px at `xs` and 44px
 * on a touch surface, from the shared input sizing. A size without an action
 * box keeps the action as large as its icon.
 */
export function fieldActionBoxStyle(actionSize: number | undefined):
  | {
      alignItems: "center";
      justifyContent: "center";
      height?: undefined;
      width?: undefined;
    }
  | {
      alignItems: "center";
      height: number;
      justifyContent: "center";
      width: number;
    } {
  if (actionSize === undefined) {
    return { alignItems: "center", justifyContent: "center" };
  }
  return {
    alignItems: "center",
    height: actionSize,
    justifyContent: "center",
    width: actionSize,
  };
}
