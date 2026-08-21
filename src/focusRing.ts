import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, TextStyle, ViewStyle } from "react-native";

import { useSharedUiTheme } from "./theme";

export const hideWebOutline = { outlineStyle: "none" } as unknown as TextStyle;

export const hideWebOutlineView = {
  outlineStyle: "none",
} as unknown as ViewStyle;

/** Pressable style-callback state, widened with react-native-web's `hovered`. */
export type PressableHoverState = { pressed: boolean; hovered?: boolean };

/**
 * Fallback ring color used when a caller invokes `focusRingStyleFor` without a
 * `color` and outside a theme. Mirrors the default theme's `primary`; live
 * callers resolve the active theme's value through `useFocusRing`.
 */
const DEFAULT_RING_COLOR = "#4f7864";

export type FocusRingOptions = {
  /**
   * Glow color. Defaults to the active theme's `primary`. Pass a higher-contrast
   * value when the control sits on a tinted/primary surface so the glow keeps a
   * 3:1 contrast against its backdrop (WCAG 2.1 — 1.4.11 Non-text Contrast, AA).
   */
  color?: string;
  /** Glow spread radius in px — how far the halo extends. Default 4. */
  width?: number;
  /**
   * Positive draws the glow *outside* the box (the default). Pass a negative
   * value to draw an *inset* glow when the control lives inside an
   * `overflow: hidden` ancestor (e.g. the segmented pill, the date wheel's
   * snap-scroll column) that would otherwise clip an outset shadow. Only the
   * sign is used — the halo size comes from `width`. Default 2.
   */
  offset?: number;
  /** Glow opacity, 0–1. Lower is softer; raise it for more presence. Default 0.35. */
  alpha?: number;
  /**
   * Suppress the glow entirely. When true, {@link useFocusRing} returns an empty
   * `focusRingStyle` and `ringEnabled: false`, so a control renders no focus
   * glow. Callers wire this to a public `disableFocusRing` prop; the active
   * theme's `focusRing: false` flag disables every ring globally the same way.
   * Only consulted by `useFocusRing` — `focusRingStyleFor` ignores it.
   */
  disabled?: boolean;
};

/** Stable empty style returned for a disabled ring, so identity never churns. */
const EMPTY_RING_STYLE = Object.freeze({}) as ViewStyle;

type FocusState = {
  focused: boolean;
  focusVisible: boolean;
};

type FocusEventLike = {
  currentTarget?: unknown;
};

type WebFocusEventType = "blur" | "keydown" | "pointerdown";

type WebFocusTarget = {
  addEventListener: (
    type: WebFocusEventType,
    listener: () => void,
    options?: { once?: boolean },
  ) => void;
  matches: (selector: string) => boolean;
  removeEventListener: (type: WebFocusEventType, listener: () => void) => void;
};

const UNFOCUSED_STATE = Object.freeze({
  focused: false,
  focusVisible: false,
}) as FocusState;

/**
 * Parses a `#rgb`/`#rrggbb` hex color into an `"r, g, b"` channel triplet for
 * composing an `rgba()` glow. Returns null for any non-hex input (rgba(),
 * named colors) so callers can fall back to the color verbatim.
 */
