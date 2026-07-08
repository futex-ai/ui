/** A single toast surface: tone accent, copy, optional action, and dismiss. */
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import type { ViewProps } from "react-native";

import { Button } from "../button";
import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  toastSolidToneBackground,
  toastSolidToneForeground,
  toastToneAccent,
} from "./toastColors";
import { createToastStyles } from "./toastStyles";
import { toastRole } from "./toastModel";
import type {
  ToastIcon,
  ToastIconRenderContext,
  ToastItem,
  ToastTone,
} from "./toastModel";

export type ToastProps = {
  /** The resolved toast to render. */
  toast: ToastItem;
  /** Invoked with the toast id when it should leave the stack. */
  onDismiss: (id: string) => void;
};

/** RNW-only pointer/focus handlers used to pause auto-dismiss; no-ops on native. */
type ToastPauseHandlers = {
  onBlur?: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

/**
 * Presentational toast card. It owns its own auto-dismiss countdown so trimming
 * the queue (which unmounts the toast) cancels the timer for free, and so
 * pausing while the pointer or keyboard focus is over the toast is local state.
 * A sticky toast (`duration === null`) never starts a timer.
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createToastStyles(theme), [theme]);
  const accent = toastToneAccent(theme, toast.tone);
  const solid = toast.variant === "solid";
  const filled = solid;
  const filledBackground = toastSolidToneBackground(theme, toast.tone);
  const filledForeground =
    toast.foregroundColor ?? toastSolidToneForeground(theme, filledBackground);
  const ToneIcon = TONE_ICONS[toast.tone];
  const iconContext: ToastIconRenderContext = {
    color: filled ? filledForeground : accent,
    size: 18,
    tone: toast.tone,
    variant: toast.variant,
  };
  const icon =
    toast.icon === undefined ? (
      solid ? null : (
        <ToneIcon color={accent} size={iconContext.size} />
      )
    ) : (
      renderToastIcon(toast.icon, iconContext)
    );
  const [paused, setPaused] = useState(false);
  // Also pause while the tab is hidden so a backgrounded toast does not silently
  // time out before the user (or a screen-reader virtual cursor that never moves
  // DOM focus) gets back to it (WCAG 2.1 — 2.2.1 Timing Adjustable, A).
  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const sync = () => setTabHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  const [filledActionFocused, setFilledActionFocused] = useState(false);
  const [closeFocused, setCloseFocused] = useState(false);
  const filledControlFocusRing = {
    boxShadow: `0 0 0 2px ${filledForeground}`,
  };
  // The close control's focus ring adapts to the variant so it stays visible
  // (WCAG 2.1 — 2.4.7 Focus Visible, AA): the filled foreground on a solid
  // toast, or a surface+primary ring on a card toast.
  const closeControlFocusRing = filled
    ? filledControlFocusRing
    : {
        boxShadow: `0 0 0 2px ${theme.colors.surface}, 0 0 0 4px ${theme.colors.primary}`,
      };
  // The toast container, so dismissing a focused toast can hand focus to a
  // sibling toast instead of dropping it to <body> (2.1.2 / 2.4.3, A).
  const containerRef = useRef<View>(null);

  // Decouple the dismiss callback from the timer effect so a new callback
  // identity does not restart the countdown (mirrors the modal's onCloseRef).
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // The countdown genuinely pauses (resumes from where it stopped) rather than
  // restarting: the time still owed is tracked here and decremented whenever a
  // running interval is torn down by a pause. Reset only when the toast or its
  // duration changes, never when `paused` toggles.
  const { duration, id } = toast;
  const remainingRef = useRef(duration);
  useEffect(() => {
    remainingRef.current = duration;
  }, [duration, id]);

  useEffect(() => {
    if (remainingRef.current === null || paused || tabHidden) {
      return;
    }
    const startedAt = Date.now();
    const remaining = remainingRef.current;
    const timer = setTimeout(() => onDismissRef.current(id), remaining);
    return () => {
      clearTimeout(timer);
      remainingRef.current = remaining - (Date.now() - startedAt);
    };
  }, [duration, id, paused, tabHidden]);

  // Dismiss via the close control: before the toast unmounts, hand keyboard
  // focus to a neighbouring toast's close control (or fall back to the page)
  // so focus is never silently dropped to <body> (2.1.2 / 2.4.3, A).
  const dismissFromClose = () => {
    if (Platform.OS === "web") {
      moveFocusToNeighbourToast(containerRef.current);
    }
    onDismiss(toast.id);
  };

  // Pause while hovered or focused so a reader is never raced by the timer.
  // These are React Native Web pointer/focus props; React Native ignores them.
  const pauseHandlers: ToastPauseHandlers = {
    onBlur: () => setPaused(false),
    onFocus: () => setPaused(true),
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
  };

  return (
    <View
      {...(pauseHandlers as ViewProps)}
      // The toast keeps its `status`/`alert` role so it is identifiable, but its
      // own live announcement is suppressed (`aria-live="off"` overrides the
      // implicit live behaviour of the role): the announcement is owned by the
      // persistent `ToastLiveRegion`, since a region born empty announces far
      // more reliably than one created with its content (WCAG 2.1 — 4.1.3, AA).
      aria-live="off"
      ref={containerRef}
      role={toastRole(toast.tone)}
      style={[
        styles.toast,
        filled
          ? [styles.solidToast, { backgroundColor: filledBackground }]
          : [styles.cardToast, { borderLeftColor: accent }],
        toast.surfaceStyle,
      ]}
    >
      {/* The leading/tone icon is decorative — its meaning is carried by the
          toast copy and the assistive-tech announcement, so hide it (1.1.1, A). */}
      {shouldRenderToastIcon(icon) ? (
        <View
          aria-hidden
          style={[
            styles.iconWrap,
            solid ? styles.solidIconWrap : null,
            toast.iconStyle,
          ]}
        >
          {icon}
        </View>
      ) : null}
      <View style={solid ? styles.solidContent : styles.content}>
        <Text
          style={[
            styles.title,
            solid ? [styles.solidTitle, { color: filledForeground }] : null,
            toast.titleStyle,
          ]}
        >
          {toast.title}
        </Text>
        {toast.description ? (
          <Text
            style={[
              styles.description,
              solid
                ? [styles.solidDescription, { color: filledForeground }]
                : null,
              toast.descriptionStyle,
            ]}
          >
            {toast.description}
          </Text>
        ) : null}
        {toast.action ? (
          <View style={[styles.actions, filled ? styles.solidActions : null]}>
            {filled ? (
              <Pressable
                accessibilityRole="button"
                onBlur={() => setFilledActionFocused(false)}
                onFocus={() => setFilledActionFocused(true)}
                onPress={() => {
                  toast.action?.onPress();
                  onDismiss(toast.id);
                }}
                style={({ hovered }: PressableHoverState) => [
                  styles.solidActionButton,
                  hovered ? styles.solidActionButtonHover : null,
                  filledActionFocused ? filledControlFocusRing : null,
                  hideWebOutlineView,
                ]}
              >
                <Text
                  style={[styles.solidActionText, { color: filledForeground }]}
                >
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : (
              <Button
                onPress={() => {
                  toast.action?.onPress();
                  onDismiss(toast.id);
                }}
                size="sm"
                tone="ghost"
              >
                {toast.action.label}
              </Button>
            )}
          </View>
        ) : null}
      </View>
      {toast.dismissible ? (
        <Pressable
          accessibilityLabel={`Dismiss ${toast.title}`}
          accessibilityRole="button"
          onBlur={() => setCloseFocused(false)}
          onFocus={() => setCloseFocused(true)}
          onPress={dismissFromClose}
          style={({ hovered }: PressableHoverState) => [
            styles.closeButton,
            filled ? styles.solidCloseButton : null,
            hovered
              ? filled
                ? styles.solidCloseButtonHover
                : styles.closeButtonHover
              : null,
            closeFocused ? closeControlFocusRing : null,
            hideWebOutlineView,
          ]}
        >
          {/* The "×" glyph is decorative; the Pressable's label carries the
              name ("Dismiss {title}"), so hide the icon from AT (1.1.1, A). */}
          <X
            aria-hidden
            color={filled ? filledForeground : theme.colors.muted}
            size={16}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Web only. When a toast is dismissed from its own close control, the button is
 * about to unmount, so move keyboard focus to the next (or previous) toast's
 * close control before it goes — otherwise focus drops to `<body>` and the
 * keyboard user loses their place (WCAG 2.1 — 2.4.3 Focus Order, 2.1.2, A).
 * `container` is the dismissing toast's DOM node (RNW renders `View` as a div).
 */
function moveFocusToNeighbourToast(container: View | null): void {
  const node = container as unknown;
  if (!(node instanceof HTMLElement) || typeof document === "undefined") {
    return;
  }
  const viewport = node.parentElement;
  if (!viewport) {
    return;
  }
  const buttons = Array.from(
    viewport.querySelectorAll<HTMLElement>('[aria-label^="Dismiss "]'),
  );
  // Drop the dismissing toast's own button (it sits inside `node`).
  const others = buttons.filter((button) => !node.contains(button));
  if (others.length === 0) {
    return;
  }
  // Prefer the button at this toast's position (the next toast that slides into
  // place); otherwise the last remaining one.
  const ownIndex = buttons.findIndex((button) => node.contains(button));
  const target =
    others.find((button) => buttons.indexOf(button) > ownIndex) ??
    others[others.length - 1];
  target.focus();
}

/** Leading icon per tone. */
const TONE_ICONS: Record<ToastTone, LucideIcon> = {
  error: CircleAlert,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
};

function renderToastIcon(
  icon: ToastIcon | null,
  context: ToastIconRenderContext,
) {
  return typeof icon === "function" ? icon(context) : icon;
}

function shouldRenderToastIcon(icon: ReturnType<typeof renderToastIcon>) {
  return icon !== null && icon !== undefined && icon !== false;
}
