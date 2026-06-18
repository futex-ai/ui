/** Pure types and helpers for the toast notification system. */

/**
 * Visual + semantic tone of a toast:
 * - `info` (default) — a neutral, primary-accented notice.
 * - `success` — a positive confirmation, primary-green accent.
 * - `warning` — a cautionary notice, amber accent.
 * - `error` — a failure notice, rose accent; announced assertively.
 */
export type ToastTone = "error" | "info" | "success" | "warning";

/**
 * Visual presentation of a toast.
 * - `card` (default) — surface card with a leading tone icon and accent strip.
 * - `solid` — compact filled toast for short, bottom-centered feedback.
 */
export type ToastVariant = "card" | "solid";

/**
 * Where the toast stack is pinned within the viewport. The first segment picks
 * the vertical edge and the second the horizontal alignment.
 */
export type ToastPlacement =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

/** An optional action button rendered inside a toast. */
export type ToastAction = {
  /** Button label, e.g. "Undo". */
  label: string;
  /** Invoked when the action is pressed; the toast then dismisses. */
  onPress: () => void;
};

/** Options accepted by the `toast()` trigger returned from {@link useToast}. */
export type ToastOptions = {
  /** Bold headline line. */
  title: string;
  /** Optional secondary line beneath the title. */
  description?: string;
  /** Visual + semantic tone. Defaults to `info`. */
  tone?: ToastTone;
  /** Visual presentation. Defaults to `card`. */
  variant?: ToastVariant;
  /**
   * Auto-dismiss delay in milliseconds. Omit to use the provider default; pass
   * `null` (or a value `<= 0`) for a sticky toast that stays until dismissed.
   */
  duration?: number | null;
  /** Optional action button (e.g. "Undo"). */
  action?: ToastAction;
  /**
   * Show the close button. Defaults to `true`. A toast that is both sticky
   * (`duration: null`) and `dismissible: false` can only be removed with
   * `dismiss(id)` or `dismissAll()`.
   */
  dismissible?: boolean;
};

/** A live toast tracked by the provider; every optional field is resolved. */
export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** Resolved auto-dismiss delay in ms, or `null` when sticky. */
  duration: number | null;
  action?: ToastAction;
  dismissible: boolean;
  variant: ToastVariant;
};

/** The default tone applied when a caller omits `tone`. */
export const DEFAULT_TOAST_TONE: ToastTone = "info";
/** The default visual presentation applied when a caller omits `variant`. */
export const DEFAULT_TOAST_VARIANT: ToastVariant = "card";
/** The default auto-dismiss delay, in milliseconds. */
export const DEFAULT_TOAST_DURATION = 5000;
/** The default cap on simultaneously visible toasts. */
export const DEFAULT_TOAST_MAX = 4;
/** The default viewport placement. */
export const DEFAULT_TOAST_PLACEMENT: ToastPlacement = "bottom-right";

/**
 * Builds a stable, ordered toast id from a monotonically increasing sequence
 * number. Ordering by id matches insertion order, which the stack relies on.
 */
export function makeToastId(seq: number): string {
  return `toast-${seq}`;
}

/**
 * Resolves a toast's auto-dismiss delay. An omitted `duration` falls back to
 * the provider default; an explicit `null` or a non-positive number means the
 * toast is sticky (never auto-dismisses) and returns `null`.
 */
export function resolveToastDuration(
  duration: number | null | undefined,
  fallback: number,
): number | null {
  const value = duration === undefined ? fallback : duration;
  if (value === null) {
    return null;
  }
  return value > 0 ? value : null;
}

/** Resolves caller {@link ToastOptions} into a fully-populated {@link ToastItem}. */
export function createToastItem(
  id: string,
  options: ToastOptions,
  fallbackDuration: number,
): ToastItem {
  return {
    action: options.action,
    description: options.description,
    dismissible: options.dismissible ?? true,
    duration: resolveToastDuration(options.duration, fallbackDuration),
    id,
    title: options.title,
    tone: options.tone ?? DEFAULT_TOAST_TONE,
    variant: options.variant ?? DEFAULT_TOAST_VARIANT,
  };
}

/**
 * Appends a toast and trims the queue to `max` by dropping the oldest entries,
 * so a burst of toasts can never grow the stack without bound. A `max <= 0`
 * disables the cap.
 */
export function enqueueToast(
  list: ToastItem[],
  item: ToastItem,
  max: number,
): ToastItem[] {
  const next = [...list, item];
  if (max > 0 && next.length > max) {
    return next.slice(next.length - max);
  }
  return next;
}

/** Removes the toast with the given id, leaving the rest in order. */
export function dequeueToast(list: ToastItem[], id: string): ToastItem[] {
  return list.filter((toast) => toast.id !== id);
}

/**
 * The screen-reader live-region politeness for a tone. Errors interrupt
 * (`assertive`); everything else waits for a pause (`polite`).
 */
export function toastLiveRegion(tone: ToastTone): "assertive" | "polite" {
  return tone === "error" ? "assertive" : "polite";
}

/**
 * The ARIA role for a tone. Errors map to `alert` (implicitly assertive);
 * everything else maps to `status`.
 */
export function toastRole(tone: ToastTone): "alert" | "status" {
  return tone === "error" ? "alert" : "status";
}

/**
 * Stack direction so the newest toast always sits nearest the pinned edge:
 * top placements render newest-first (`column-reverse`) so it hugs the top,
 * bottom placements render oldest-first (`column`) so the newest hugs the
 * bottom.
 */
export function toastStackDirection(
  placement: ToastPlacement,
): "column" | "column-reverse" {
  return placement.startsWith("top") ? "column-reverse" : "column";
}

/** Cross-axis alignment of the stack derived from the horizontal segment. */
export function toastStackAlign(
  placement: ToastPlacement,
): "center" | "flex-end" | "flex-start" {
  if (placement.endsWith("center")) {
    return "center";
  }
  return placement.endsWith("right") ? "flex-end" : "flex-start";
}

/** Inset (in px) of the viewport region from the pinned viewport edges. */
export const TOAST_VIEWPORT_INSET = 16;

/**
 * Absolute/fixed inset for the viewport region. Center placements span the full
 * width (`left`/`right` 0) so the stack can center; edge placements pin only
 * their side so the region hugs its corner and sizes to the toasts.
 */
export function toastViewportInset(placement: ToastPlacement): {
  bottom?: number;
  left?: number;
  right?: number;
  top?: number;
} {
  const inset = TOAST_VIEWPORT_INSET;
  const vertical = placement.startsWith("top")
    ? { top: inset }
    : { bottom: inset };
  if (placement.endsWith("center")) {
    return { ...vertical, left: 0, right: 0 };
  }
  if (placement.endsWith("right")) {
    return { ...vertical, right: inset };
  }
  return { ...vertical, left: inset };
}