function rgbChannels(hex: string): string | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  let body = match[1];
  if (body.length === 3) {
    body = body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
  }
  const int = parseInt(body, 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

/**
 * Builds a soft-glow focus indicator: a translucent `box-shadow` halo in the
 * ring color, instead of a hard outline.
 *
 * This replaces the earlier outset `outline` ring. Every control — bordered or
 * not — gets a single, calm focus glow (WCAG 2.1 Focus Visible, 2.4.7, AA)
 * rather than a heavy line floating outside the box. The glow is painted
 * outside the layout box, so it adds no layout shift, and it deliberately does
 * NOT recolor the resting border.
 *
 * Platform split: the glow is web-only. On native the `box-shadow`/`outline`
 * props are left unset and the OS focus affordance applies — matching the
 * previous outline behavior, which was inert on native too.
 *
 * Clipping: controls nested in an `overflow: hidden` ancestor would clip an
 * outset halo, so they pass a negative `offset` to draw the glow `inset`.
 */
export function focusRingStyleFor(options: FocusRingOptions): ViewStyle {
  const {
    color = DEFAULT_RING_COLOR,
    width = 4,
    offset = 2,
    alpha = 0.35,
  } = options;

  // Native keeps the OS focus affordance (as the old outline ring did — the
  // web-only shadow/outline props were inert there).
  if (Platform.OS !== "web") return {};

  const channels = rgbChannels(color);
  const glow = channels ? `rgba(${channels}, ${alpha})` : color;
  const inset = offset < 0 ? "inset " : "";

  return {
    // Suppress the browser's default focus outline so the glow stands alone.
    outlineStyle: "none",
    boxShadow: `${inset}0 0 0 ${width}px ${glow}`,
  } as unknown as ViewStyle;
}

/**
 * Tracks actual focus and visible-focus modality independently. Web controls
 * render the custom glow only when `:focus-visible` matches; native controls
 * treat every focus as visible. Direct web listeners keep state aligned when
 * input modality changes without another focus event, or when disabling a
 * focused element bypasses React's synthetic `onBlur`.
 */
export function useFocusRing(options: FocusRingOptions = {}) {
  const [focusState, setFocusState] = useState<FocusState>(UNFOCUSED_STATE);
  const focusedTargetRef = useRef<WebFocusTarget | null>(null);
  const theme = useSharedUiTheme();
  const color = options.color ?? theme.colors.primary;
  const { width, offset, alpha, disabled } = options;
  // The ring is on unless this instance opts out (`disabled`) or the whole theme
  // turns rings off (`focusRing: false`). When off, `focusRingStyle` collapses
  // to `{}`, so the usual `focusVisible ? focusRingStyle : null` idiom paints no
  // glow with no gate change. `ringEnabled` is for callers that draw their glow
  // from a local StyleSheet and never read `focusRingStyle`; they AND it into
  // their own gate. It also drives the web outline reset below.
  const ringEnabled = !disabled && theme.focusRing !== false;
  const focusRingStyle = useMemo<ViewStyle>(
    () =>
      ringEnabled
        ? focusRingStyleFor({ color, width, offset, alpha })
        : EMPTY_RING_STYLE,
    [ringEnabled, color, width, offset, alpha],
  );
  const syncFocusVisible = useCallback(() => {
    const target = focusedTargetRef.current;
    if (!target) return;
    const focusVisible = target.matches(":focus-visible");
    setFocusState((current) =>
      current.focused && current.focusVisible === focusVisible
        ? current
        : { focused: true, focusVisible },
    );
  }, []);
  const clearFocus = useCallback(
    function clearTrackedFocus() {
      const target = focusedTargetRef.current;
      target?.removeEventListener("blur", clearTrackedFocus);
      target?.removeEventListener("keydown", syncFocusVisible);
      target?.removeEventListener("pointerdown", syncFocusVisible);
      focusedTargetRef.current = null;
      setFocusState(UNFOCUSED_STATE);
    },
    [syncFocusVisible],
  );
  const onFocus = useCallback(
    (event?: FocusEventLike) => {
      clearFocus();
      const target = webFocusTarget(event);
      target?.addEventListener("blur", clearFocus, { once: true });
      target?.addEventListener("keydown", syncFocusVisible);
      target?.addEventListener("pointerdown", syncFocusVisible);
      focusedTargetRef.current = target;
      setFocusState({
        focused: true,
        focusVisible: target?.matches(":focus-visible") ?? true,
      });
    },
    [clearFocus, syncFocusVisible],
  );

  useEffect(
    () => () => {
      const target = focusedTargetRef.current;
      target?.removeEventListener("blur", clearFocus);
      target?.removeEventListener("keydown", syncFocusVisible);
      target?.removeEventListener("pointerdown", syncFocusVisible);
      focusedTargetRef.current = null;
    },
    [clearFocus, syncFocusVisible],
  );

  return {
    focusRingStyle,
    ringEnabled,
    // Outline reset to spread onto the focus target: suppress the browser's
    // default outline while the glow is the focus affordance, but let the UA
    // outline return once the ring is disabled so keyboard focus stays visible
    // (WCAG 2.1 — 2.4.7 Focus Visible, AA). Web-only, matching the glow.
    webOutlineReset: ringEnabled ? hideWebOutlineView : null,
    focused: focusState.focused,
    focusVisible: focusState.focusVisible,
    onBlur: clearFocus,
    onFocus,
  };
}

function webFocusTarget(event?: FocusEventLike): WebFocusTarget | null {
  if (Platform.OS !== "web") return null;
  const target = event?.currentTarget as Partial<WebFocusTarget> | undefined;
  return typeof target?.addEventListener === "function" &&
    typeof target.matches === "function" &&
    typeof target.removeEventListener === "function"
    ? (target as WebFocusTarget)
    : null;
}
