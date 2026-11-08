/**
 * Shared, platform-agnostic contract and width rules of the panel resize
 * handle. Both platform builds (`PanelResizeHandle.web.tsx`,
 * `PanelResizeHandle.tsx`) implement `PanelResizeHandleProps`.
 */
import type { StyleProp, ViewStyle } from "../primitives/reactNative";

import type { FocusIndicator } from "../focusRing";

/** The edge of the panel that the handle sits on. */
export type PanelResizeEdge = "end" | "start";

/** Width change of one arrow key or accessibility action, in px. */
export const PANEL_RESIZE_STEP = 16;

export type PanelResizeHandleProps = {
  /** Accessible name, such as "Resize project list". */
  accessibilityLabel: string;
  /** Turns the handle off. A drag in progress ends as a release does. */
  disabled?: boolean;
  /**
   * The edge of the panel that the handle sits on: `end` for a panel before
   * the main content, `start` for a panel after it. Moving the handle away
   * from the panel makes the panel wider.
   */
  edge: PanelResizeEdge;
  /** How keyboard focus shows on the grip. Defaults to the theme's mode. */
  focusIndicator?: FocusIndicator;
  /** Style of the grip, the short bar that shows while the handle is active. */
  gripStyle?: StyleProp<ViewStyle>;
  /** Style of the line that darkens while the handle is active. */
  lineStyle?: StyleProp<ViewStyle>;
  /** Widest the panel can get, from the caller's layout. */
  max: number;
  /** Narrowest the panel can get, from the caller's layout. */
  min: number;
  /** Each new width that the handle proposes, inside the bounds. */
  onChange: (width: number) => void;
  /**
   * The width at the end of a drag, a key change, or an accessibility action,
   * so the caller can store it once. A drag reports the last width that it
   * proposed, and only when the width changed.
   */
  onChangeEnd?: (width: number) => void;
  /** Width change of one arrow key or accessibility action. Default 16. */
  step?: number;
  /** Style of the handle, the 9px hit area over the panel edge. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** The current width of the panel, which the caller owns. */
  value: number;
};

/**
 * Rounds a width and keeps it inside the bounds. A `min` above `max` wins, so
 * a layout too narrow for both bounds still gets one width.
 */
export function clampPanelWidth(
  width: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, Math.round(width)));
}

/**
 * The width that a drag proposes: the start width plus the pointer's travel,
 * where travel away from the panel makes it wider.
 */
export function panelDragWidth(
  startWidth: number,
  travel: number,
  edge: PanelResizeEdge,
  min: number,
  max: number,
): number {
  const growth = edge === "end" ? travel : -travel;
  return clampPanelWidth(startWidth + growth, min, max);
}

type PanelKeyOptions = {
  edge: PanelResizeEdge;
  max: number;
  min: number;
  step: number;
};

/**
 * The width that a key proposes, or `null` for a key that the handle leaves
 * alone. Left and Right move the handle one step in their direction; Home
 * gives the minimum and End the maximum.
 */
export function panelKeyWidth(
  key: string,
  width: number,
  { edge, max, min, step }: PanelKeyOptions,
): number | null {
  switch (key) {
    case "ArrowLeft":
      return clampPanelWidth(
        width + (edge === "start" ? step : -step),
        min,
        max,
      );
    case "ArrowRight":
      return clampPanelWidth(width + (edge === "end" ? step : -step), min, max);
    case "Home":
      return clampPanelWidth(min, min, max);
    case "End":
      return clampPanelWidth(max, min, max);
    default:
      return null;
  }
}

/** The width that a native accessibility action proposes: one step wider or narrower. */
export function panelActionWidth(
  action: "decrement" | "increment",
  width: number,
  { max, min, step }: Omit<PanelKeyOptions, "edge">,
): number {
  return clampPanelWidth(
    width + (action === "increment" ? step : -step),
    min,
    max,
  );
}

/**
 * The value that the handle exposes: the width and the bounds, with `max`
 * never below `min`, and the width as text. Assistive technology reads the
 * text, so it hears the width, such as "232 pixels". Without a text, iOS and
 * Android describe a range value as a percentage of its bounds.
 */
export function panelResizeRange(
  value: number,
  min: number,
  max: number,
): { max: number; min: number; now: number; text: string } {
  const now = Math.round(value);
  return { max: Math.max(min, max), min, now, text: `${now} pixels` };
}
