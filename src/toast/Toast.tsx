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
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";

import { createToastStyles } from "./toastStyles";
import { toastRole } from "./toastModel";
import type { ToastItem, ToastTone } from "./toastModel";

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
  const ToneIcon = TONE_ICONS[toast.tone];
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
  // Keyboard focus on the close button shows a geometry-bearing ring; the close
  // control hides the UA outline, so without this the keyboard user gets no
  // focus indicator (WCAG 2.1 — 2.4.7 Focus Visible, AA). The ring is inset
  // (`offset: -2`) because the toast card clips overflow, which would otherwise
  // crop an outset outline on this near-edge control.
  const closeFocus = useFocusRing({ offset: -2 });
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
      style={[styles.toast, { borderLeftColor: accent }]}
    >
      {/* Tone icon is decorative — its meaning is carried by the toast copy and
          the assistive-tech announcement, so hide it from AT (1.1.1, A). */}
      <View aria-hidden style={styles.iconWrap}>
        <ToneIcon color={accent} size={18} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.description ? (
          <Text style={styles.description}>{toast.description}</Text>
        ) : null}
        {toast.action ? (
          <View style={styles.actions}>
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
          </View>
        ) : null}
      </View>
      {toast.dismissible ? (
        <Pressable
          accessibilityLabel={`Dismiss ${toast.title}`}
          accessibilityRole="button"
          onBlur={closeFocus.onBlur}
          onFocus={closeFocus.onFocus}
          onPress={dismissFromClose}
          style={({ hovered }: PressableHoverState) => [
            styles.closeButton,
            hovered ? styles.closeButtonHover : null,
            // Suppress the UA default outline first, then layer the shared
            // focus ring last so its `outline` is the one that wins when
            // focused (the ring would otherwise be clobbered by the reset).
            hideWebOutlineView,
            closeFocus.focused ? closeFocus.focusRingStyle : null,
          ]}
        >
          {/* The "×" glyph is decorative; the Pressable's label carries the
              name ("Dismiss {title}"), so hide the icon from AT (1.1.1, A). */}
          <X aria-hidden color={theme.colors.muted} size={16} />
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

/** Tone accent colour for the left strip and leading icon. */
function toastToneAccent(theme: SharedUiTheme, tone: ToastTone): string {
  switch (tone) {
    case "error":
      return theme.colors.rose;
    case "success":
      return theme.colors.primary;
    case "warning":
      return theme.colors.amber;
    default:
      return theme.colors.primaryDeep;
  }
}
