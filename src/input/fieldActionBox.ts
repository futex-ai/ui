/**
 * The box of an action inside a framed field, such as Clear. The text field
 * and the date trigger both read it, so their actions keep one target size.
 * The family entry does not export it.
 */

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
