/** Shared pressable button with tone, size, optional icon, and block variants. */
import { LucideIcon } from "lucide-react-native";
import { ReactNode, Ref, useMemo } from "react";
import {
  GestureResponderEvent,
  Insets,
  Platform,
  Pressable,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { PressableHoverState, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  buttonHeight,
  buttonIconSize,
  createButtonStyles,
  onMediaLabelColor,
} from "./buttonStyles";
import {
  buttonSemantics,
  buttonSemanticsWarnings,
  buttonSpaceKeyProps,
  type ButtonPopup,
  type ButtonRole,
  type ButtonRoleState,
} from "./buttonSemantics";
import { ButtonContent } from "./ButtonContent";
import { HitSlopExpander } from "./HitSlopExpander";

/**
 * Visual emphasis of the button:
 * - `primary` — filled with the theme primary, white label (the main action).
 * - `secondary` — surface fill with a neutral border (the default).
 * - `ghost` — no fill or border, primary-deep label (low-emphasis inline action).
 * - `plain` — no fill or border, neutral `ink` label / icon (a flush, chrome-less
 *   header / composer icon button), with a neutral hover / pressed wash.
 * - `danger` — neutral fill with a rose border and label (destructive action).
 * - `onMedia` — a translucent white control for a button sitting on photography
 *   or video, where every theme-surface tone would disappear. Its fills and
 *   label stay white in every scheme, because imagery is dark in every scheme.
 */
export type ButtonTone =
  | "danger"
  | "ghost"
  | "onMedia"
  | "plain"
  | "primary"
  | "secondary";

/**
 * Container geometry:
 * - `rounded` — the default horizontally-padded rounded rectangle (labelled
 *   buttons and pill/text buttons).
 * - `square` — an equal-padding 1:1 box for a compact icon-only tap target.
 * - `circle` — the `square` box with a full (pill) radius.
 *
 * `square` / `circle` are intended for icon-only buttons; combine them with
 * `minTouchTarget` to floor the box at a comfortable touch size independent of
 * the label height scale, or with `boxSize` to set it outright.
 */
export type ButtonShape = "circle" | "rounded" | "square";

/**
 * The interaction state handed to a functional {@link ButtonBaseProps.style}.
 * `hovered` is web-only and stays false on native, matching the underlying
 * pressable.
 */
export type ButtonStateStyleArgs = {
  /** The press handler is blocked by an in-progress action. */
  busy: boolean;
  /** Explicitly disabled, or left without an `onPress`. */
  disabled: boolean;
  /** The control holds keyboard/pointer focus. */
  focused: boolean;
  /** The pointer is over the control (web only). */
  hovered: boolean;
  /** The control is being pressed. */
  pressed: boolean;
};

type ButtonBaseProps = ButtonRoleState & {
  /** Spoken hint announced after the label. */
  accessibilityHint?: string;
  /** Stretch to fill the container width (`align-self: stretch`). */
  block?: boolean;
  /**
   * Exact visible dimension for a `square` / `circle` button, in px, replacing
   * the box the `size` scale would derive. Unlike `minTouchTarget` — a floor
   * that can only grow the box — this also goes *below* the smallest size's
   * 30px track, for a glyph a design specs smaller than any control density.
   * Pair it with `hitSlop` so a small visible box keeps a comfortable target.
   */
  boxSize?: number;
  /**
   * Mark the button as performing an in-progress action. While busy the button
   * stays focusable and announces `aria-busy`, but its press handler is blocked
   * and the leading icon is replaced by a spinner.
   */
  busy?: boolean;
  /**
   * Handle on the underlying pressable, for callers that must drive focus
   * imperatively — most often a modal's `initialFocusRef`, to open a
   * destructive confirmation on its safe action rather than its destructive
   * one. Named rather than a forwarded `ref`, matching `InputFrame.inputRef`.
   */
  buttonRef?: Ref<View>;
  /**
   * Replace the icon + label row with caller-owned nodes, for a pressable card
   * that performs an action. The button keeps its role, focus ring, press
   * handling, and disabled treatment and stops imposing a label layout; pair it
   * with `style` to drop the row direction and the fixed track height.
   */
  content?: ReactNode;
  /** Milliseconds held before `onLongPress` fires. Defaults to the platform value. */
  delayLongPress?: number;
  /** Disable the button; a button without `onPress` is also treated as disabled. */
  disabled?: boolean;
  /**
   * Disable the shared focus glow on this button. It then falls back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /**
   * Announce that this button opens an overlay (`aria-haspopup`), so a screen
   * reader can say what Enter will open before the user commits. Pair it with
   * `expanded` on a trigger whose surface opens in place, so the open/closed
   * state is announced too. Web-only — see {@link ButtonPopup}.
   */
  hasPopup?: ButtonPopup;
  /**
   * Extend the pressable area beyond the visible box, in px (or per edge). The
   * tap target grows without the control growing with it, so a compact glyph
   * can still meet the ≥44px comfortable target (WCAG 2.1 — 2.5.5 Target Size,
   * AAA / 2.5.8 AA). `minTouchTarget` grows the *visible* box instead.
   *
   * Honoured on both platforms: React Native reads it off the pressable, and on
   * web — where react-native-web's `Pressable` ignores it — the equivalent area
   * is drawn by {@link HitSlopExpander}. The expanded area overlaps whatever
   * sits beside the control, so reach for it on a control with room around it.
   */
  hitSlop?: number | Insets;
  /** Leading lucide icon shown before the label, tinted to match the label colour. */
  icon?: LucideIcon;
  /**
   * A caller-supplied icon node rendered as-is (e.g. an `@expo/vector-icons`
   * glyph), for when a lucide `icon` is not the right glyph. It is NOT wrapped
   * in `<Text>` and is NOT tinted — the caller owns its colour and size — so it
   * takes precedence over `icon` when both are set. Hidden from assistive tech
   * on web (the label / `accessibilityLabel` names the control).
   */
  iconNode?: ReactNode;
  /**
   * Render a compact, line-height-neutral chip that flows inside a line of text
   * (e.g. an inline "Restore" / "Undo" action beside a label). It drops the
   * fixed track height and hugs the label with a tight padding, then pulls that
   * padding — and the 1px border — back off with a negative vertical margin, so
   * the button's outer (margin-box) height collapses to exactly its label line
   * height. Dropped into a row it then takes the same vertical space as a run of
   * text at its `size` and never grows the row's line height; the pill's
   * fill/border overflow the text line above and below without affecting layout.
   *
   * Composes with `tone` (`secondary` gives a bordered chip; `ghost` / `plain`
   * are borderless), `size`, and `icon`. It is a small, non-touch-first target —
   * it relies on WCAG 2.1 — 2.5.8's inline / line-height target-size exception
   * rather than the 24px minimum — so reach for it in pointer/text contexts, not
   * for primary touch actions. It is a text-flow chip: the icon-only `square` /
   * `circle` shapes and an explicit `minTouchTarget` floor are fixed-size intents
   * that contradict the line-height collapse, so `inline` is skipped (a no-op)
   * when either is set, and it should not be paired with `block`. Because the
   * chip **and its focus ring** overflow the text line, give the row a little
   * vertical padding — a touch more than the pill, for the ring. On web this
   * matters only under an `overflow: "hidden"` ancestor; on native (notably
   * Android) a parent can clip children to its own bounds, so the padding keeps
   * the pill from being sheared there.
   */
  inline?: boolean;
  /** Extra style merged over the label, after the tone's colour. */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Floor the tap target at this many px (min width AND height). Independent of
   * the `size` label scale, so a compact icon-only button can still meet a
   * comfortable ≥40–44px touch target. On `square` / `circle` it also grows the
   * 1:1 box to this dimension when it exceeds the size's height.
   */
  minTouchTarget?: number;
  /**
   * Truncate the label to this many lines with an ellipsis. It has to be set
   * here rather than on a nested `<Text>` child, which React Native ignores.
   */
  numberOfLines?: number;
  /** Long-press handler. Blocked while `busy`, like `onPress`. */
  onLongPress?: (event: GestureResponderEvent) => void;
  /**
   * Press handler. Omit for a non-interactive (disabled) button.
   *
   * The gesture event is forwarded, so a trigger can open its overlay at the
   * pointer rather than wrapping the button in a `<View>` and measuring it. It
   * is optional because a keyboard activation has no pointer: Enter and Space
   * both call this handler with no event, so anchor to the control itself when
   * it is absent.
   */
  onPress?: (event?: GestureResponderEvent) => void;
  /** Press-in handler, for push-to-talk and other press-lifecycle controls. */
  onPressIn?: (event: GestureResponderEvent) => void;
  /** Press-out handler, the release half of the press lifecycle. */
  onPressOut?: (event: GestureResponderEvent) => void;
  /**
   * Accessibility role. Defaults to `button`; the other members of
   * {@link ButtonRole} let a consumer build a tab, checkbox, radio, switch, or
   * menu item on the shared button rather than hand-rolling a `Pressable` and
   * losing the focus glow, tones, sizes, and disabled/busy handling with it.
   * Pair it with the matching state prop (`checked` / `selected` / `pressed`).
   *
   * `Button` is a single control: it does not own group navigation. A roving
   * arrow-key group wants a container that owns it — `SegmentedControl` already
   * implements the radiogroup pattern.
   */
  role?: ButtonRole;
  /** Container geometry. Defaults to `rounded`. */
  shape?: ButtonShape;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /**
   * Extra style for the pressable container, layered last so it wins over the
   * tone. Pass a function to style by interaction state: a control with a
   * caller-supplied fill overrides the tone's own hover / pressed washes, so
   * the functional form is how it puts press feedback back.
   */
  style?:
    | StyleProp<ViewStyle>
    | ((state: ButtonStateStyleArgs) => StyleProp<ViewStyle>);
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visual emphasis. Defaults to `secondary`. */
  tone?: ButtonTone;
  /**
   * Node rendered after the label — a right-pinned chevron on a selector, say.
   * Decorative and inert like `iconNode`. Give `labelStyle` a `flex: 1` to push
   * it to the far edge of a `block` button.
   */
  trailing?: ReactNode;
};

/**
 * Props for a button with a visible text label. The visible label is the
 * accessible name by default, so `accessibilityLabel` is optional here (use it
 * only to override the spoken name — keep the visible text a substring of it to
 * satisfy WCAG 2.1 — 2.5.3 Label in Name).
 */
export type LabelledButtonProps = ButtonBaseProps & {
  /** Accessible name. Defaults to the visible text children. */
  accessibilityLabel?: string;
  /** Visible label text. */
  children: ReactNode;
};

/**
 * Props for a button with no visible text label — an icon-only control, or a
 * `content` card whose nodes the library cannot read a name from. A glyph or a
 * custom layout is not an accessible name, so `accessibilityLabel` is
 * **required** here to satisfy WCAG 2.1 — 1.1.1 Non-text Content / 4.1.2 Name,
 * Role, Value (A). At least one content source is required — a lucide `icon`, a
 * caller-supplied `iconNode`, or `content` — so the button is never a nameless
 * empty box.
 */
export type IconOnlyButtonProps = ButtonBaseProps & {
  /** Accessible name. Required because there is no visible label to name it. */
  accessibilityLabel: string;
  children?: never;
} & ({ icon: LucideIcon } | { iconNode: ReactNode } | { content: ReactNode });

export type ButtonProps = IconOnlyButtonProps | LabelledButtonProps;

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
  disableFocusRing = false,
  expanded,
  hasPopup,
  hitSlop,
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
  const styles = useMemo(() => createButtonStyles(theme, size), [theme, size]);
  const focus = useFocusRing({ disabled: disableFocusRing });
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
  // is applied inline rather than baked into the stylesheet. `plain` shares the
  // neutral `ink` of `secondary` — it differs only in its (absent) chrome, and
  // `onMedia` keeps a fixed white because it sits on imagery, not a surface.
  const labelColor =
    tone === "primary"
      ? theme.colors.onSolid
      : tone === "danger"
        ? theme.colors.rose
        : tone === "ghost"
          ? theme.colors.primaryDeep
          : tone === "onMedia"
            ? onMediaLabelColor()
            : theme.colors.ink;

  // `square` / `circle` render a 1:1 box (equal padding): `boxSize` sets it
  // outright, otherwise the size's track height floored at any
  // `minTouchTarget`; `circle` swaps in the pill radius. On the default
  // `rounded` shape a bare `minTouchTarget` still enforces a min tap target
  // without forcing the aspect ratio.
  const shapeStyle = useMemo<ViewStyle | null>(() => {
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
  }, [boxSize, minTouchTarget, shape, size, theme.radii.pill]);

  const hasVisibleLabel = children != null && children !== "";

  // The inline chip only applies to the default `rounded` shape with no competing
  // fixed-size intent. `block` (full-width), a `minTouchTarget` floor, and the
  // icon-only `square` / `circle` boxes each set a size that contradicts the
  // line-height collapse, so they take precedence and `inline` is a no-op — this
  // keeps the negative margin from leaking through those layouts and pulling
  // their neighbours out of place.
  const inlineChip =
    inline && !block && shape === "rounded" && minTouchTarget == null;

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

  // On web, the non-`button` roles need Spacebar bound by hand; react-native-web
  // binds it on `button` alone (see `buttonSpaceKeyProps`).
  const keyProps = buttonSpaceKeyProps({
    activate: () => onPress?.(),
    enabled: !disabledState && !busy,
    role,
    web: isWeb,
  });

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={semantics.accessibilityRole}
      // Native's state channel: `busy` keeps the button focusable and announced
      // while blocking activation, and any role state (checked / selected /
      // expanded) rides along. It is inert on web — react-native-web reads
      // `accessibilityState` only on `TouchableWithoutFeedback` — so the literal
      // `aria-*` mirror spread in below is what reaches the DOM there.
      accessibilityState={semantics.accessibilityState}
      delayLongPress={delayLongPress}
      disabled={disabledState}
      hitSlop={hitSlop}
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
      style={({ hovered = false, pressed }: PressableHoverState) => [
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
        focus.focused ? focus.focusRingStyle : null,
        disabledState ? styles.disabled : null,
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
        // Suppress the UA outline while the glow is the focus affordance; with
        // the ring disabled the reset is skipped so the UA outline returns.
        focus.webOutlineReset,
      ]}
      testID={testID}
      {...semantics.ariaProps}
      {...keyProps}
    >
      <HitSlopExpander hitSlop={hitSlop} />
      <ButtonContent
        color={labelColor}
        content={content}
        icon={Icon}
        iconNode={iconNode}
        iconSize={buttonIconSize(size)}
        labelStyle={labelStyle}
        numberOfLines={numberOfLines}
        showSpinner={busy}
        styles={styles}
        trailing={trailing}
      >
        {children}
      </ButtonContent>
    </Pressable>
  );
}
