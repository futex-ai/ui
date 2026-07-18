/** Shared pressable button with tone, size, optional icon, and block variants. */
import { LucideIcon } from "lucide-react-native";
import { ReactNode, useMemo } from "react";
import { Platform, Pressable, StyleProp, Text, ViewStyle } from "react-native";

import { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { buttonIconSize, createButtonStyles } from "./buttonStyles";
import { ButtonSpinner } from "./ButtonSpinner";

/**
 * Visual emphasis of the button:
 * - `primary` — filled with the theme primary, white label (the main action).
 * - `secondary` — surface fill with a neutral border (the default).
 * - `ghost` — no fill or border, primary-deep label (low-emphasis inline action).
 * - `danger` — neutral fill with a rose border and label (destructive action).
 */
export type ButtonTone = "danger" | "ghost" | "primary" | "secondary";

type ButtonBaseProps = {
  /** Spoken hint announced after the label. */
  accessibilityHint?: string;
  /** Stretch to fill the container width (`align-self: stretch`). */
  block?: boolean;
  /**
   * Mark the button as performing an in-progress action. While busy the button
   * stays focusable and announces `aria-busy`, but its press handler is blocked
   * and the leading icon is replaced by a spinner.
   */
  busy?: boolean;
  /** Disable the button; a button without `onPress` is also treated as disabled. */
  disabled?: boolean;
  /** Leading icon shown before the label, tinted to match the label colour. */
  icon?: LucideIcon;
  /** Press handler. Omit for a non-interactive (disabled) button. */
  onPress?: () => void;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the pressable container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visual emphasis. Defaults to `secondary`. */
  tone?: ButtonTone;
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
 * Props for an icon-only button (no visible text). An icon alone is not an
 * accessible name, so `accessibilityLabel` is **required** here to satisfy WCAG
 * 2.1 — 1.1.1 Non-text Content / 4.1.2 Name, Role, Value (A).
 */
export type IconOnlyButtonProps = ButtonBaseProps & {
  /** Accessible name. Required because there is no visible label to name it. */
  accessibilityLabel: string;
  children?: never;
  /** The icon that gives the button its meaning. */
  icon: LucideIcon;
};

export type ButtonProps = IconOnlyButtonProps | LabelledButtonProps;

/**
 * The shared button. Honours the accounting mockup's
 * primary / secondary / ghost / danger tones, the `block` full-width variant,
 * an optional leading icon, and the shared {@link ControlSize} densities. Owns
 * the sage focus ring and hides the browser's default outline, and treats a
 * missing `onPress` as a disabled control (matching the library's other
 * pressables).
 */
export function Button({
  accessibilityHint,
  accessibilityLabel,
  block = false,
  busy = false,
  children,
  disabled = false,
  icon: Icon,
  onPress,
  size = "md",
  style,
  testID,
  tone = "secondary",
}: ButtonProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createButtonStyles(theme, size), [theme, size]);
  const focus = useFocusRing();
  const disabledState = disabled || !onPress;
  // The label (and any leading icon) colour is driven by the tone, so it is
  // applied inline rather than baked into the stylesheet.
  const labelColor =
    tone === "primary"
      ? "#fff"
      : tone === "danger"
        ? theme.colors.rose
        : tone === "ghost"
          ? theme.colors.primaryDeep
          : theme.colors.ink;

  const hasVisibleLabel = children != null && children !== "";

  if (!hasVisibleLabel && !accessibilityLabel) {
    // An icon-only button with no accessible name is invisible to assistive
    // technology (WCAG 2.1 — 1.1.1 / 4.1.2). The type system enforces this for
    // the icon-only union, but guard at runtime for untyped/JS callers too.
    devWarn(
      "Button: an icon-only button (no visible text children) must be given an " +
        "`accessibilityLabel` so assistive technology can name it.",
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      // `busy` keeps the button focusable and announced while blocking activation.
      accessibilityState={{ busy, disabled: disabledState }}
      // RNW maps `accessibilityState.busy` to `aria-busy`; pass it literally too
      // so the DOM reflects the state regardless of RNW state-merge order.
      aria-busy={busy || undefined}
      disabled={disabledState}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      // Block activation while busy without unfocusing/hiding the control.
      onPress={busy ? undefined : onPress}
      style={({ hovered }: PressableHoverState) => [
        styles.button,
        tone === "primary" ? styles.primary : null,
        tone === "ghost" ? styles.ghost : null,
        tone === "danger" ? styles.danger : null,
        block ? styles.block : null,
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
        hovered && !disabledState && !busy && tone === "danger"
          ? styles.dangerHover
          : null,
        focus.focused ? styles.focusRing : null,
        disabledState ? styles.disabled : null,
        style,
        hideWebOutlineView,
      ]}
      testID={testID}
    >
      {busy ? (
        <ButtonSpinner color={labelColor} size={buttonIconSize(size)} />
      ) : Icon ? (
        // The leading icon is decorative when a visible label names the button,
        // so hide it from assistive technology to avoid a redundant/raw-name
        // announcement (WCAG 2.1 — 1.1.1 decorative content). When there is no
        // visible label the `accessibilityLabel` (required by the type) names
        // the control, so the glyph is still hidden and the name is authoritative.
        Platform.OS === "web" ? (
          <Icon aria-hidden color={labelColor} size={buttonIconSize(size)} />
        ) : (
          <Icon color={labelColor} size={buttonIconSize(size)} />
        )
      ) : null}
      {hasVisibleLabel ? (
        <Text style={[styles.label, { color: labelColor }]}>{children}</Text>
      ) : null}
    </Pressable>
  );
}
