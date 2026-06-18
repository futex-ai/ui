/**
 * Native-safe fallback for the month drag-to-create hook. Dragging across cells
 * is a pointer/DOM gesture, so on native this is an inert no-op with the exact
 * same signature as `useCalendarMonthDragCreate.web.ts`. Single-day create still
 * works on native because the cell keeps its own `onPress` (this hook never
 * suppresses it). Platform resolution picks the `.web` file on web and this on
 * native.
 */
import type { CalendarDraftRange } from "./types";

/** The live drag-to-create state + grid-container binder returned by the hook. */
export type CalendarMonthDragCreate = {
  /** The in-progress all-day date range to highlight, or null when idle. */
  draft: { start: string; end: string } | null;
  /** Spread onto the month grid container View to enable drag-to-create. */
  bindGrid: { ref: (node: unknown) => void };
  /** True exactly once after a drag created a range, to swallow the cell press. */
  consumePressSuppression: () => boolean;
};

/** Inert native hook: never produces a draft, binds nothing, suppresses nothing. */
export function useCalendarMonthDragCreate(_opts: {
  onCreateEvent?: (range: CalendarDraftRange) => void;
}): CalendarMonthDragCreate {
  return {
    draft: null,
    bindGrid: { ref: () => {} },
    consumePressSuppression: () => false,
  };
}
