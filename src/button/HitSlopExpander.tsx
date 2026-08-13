/**
 * Makes {@link ButtonBaseProps.hitSlop} real on web.
 *
 * React Native honours `hitSlop` on a `Pressable` itself. React Native Web does
 * not: its `Pressable` never reads the prop — only the legacy `Touchable`
 * export does — so on web it is silently inert, which is the platform the
 * consumers asking for it are on.
 *
 * The web equivalent is an absolutely-positioned, transparent child inset by
 * the negative slop. It is inside the pressable, so a pointer event that lands
 * on it bubbles to the button and presses it, and `position: absolute` keeps it
 * out of the flow so the visible box never moves. It sits above the label, but
 * it is transparent and every event it catches belongs to the button anyway.
 *
 * The expanded area overlaps whatever sits beside the control, exactly as a
 * native `hitSlop` does — so slop is for a control with room around it, not one
 * packed against its neighbours.
 */
import { Insets, Platform, StyleSheet, View } from "react-native";

/** Resolves the shorthand (`number`) and per-edge (`Insets`) forms to insets. */
export function hitSlopInsets(hitSlop: number | Insets): Required<Insets> {
  if (typeof hitSlop === "number") {
    return { bottom: hitSlop, left: hitSlop, right: hitSlop, top: hitSlop };
  }
  return {
    bottom: hitSlop.bottom ?? 0,
    left: hitSlop.left ?? 0,
    right: hitSlop.right ?? 0,
    top: hitSlop.top ?? 0,
  };
}

export type HitSlopExpanderProps = {
  /** The slop to expand by, in the shorthand or per-edge form. */
  hitSlop?: number | Insets;
};

/**
 * The expander, or nothing on native (where the platform already honours
 * `hitSlop`) and when no slop was asked for.
 */
export function HitSlopExpander({ hitSlop }: HitSlopExpanderProps) {
  if (hitSlop == null || Platform.OS !== "web") {
    return null;
  }
  const insets = hitSlopInsets(hitSlop);
  return (
    <View
      aria-hidden
      style={[
        styles.expander,
        {
          bottom: -insets.bottom,
          left: -insets.left,
          right: -insets.right,
          top: -insets.top,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  expander: { position: "absolute" },
});
