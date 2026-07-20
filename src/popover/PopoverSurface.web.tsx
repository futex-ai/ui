/** Accessible, focus-managed wrapper around popover content (web). */
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { hideWebOutlineView } from "../focusRing";

import type { PopoverSurfaceRole } from "./popoverModel";

type Focusable = { focus?: () => void };

export type PopoverSurfaceProps = {
  children: ReactNode;
  /**
   * Element to focus when the surface opens. Defaults to the surface container
   * itself, which lands keyboard/screen-reader focus inside the popover without
   * hijacking a specific control.
   */
  initialFocusRef?: RefObject<Focusable | null>;
  /**
   * Accessible name for the surface. Required for a named `region`/`dialog` to
   * be exposed to assistive tech (WCAG 4.1.2); when omitted the surface stays a
   * plain, role-less container.
   */
  label?: string;
  /**
   * Move focus into the surface on open and restore it to the trigger on close
   * (WCAG 2.4.3). Defaults to `true`. A `tooltip` surface opts out by default —
   * a supplemental hint should not steal focus.
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

function asFocusable(value: unknown): Focusable | null {
  return value instanceof HTMLElement ? value : null;
}

/**
 * Web popover surface. Unlike a modal it does not trap focus (the popover is
 * non-modal: Escape and outside-press dismissal come from `DropdownPortal`), but
 * it does manage focus order for keyboard and screen-reader users:
 *
 * - On open it records the currently focused element (the trigger) and moves
 *   focus to `initialFocusRef` or the surface container, so Tab continues into
 *   the content and the named region is announced (WCAG 2.4.3, 4.1.2).
 * - On close it returns focus to the recorded element (the trigger), so the
 *   keyboard does not drop to `<body>`.
 *
 * The surface is focusable (`tabIndex=-1`) only so focus can LAND inside it on
 * open; it is not in the Tab order and is not an interactive control, so it
 * suppresses the browser's default focus ring (`outlineStyle: "none"`). Without
 * that, focusing it via the keyboard matches `:focus-visible` and the UA paints a
 * heavy blue outline around the whole popover the moment it opens. Interactive
 * controls inside the surface keep their own focus indicators, and for a menu the
 * active row highlight marks the keyboard position (WCAG 2.4.7).
 */
export function PopoverSurface({
  children,
  initialFocusRef,
  label,
  manageFocus = true,
  nativeID,
  role,
  style,
  testID,
}: PopoverSurfaceProps) {
  const surfaceRole = role ?? "dialog";
  // A tooltip is a supplemental hint and never manages focus unless the caller
  // explicitly asks for it.
  const shouldManageFocus = manageFocus && surfaceRole !== "tooltip";
  const surfaceRef = useRef<View>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const initialFocusTargetRef = useRef(initialFocusRef);
  initialFocusTargetRef.current = initialFocusRef;

  useEffect(() => {
    if (!shouldManageFocus || typeof document === "undefined") {
      return;
    }
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusTimer = setTimeout(() => {
      const target =
        initialFocusTargetRef.current?.current ??
        asFocusable(surfaceRef.current);
      target?.focus?.();
    }, 0);
    return () => {
      clearTimeout(focusTimer);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [shouldManageFocus]);

  const named = Boolean(label);
  return (
    <View
      accessibilityLabel={named ? label : undefined}
      nativeID={nativeID}
      ref={surfaceRef}
      role={named ? surfaceRole : undefined}
      style={[shouldManageFocus ? hideWebOutlineView : null, style]}
      tabIndex={shouldManageFocus ? -1 : undefined}
      testID={testID}
    >
      {children}
    </View>
  );
}
