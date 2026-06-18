/**
 * Native-safe fallback for the drag-to-create time-grid hook. Drag-to-create is
 * a pointer/DOM gesture, so on native this is an inert no-op with the exact same
 * signature as the web implementation in `useCalendarDragCreate.web.ts`. Platform
 * resolution picks the `.web` file on web and this file on native.
 */
import type { CalendarDraftRange } from "./types";

/** The live drag-to-create state + per-column binder returned by the hook. */
export type CalendarDragCreate = {
  /** The in-progress draft to render as a ghost, or null when idle. */
  draft: { column: number; topMinutes: number; bottomMinutes: number } | null;
  /** Spread onto each day-column View; receives the column index + its date. */
  bindColumn: (
    columnIndex: number,
    date: string,
  ) => {
    ref: (node: unknown) => void;
    onPointerDown?: (event: unknown) => void;
  };
};

/** Inert native hook: never produces a draft and binds no pointer handlers. */
export function useCalendarDragCreate(_opts: {
  minHour: number;
  maxHour: number;
  pxPerHour: number;
  slotMinutes: number;
  onCreateEvent?: (range: CalendarDraftRange) => void;
}): CalendarDragCreate {
  return {
    draft: null,
    bindColumn: () => ({ ref: () => {} }),
  };
}
