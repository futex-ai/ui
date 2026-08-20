/**
 * What a {@link Button} paints between its edges: the busy spinner, the leading
 * glyph, the label, and an optional trailing slot — or, for a pressable card, a
 * caller's own `content` in place of all of them.
 *
 * Split out of `Button` so the component file stays about wiring props to the
 * pressable, and so the decorative-glyph rules (never inside `<Text>`, hidden
 * from assistive technology, never a pointer target) live in one place rather
 * than being restated per slot.
 */
import { LucideIcon } from "lucide-react-native";
import { ReactNode } from "react";
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";

import { ButtonSpinner } from "./ButtonSpinner";
import type { ButtonStyles } from "./buttonStyles";

export type ButtonContentProps = {
  /** Resolved label / glyph colour for the active tone. */
  color: string;
  /**
   * Replaces the whole icon + label row with caller-owned nodes, for a
   * pressable card. The button keeps its role, focus ring, and press handling
   * and stops imposing a label layout; pair it with `style` to drop the row
   * direction and fixed track height.
   */
  content?: ReactNode;
  /** Visible label text. */
  children?: ReactNode;
  /** Leading lucide glyph, tinted to {@link color}. */
  icon?: LucideIcon;
  /** Diameter for the leading glyph and the busy spinner. */
  iconSize: number;
  /** Leading node rendered as-is, taking precedence over {@link icon}. */
  iconNode?: ReactNode;
  /** Extra style merged over the label, after the tone colour. */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Truncate the label to this many lines. It has to be set on the library's
   * own `<Text>` because React Native ignores `numberOfLines` on a nested one,
   * which is why a caller cannot recover truncation by passing their own.
   */
  numberOfLines?: number;
  /** True while the press handler is blocked and the spinner replaces the glyph. */
  showSpinner: boolean;
  styles: ButtonStyles;
  /** Node rendered after the label, e.g. a right-pinned chevron. */
  trailing?: ReactNode;
};

/**
 * Wraps a caller-supplied node so it is decorative and inert: hidden from
 * assistive technology on web (the label or `accessibilityLabel` is the name)
 * and untargetable by the pointer, so a focusable child SVG cannot steal focus
 * from the button that owns it.
 */
function DecorativeSlot({
  children,
  styles,
}: {
  children: ReactNode;
  styles: ButtonStyles;
}) {
  return (
    <View
      aria-hidden={Platform.OS === "web" ? true : undefined}
      pointerEvents="none"
      style={styles.iconNode}
    >
      {children}
    </View>
  );
}

export function ButtonContent({
  children,
  color,
  content,
  icon: Icon,
  iconNode,
  iconSize,
  labelStyle,
  numberOfLines,
  showSpinner,
  styles,
  trailing,
}: ButtonContentProps) {
  if (content != null) {
    return <>{content}</>;
  }

  const hasVisibleLabel = children != null && children !== "";

  return (
    <>
      {showSpinner ? (
        <ButtonSpinner color={color} size={iconSize} />
      ) : iconNode != null ? (
        <DecorativeSlot styles={styles}>{iconNode}</DecorativeSlot>
      ) : Icon ? (
        // The leading icon is decorative when a visible label names the button,
        // so hide it from assistive technology to avoid a redundant/raw-name
        // announcement (WCAG 2.1 — 1.1.1 decorative content). When there is no
        // visible label the `accessibilityLabel` (required by the type) names
        // the control, so the glyph is still hidden and the name is authoritative.
        Platform.OS === "web" ? (
          <Icon aria-hidden color={color} size={iconSize} />
        ) : (
          <Icon color={color} size={iconSize} />
        )
      ) : null}
      {hasVisibleLabel ? (
        <Text
          numberOfLines={numberOfLines}
          style={[styles.label, { color }, labelStyle]}
        >
          {children}
        </Text>
      ) : null}
      {trailing != null ? (
        <DecorativeSlot styles={styles}>{trailing}</DecorativeSlot>
      ) : null}
    </>
  );
}
