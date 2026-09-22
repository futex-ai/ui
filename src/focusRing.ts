import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, TextStyle, ViewStyle } from "./primitives/reactNative";

import {
  DEFAULT_FOCUS_RING_ALPHA,
  DEFAULT_FOCUS_RING_COLOR,
  DEFAULT_FOCUS_RING_WIDTH,
  focusRingColorFor,
  focusRingCssVariablesFor,
} from "./focusRingCss";
import { useSharedUiTheme } from "./theme";

export {
  FOCUS_RING_COLOR_VARIABLE,
  FOCUS_RING_WIDTH_VARIABLE,
  focusRingColorFor,
  focusRingCssVariablesFor,
  rgbChannels,
} from "./focusRingCss";

export const hideWebOutline = { outlineStyle: "none" } as unknown as TextStyle;

export const hideWebOutlineView = {
  outlineStyle: "none",
} as unknown as ViewStyle;

/** Pressable style-callback state, widened with the web backend's `hovered`. */
export type PressableHoverState = { pressed: boolean; hovered?: boolean };

export type FocusRingTarget = "self" | "descendant" | "parent";

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
   * Relationship from the painted box to the real focus target. The default
   * `self` marks one element. `descendant` paints an input frame around a
   * focused child; `parent` paints a child such as a switch track when its
   * parent owns focus.
   */
  target?: FocusRingTarget;
  /**
   * Suppress the glow entirely. On web this omits the CSS focus-ring marker and
   * leaves the browser outline enabled on the visible control box. Callers wire
   * this to `disableFocusRing`; the theme's `focusRing: false` flag applies the
   * same opt-out globally. `focusRingStyleFor` ignores this option.
   */
  disabled?: boolean;
};

/** Stable legacy style; hook-driven web painting now lives entirely in CSS. */
const EMPTY_RING_STYLE = Object.freeze({}) as ViewStyle;

/** Stable empty host props returned on native and for a disabled self target. */
const EMPTY_RING_PROPS = Object.freeze({}) as FocusRingHostProps;

/** Props to spread on the visible box that CSS should decorate. */
export type FocusRingHostProps = {
  dataSet?: {
    firnaFocusHost?: FocusRingTarget;
    firnaFocusRing?: FocusRingTarget;
    firnaFocusRingInset?: "true";
    firnaFocusTarget?: "true";
  };
};

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
 *
 * This is the explicit inline-style escape hatch for caller-owned local style
 * sheets. Library controls use {@link useFocusRing}; its CSS marker is the
 * canonical web path and therefore also works before hydration.
 */
export function focusRingStyleFor(options: FocusRingOptions): ViewStyle {
  const {
    color = DEFAULT_FOCUS_RING_COLOR,
    width = DEFAULT_FOCUS_RING_WIDTH,
    offset = 2,
    alpha = DEFAULT_FOCUS_RING_ALPHA,
  } = options;

  // Native keeps the OS focus affordance (as the old outline ring did — the
  // web-only shadow/outline props were inert there).
  if (Platform.OS !== "web") return {};

  const glow = focusRingColorFor(color, alpha);
  const inset = offset < 0 ? "inset " : "";

  return {
    // Suppress the browser's default focus outline so the glow stands alone.
    outlineStyle: "none",
    boxShadow: `${inset}0 0 0 ${width}px ${glow}`,
  } as unknown as ViewStyle;
}

/**
 * Marks a visible control box for the DOM backend's CSS focus rule and tracks
 * actual focus and visible-focus modality independently. The state remains for
 * non-painting behavior such as active borders and keyboard tooltips. Native
 * behavior is unchanged and keeps the operating-system focus affordance.
 */
export function useFocusRing(options: FocusRingOptions = {}) {
  const [focusState, setFocusState] = useState<FocusState>(UNFOCUSED_STATE);
  const focusedTargetRef = useRef<WebFocusTarget | null>(null);
  const theme = useSharedUiTheme();
  const color = options.color ?? theme.colors.primary;
  const { width, offset, alpha, disabled, target = "self" } = options;
  const ringEnabled = !disabled && theme.focusRing !== false;
  const focusRingVariables = useMemo<ViewStyle>(() => {
    if (!ringEnabled || Platform.OS !== "web") return EMPTY_RING_STYLE;
    return focusRingCssVariablesFor(color, width, alpha) as ViewStyle;
  }, [ringEnabled, color, width, alpha]);
  const focusRingProps = useMemo<FocusRingHostProps>(() => {
    if (Platform.OS !== "web" || (!ringEnabled && target === "self")) {
      return EMPTY_RING_PROPS;
    }
    return {
      dataSet: {
        firnaFocusHost: target === "self" ? undefined : target,
        firnaFocusRing: ringEnabled ? target : undefined,
        firnaFocusRingInset:
          ringEnabled && (offset ?? 2) < 0 ? "true" : undefined,
      },
    };
  }, [ringEnabled, offset, target]);
  const focusTargetProps = useMemo<FocusRingHostProps>(
    () =>
      Platform.OS === "web" && target !== "self"
        ? { dataSet: { firnaFocusTarget: "true" } }
        : EMPTY_RING_PROPS,
    [target],
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
    focusRingProps,
    focusTargetProps,
    focusRingVariables: ringEnabled ? focusRingVariables : null,
    // Kept for source compatibility. The hook no longer paints on web; use
    // `focusRingStyleFor` only for an explicit caller-owned inline ring.
    focusRingStyle: EMPTY_RING_STYLE,
    ringEnabled,
    // Kept for source compatibility. CSS now owns outline removal.
    webOutlineReset: null as ViewStyle | null,
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
