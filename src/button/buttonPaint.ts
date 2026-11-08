/**
 * How a {@link Button} paints: its label colour, its shape, and its tone and
 * interaction-state layers. `LinkButton` paints with the same functions, so a
 * link looks like the button of the same tone and size.
 */
import type { ViewStyle } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

import type { ButtonShape, ButtonTone } from "./buttonProps";
import {
  buttonHeight,
  onMediaLabelColor,
  type ButtonStyles,
} from "./buttonStyles";
import { touchButtonShapeStyle } from "./buttonTouch";

/**
 * The label (and any leading lucide icon) colour of a tone. `plain` shares the
 * neutral `ink` of `secondary` — it differs only in its (absent) chrome, and
 * `onMedia` keeps a fixed white because it sits on imagery, not a surface.
 */
export function buttonLabelColor(
  theme: SharedUiTheme,
  tone: ButtonTone,
): string {
  return tone === "primary"
    ? theme.colors.onSolid
    : tone === "danger"
      ? theme.colors.rose
      : tone === "ghost"
        ? theme.colors.primaryDeep
        : tone === "onMedia"
          ? onMediaLabelColor()
          : theme.colors.ink;
}

/**
 * The geometry a shape adds to the button box. `square` / `circle` render a
 * 1:1 box (equal padding): `boxSize` sets it outright, otherwise the size's
 * track height floored at any `minTouchTarget`; `circle` swaps in the pill
 * radius. On the default `rounded` shape a bare `minTouchTarget` still
 * enforces a min tap target without forcing the aspect ratio. A face that
 * draws the touch metrics takes the touch geometry instead.
 */
export function buttonShapeStyle({
  boxSize,
  minTouchTarget,
  shape,
  size,
  theme,
  touchFace,
}: {
  boxSize: number | undefined;
  minTouchTarget: number | undefined;
  shape: ButtonShape;
  size: ControlSize;
  theme: SharedUiTheme;
  touchFace: boolean;
}): ViewStyle | null {
  if (touchFace) {
    return touchButtonShapeStyle({
      boxSize,
      minTouchTarget,
      pillRadius: theme.radii.pill,
      shape,
    });
  }
  if (shape === "square" || shape === "circle") {
    const dimension =
      boxSize ?? Math.max(buttonHeight(size), minTouchTarget ?? 0);
    return {
      height: dimension,
      paddingHorizontal: 0,
      width: dimension,
      ...(shape === "circle" ? { borderRadius: theme.radii.pill } : null),
    };
  }
  if (minTouchTarget != null) {
    return { minHeight: minTouchTarget, minWidth: minTouchTarget };
  }
  return null;
}

/** What decides the paint of a button in one interaction state. */
export type ButtonPaintInput = {
  block: boolean;
  /** The press handler is blocked by an in-progress action. */
  busy: boolean;
  /** Explicitly disabled, or left without an `onPress`. */
  disabledState: boolean;
  hovered: boolean;
  /** The line-height-neutral inline chip applies. */
  inlineChip: boolean;
  pressed: boolean;
  shapeStyle: ViewStyle | null;
  styles: ButtonStyles;
  tone: ButtonTone;
};

/**
 * The tone, shape, and state layers of the button box, in paint order. The
 * caller's own style and the focus-ring variables layer after them.
 */
export function buttonPaintLayers({
  block,
  busy,
  disabledState,
  hovered,
  inlineChip,
  pressed,
  shapeStyle,
  styles,
  tone,
}: ButtonPaintInput) {
  return [
    styles.button,
    tone === "primary" ? styles.primary : null,
    tone === "ghost" ? styles.ghost : null,
    tone === "plain" ? styles.plain : null,
    tone === "danger" ? styles.danger : null,
    tone === "onMedia" ? styles.onMedia : null,
    block ? styles.block : null,
    // The inline chip drops the fixed track height and collapses to the label
    // line height, layering after the tone styles so the tone fill/border
    // still show. It is gated (see `inlineChip`) to the plain rounded shape
    // with no competing size intent, so it never fights `block` / `shapeStyle`.
    inlineChip ? styles.inline : null,
    // The shape override (1:1 box / min tap target) sits after `block` so a
    // fixed square size wins over `block`'s full-width stretch.
    shapeStyle,
    // Hover layers over the tone fill but never while disabled or busy. It
    // sits before the focus ring (a box-shadow on a different paint
    // channel), so a focused + hovered button shows the deeper fill inside
    // its ring.
    hovered && !disabledState && !busy && tone === "primary"
      ? styles.primaryHover
      : null,
    hovered && !disabledState && !busy && tone === "secondary"
      ? styles.secondaryHover
      : null,
    hovered && !disabledState && !busy && tone === "ghost"
      ? styles.ghostHover
      : null,
    hovered && !disabledState && !busy && tone === "plain"
      ? styles.plainHover
      : null,
    hovered && !disabledState && !busy && tone === "danger"
      ? styles.dangerHover
      : null,
    hovered && !disabledState && !busy && tone === "onMedia"
      ? styles.onMediaHover
      : null,
    // Every tone takes a pressed treatment, deeper than its hover, so an
    // active press reads on a filled control as well as a borderless one.
    // It layers after hover so a pressed + hovered button shows the pressed
    // depth.
    pressed && !disabledState && !busy && tone === "primary"
      ? styles.primaryPressed
      : null,
    pressed && !disabledState && !busy && tone === "secondary"
      ? styles.secondaryPressed
      : null,
    pressed && !disabledState && !busy && tone === "ghost"
      ? styles.ghostPressed
      : null,
    pressed && !disabledState && !busy && tone === "plain"
      ? styles.plainPressed
      : null,
    pressed && !disabledState && !busy && tone === "danger"
      ? styles.dangerPressed
      : null,
    pressed && !disabledState && !busy && tone === "onMedia"
      ? styles.onMediaPressed
      : null,
    disabledState ? styles.disabled : null,
  ];
}
