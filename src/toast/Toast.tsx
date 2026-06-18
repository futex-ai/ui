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
import { Pressable, Text, View } from "react-native";
import type { ViewProps } from "react-native";

import { Button } from "../button";
import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";

import { createToastStyles } from "./toastStyles";
import { toastLiveRegion, toastRole } from "./toastModel";
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
  const solid = toast.variant === "solid";
  const solidBackground = toastSolidToneBackground(theme, toast.tone);
  const ToneIcon = TONE_ICONS[toast.tone];
  const [paused, setPaused] = useState(false);

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
    if (remainingRef.current === null || paused) {
      return;
    }
    const startedAt = Date.now();
    const remaining = remainingRef.current;
    const timer = setTimeout(() => onDismissRef.current(id), remaining);
    return () => {
      clearTimeout(timer);
      remainingRef.current = remaining - (Date.now() - startedAt);
    };
  }, [duration, id, paused]);

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
      accessibilityLiveRegion={toastLiveRegion(toast.tone)}
      role={toastRole(toast.tone)}
      style={[
        styles.toast,
        solid
          ? [styles.solidToast, { backgroundColor: solidBackground }]
          : [styles.cardToast, { borderLeftColor: accent }],
      ]}
    >
      {solid ? null : (
        <View style={styles.iconWrap}>
          <ToneIcon color={accent} size={18} />
        </View>
      )}
      <View style={[styles.content, solid ? styles.solidContent : null]}>
        <Text style={[styles.title, solid ? styles.solidTitle : null]}>
          {toast.title}
        </Text>
        {toast.description ? (
          <Text
            style={[styles.description, solid ? styles.solidDescription : null]}
          >
            {toast.description}
          </Text>
        ) : null}
        {toast.action ? (
          <View style={[styles.actions, solid ? styles.solidActions : null]}>
            {solid ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  onDismiss(toast.id);
                }}
                style={({ hovered }: PressableHoverState) => [
                  styles.solidActionButton,
                  hovered ? styles.solidActionButtonHover : null,
                  hideWebOutlineView,
                ]}
              >
                <Text style={styles.solidActionText}>{toast.action.label}</Text>
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
          onPress={() => onDismiss(toast.id)}
          style={({ hovered }: PressableHoverState) => [
            styles.closeButton,
            solid ? styles.solidCloseButton : null,
            hovered
              ? solid
                ? styles.solidCloseButtonHover
                : styles.closeButtonHover
              : null,
            hideWebOutlineView,
          ]}
        >
          <X
            color={solid ? theme.colors.surface : theme.colors.muted}
            size={16}
          />
        </Pressable>
      ) : null}
    </View>
  );
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

/** Filled background colour for the compact solid variant. */
function toastSolidToneBackground(
  theme: SharedUiTheme,
  tone: ToastTone,
): string {
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
