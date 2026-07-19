/** Accessible wrapper around popover content (native + non-web fallback). */
import type { ReactNode, RefObject } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { PopoverSurfaceRole } from "./popoverModel";

type Focusable = { focus?: () => void };

export type PopoverSurfaceProps = {
  children: ReactNode;
  /**
   * Element focused when the surface opens (web only). Inert on native, where
   * the platform manages focus for the modal-backed dropdown surface.
   */
  initialFocusRef?: RefObject<Focusable | null>;
  /**
   * Accessible name for the surface. Required for a named `region`/`dialog` to
   * be exposed to assistive tech (WCAG 4.1.2); when omitted the surface stays a
   * plain, role-less container.
   */
  label?: string;
  /**
   * Move focus into the surface on open and back to the trigger on close (web
   * only, WCAG 2.4.3). Inert on native. Defaults to `true`.
   */
  manageFocus?: boolean;
  /** Stable id so the trigger can point `aria-controls` at the surface. */
  nativeID?: string;
  /** Surface role. Only applied alongside a `label`. Defaults to `dialog`. */
  role?: PopoverSurfaceRole;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * Wraps popover content so the surface carries a role and accessible name. On
 * native this is a plain labelled `View`; the web build
 * (`PopoverSurface.web.tsx`) additionally manages focus into the surface on
 * open and back to the trigger on close, and draws a focus ring. The
 * `initialFocusRef` / `manageFocus` props are accepted here for prop parity but
 * are web-only.
 *
 * A role/name pair is only emitted when a `label` is supplied — an unnamed
 * `region`/`dialog` is not exposed as a useful landmark and trips the axe
 * "ARIA region/dialog must have a name" rules, so the wrapper stays transparent
 * to AT until the consumer names it.
 */
export function PopoverSurface({
  children,
  label,
  nativeID,
  role,
  style,
  testID,
}: PopoverSurfaceProps) {
  const named = Boolean(label);
  return (
    <View
      accessibilityLabel={named ? label : undefined}
      nativeID={nativeID}
      role={named ? (role ?? "dialog") : undefined}
      style={style}
      testID={testID}
    >
      {children}
    </View>
  );
}
