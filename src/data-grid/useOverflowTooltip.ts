/**
 * Hover state for revealing text the grid has clipped (web only).
 *
 * Owns the rest delay, the DOM measurement, and the dismissal rules; the pure
 * decisions live in {@link shouldRevealOnHover} and the surface in
 * {@link DataGridClippedText}.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, type View } from "react-native";

import {
  shouldRevealOnHover,
  type ClippedTextMetrics,
} from "./dataGridOverflowModel";

/**
 * Rest time before clipped text is revealed. Long enough that sweeping the
 * pointer along a row never flashes a popover over every cell it crosses.
 */
const OPEN_DELAY_MS = 400;

/**
 * Grace period after the pointer leaves the text, so it can cross the gutter
 * onto the popover without it vanishing on the way (WCAG 2.1 — 1.4.13, AA).
 */
const CLOSE_GRACE_MS = 120;

/** The DOM width fields react-native-web leaves on a host text node. */
type MeasurableNode = { clientWidth?: number; scrollWidth?: number };

/** Read a host node's box, or null when it is absent or not yet laid out. */
function measureNode(node: View | null): ClippedTextMetrics | null {
  const box = node as MeasurableNode | null;
  if (
    !box ||
    typeof box.clientWidth !== "number" ||
    typeof box.scrollWidth !== "number"
  ) {
    return null;
  }
  return { clientWidth: box.clientWidth, scrollWidth: box.scrollWidth };
}

export type OverflowTooltipState = {
  /** Ref for the text node: both the measured box and the popover's anchor. */
  anchorRef: React.RefObject<View | null>;
  close: () => void;
  onPointerEnter: (event: unknown) => void;
  onPointerLeave: () => void;
  open: boolean;
  /** Keeps the popover up while the pointer rests on the popover itself. */
  surfaceHoverProps: { onHoverIn: () => void; onHoverOut: () => void };
};

/**
 * Reveal `enabled` text after the pointer rests on it, provided it is actually
 * clipped. Off web (no hover) the hook stays inert and never opens.
 *
 * A press anywhere cancels a scheduled reveal and dismisses a shown one: the
 * grid drives range selection, column drags, and resizes from the pointer, and
 * `useDropdownDismiss` only sees presses *outside* the anchor — a press on the
 * hovered cell itself has to close too. Once dismissed this way the reveal
 * stays down until the pointer leaves and re-enters the text.
 */
export function useOverflowTooltip(enabled: boolean): OverflowTooltipState {
  const active = enabled && Platform.OS === "web";
  const anchorRef = useRef<View | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  // Mirrors `open` so the leave handler can branch without re-creating itself
  // (and going stale inside the already-attached listeners) on every toggle.
  const openRef = useRef(open);
  openRef.current = open;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    clearCloseTimer();
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, [clearCloseTimer]);

  const close = useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);

  // Read through a ref so the timers and listeners never capture a stale close.
  const closeRef = useRef(close);
  closeRef.current = close;

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      closeRef.current();
    }, CLOSE_GRACE_MS);
  }, [clearCloseTimer]);

  const onPointerEnter = useCallback(
    (event: unknown) => {
      if (!active) {
        return;
      }
      const buttons =
        (event as { nativeEvent?: { buttons?: number } } | null)?.nativeEvent
          ?.buttons ?? 0;
      cancel();
      // Subscribed here rather than from an effect keyed on state: a click
      // dispatches its move and press within a few milliseconds, so React has
      // not necessarily committed — and the effect not necessarily run — before
      // the press arrives. An effect would miss it and the reveal would then pop
      // up over the cell the user just clicked.
      if (typeof document !== "undefined") {
        const dismiss = () => closeRef.current();
        document.addEventListener("pointerdown", dismiss, true);
        unsubscribeRef.current = () =>
          document.removeEventListener("pointerdown", dismiss, true);
      }
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        // Measured when the delay elapses rather than on entry, so a column
        // resized mid-hover is judged at its current width.
        setOpen(
          shouldRevealOnHover({
            buttons,
            enabled: true,
            metrics: measureNode(anchorRef.current),
          }),
        );
      }, OPEN_DELAY_MS);
    },
    [active, cancel],
  );

  // Leaving a shown popover only starts the grace period, so the pointer can
  // reach it. Leaving before it opened drops the pending reveal outright —
  // waiting would let it flash open under a pointer that has already gone.
  const onPointerLeave = useCallback(() => {
    if (openRef.current) {
      scheduleClose();
      return;
    }
    close();
  }, [close, scheduleClose]);

  useEffect(() => cancel, [cancel]);

  return {
    anchorRef,
    close,
    onPointerEnter,
    onPointerLeave,
    open,
    surfaceHoverProps: {
      onHoverIn: clearCloseTimer,
      onHoverOut: scheduleClose,
    },
  };
}
