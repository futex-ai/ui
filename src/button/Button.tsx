/** Shared pressable button with tone, size, optional icon, and block variants. */
import { useMemo } from "react";
import { Platform, Pressable, View } from "../primitives/reactNative";

import { devWarn } from "../devWarn";
import { PressableHoverState, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";

import {
  buttonLabelColor,
  buttonPaintLayers,
  buttonShapeStyle,
} from "./buttonPaint";
import type { ButtonProps } from "./buttonProps";
import {
  buttonHeight,
  buttonIconSize,
  createButtonStyles,
  createTouchButtonStyles,
} from "./buttonStyles";
import { reservesTouchTarget } from "./buttonTouch";
import {
  buttonSemantics,
  buttonSemanticsWarnings,
  buttonSpaceKeyProps,
} from "./buttonSemantics";
import { ButtonContent } from "./ButtonContent";
import { HitSlopExpander } from "./HitSlopExpander";

/**
 * The shared button. Honours the accounting mockup's
 * primary / secondary / ghost / plain / danger tones, the `block` full-width
 * variant, the `square` / `circle` icon-only shapes, a lucide `icon` or a
 * caller-supplied `iconNode`, and the shared {@link ControlSize} densities.
 * Applies the library's shared focus glow ({@link useFocusRing}) and hides the
 * browser's default outline, and treats a missing `onPress` as a disabled
 * control (matching the library's other pressables).
 *
 * It announces `button` semantics by default; `role` re-points it at any other
 * single-activation role ({@link ButtonRole}) with the matching state prop, so
 * a tab, checkbox, radio, switch, or menu item is a themed `Button` rather than
 * a hand-rolled `Pressable` that has to re-derive all of the above.
 */
export function Button({
  accessibilityHint,
  accessibilityLabel,
  block = false,
  boxSize,
  busy = false,
  buttonRef,
  checked,
  children,
  content,
  delayLongPress,
  disabled = false,
  expanded,
  focusIndicator,
  hasPopup,
  hitSlop: requestedHitSlop,
  icon: Icon,
  iconNode,
  inline = false,
  labelStyle,
  minTouchTarget,
  numberOfLines,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  pressed,
  role = "button",
  selected,
  shape = "rounded",
  size = "md",
  style,
  testID,
  tone = "secondary",
  trailing,
}: ButtonProps) {
  const theme = useSharedUiTheme();
  // On a touch surface the button draws the touch metrics, whatever its size.
  // A face that `boxSize` draws below the 44px target keeps the drawing of its
  // size instead, and the pressable reserves the target around it.
  const touch = useTouchSurface();
  const reserve = touch && reservesTouchTarget(shape, boxSize);
  const touchFace = touch && !reserve;
  const styles = useMemo(
    () =>
      touchFace
        ? createTouchButtonStyles(theme)
        : createButtonStyles(theme, size),
    [theme, size, touchFace],
  );
  // A reserved target owns the focus, and the face inside it paints the ring.
  const focus = useFocusRing({
    indicator: focusIndicator,
    target: reserve ? "parent" : "self",
  });
  // A touch target occupies its own layout space, so it takes no hit slop
  // that would overlap its neighbours.
  const hitSlop = touch ? undefined : requestedHitSlop;
  const disabledState = disabled || !onPress;
  const isWeb = Platform.OS === "web";
  const semanticsInput = {
    busy,
    checked,
    disabled: disabledState,
    expanded,
    hasPopup,
    pressed,
    role,
    selected,
    web: isWeb,
  };
  const semantics = buttonSemantics(semanticsInput);
  // The label (and any leading lucide icon) colour is driven by the tone, so it
  // is applied inline rather than baked into the stylesheet.
  const labelColor = buttonLabelColor(theme, tone);

  // The 1:1 box of an icon-only shape, or the min tap target of a rounded one.
  const shapeStyle = useMemo(
    () =>
      buttonShapeStyle({
        boxSize,
        minTouchTarget,
        shape,
        size,
        theme,
        touchFace,
      }),
    [boxSize, minTouchTarget, shape, size, theme, touchFace],
  );

  const hasVisibleLabel = children != null && children !== "";

  // The inline chip only applies to the default `rounded` shape with no competing
  // fixed-size intent. `block` (full-width), a `minTouchTarget` floor, and the
  // icon-only `square` / `circle` boxes each set a size that contradicts the
  // line-height collapse, so they take precedence and `inline` is a no-op — this
  // keeps the negative margin from leaking through those layouts and pulling
  // their neighbours out of place. A touch target is such a fixed size too.
  const inlineChip =
    inline && !block && shape === "rounded" && minTouchTarget == null && !touch;

  if (!hasVisibleLabel && !accessibilityLabel) {
    // A button with no visible text — icon-only, or a `content` card — has no
    // accessible name for assistive technology (WCAG 2.1 — 1.1.1 / 4.1.2). The
    // type system enforces this for that union, but guard at runtime for
    // untyped/JS callers too.
    devWarn(
      "Button: a button with no visible text children must be given an " +
        "`accessibilityLabel` so assistive technology can name it.",
    );
  }

  if (
    minTouchTarget != null &&
    boxSize == null &&
    (shape === "square" || shape === "circle") &&
    minTouchTarget < buttonHeight(size)
  ) {
    // `minTouchTarget` is a floor and never a ceiling, so one below the size's
    // own track silently does nothing. Say so rather than leaving a caller to
    // wonder why the box never shrank — `boxSize` is the prop that sets it.
    devWarn(
      `Button: \`minTouchTarget\` (${minTouchTarget}) is below the "${size}" ` +
        `size's ${buttonHeight(size)}px box, so it has no effect. Use ` +
        "`boxSize` to make the control smaller, and `hitSlop` to keep its tap " +
        "target comfortable.",
    );
  }

  for (const warning of buttonSemanticsWarnings(semanticsInput)) {
    // A role paired with state ARIA rejects — or left without the state its
    // role requires — announces the wrong thing rather than failing loudly, so
    // say so in development.
    devWarn(warning);
  }

  // On web, the non-`button` roles need Spacebar bound by hand; the web backend
  // binds it on `button` alone (see `buttonSpaceKeyProps`).
  const keyProps = buttonSpaceKeyProps({
    activate: () => onPress?.(),
    enabled: !disabledState && !busy,
    role,
    web: isWeb,
  });

  // The paint of the button in one interaction state. It styles the pressable,
  // or the face inside a reserved touch target.
  const paintStyle = ({ hovered = false, pressed }: PressableHoverState) => [
    ...buttonPaintLayers({
      block,
      busy,
      disabledState,
      hovered,
      inlineChip,
      pressed,
      shapeStyle,
      styles,
      tone,
    }),
    // The caller's style layers last so it wins over the tone — which is
    // also why a caller-supplied fill erases the tone's washes. The
    // functional form exists so that caller can re-add press feedback.
    typeof style === "function"
      ? style({
          busy,
          disabled: disabledState,
          focused: focus.focused,
          hovered,
          pressed,
        })
      : style,
    // Carry the CSS glow variables on every marked host. The stylesheet
    // suppresses the UA outline only while its `:focus-visible` rule paints.
    focus.focusRingVariables,
  ];

  const buttonContent = (
    <ButtonContent
      color={labelColor}
      content={content}
      icon={Icon}
      iconNode={iconNode}
      iconSize={touchFace ? touchControlMetrics.iconSize : buttonIconSize(size)}
      labelStyle={labelStyle}
      numberOfLines={numberOfLines}
      showSpinner={busy}
      styles={styles}
      trailing={trailing}
    >
      {children}
    </ButtonContent>
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={semantics.accessibilityRole}
      // Native's state channel: `busy` keeps the button focusable and announced
      // while blocking activation, and any role state (checked / selected /
      // expanded) rides along. It is inert on web — the web backend drops
      // `accessibilityState` rather than translating it — so the literal
      // `aria-*` mirror spread in below is what reaches the DOM there.
      accessibilityState={semantics.accessibilityState}
      delayLongPress={delayLongPress}
      disabled={disabledState}
      hitSlop={hitSlop}
      {...(reserve ? focus.focusTargetProps : focus.focusRingProps)}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      // Block activation while busy without unfocusing/hiding the control. The
      // whole press lifecycle is gated together, so a push-to-talk control
      // cannot start on press-in and then never be released.
      onLongPress={busy ? undefined : onLongPress}
      onPress={busy ? undefined : onPress}
      onPressIn={busy ? undefined : onPressIn}
      onPressOut={busy ? undefined : onPressOut}
      ref={buttonRef}
      style={({ hovered = false, pressed }: PressableHoverState) =>
        reserve ? styles.reservedTarget : paintStyle({ hovered, pressed })
      }
      testID={testID}
      {...semantics.ariaProps}
      {...keyProps}
    >
      {reserve ? (
        (state: PressableHoverState) => (
          <>
            <HitSlopExpander hitSlop={hitSlop} />
            <View {...focus.focusRingProps} style={paintStyle(state)}>
              {buttonContent}
            </View>
          </>
        )
      ) : (
        <>
          <HitSlopExpander hitSlop={hitSlop} />
          {buttonContent}
        </>
      )}
    </Pressable>
  );
}
