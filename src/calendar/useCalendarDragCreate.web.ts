/**
 * Web drag-to-create for the time grid. A left-button pointer drag over a day
 * column maps `clientY` → minutes (snapped to `slotMinutes`) and live-updates a
 * `draft` the grid renders as a translucent ghost; on release it builds a
 * `CalendarDraftRange` and calls `onCreateEvent`. A click with no movement
 * creates a default `slotMinutes`-long event at the clicked slot. Mirrors the
 * document pointer-listener idiom of `DragSelectableProvider.web.tsx`: touch and
 * non-left buttons are ignored, and everything is guarded by `typeof document`.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { addMinutes, makeDateTime, snap, yToMinutes } from "./calendarMath";
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

/** A DOM node that may expose `getBoundingClientRect` (cast guard for RN types). */
type Measurable = { getBoundingClientRect?: () => DOMRect } | null;

/** A pointer-like event with the fields we read off `pointerdown`/`pointermove`. */
type PointerLike = {
  button?: number;
  pointerType?: string;
  clientY?: number;
  preventDefault?: () => void;
};

/** An in-flight drag: the column being dragged + its date + start/current slot. */
type DragSession = {
  column: number;
  date: string;
  topMinutes: number;
  bottomMinutes: number;
  moved: boolean;
};

export function useCalendarDragCreate(opts: {
  minHour: number;
  maxHour: number;
  pxPerHour: number;
  slotMinutes: number;
  onCreateEvent?: (range: CalendarDraftRange) => void;
}): CalendarDragCreate {
  // Keep the latest options in a ref so the document listeners (attached once per
  // drag) always read fresh geometry/callbacks without re-binding.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const nodesRef = useRef(new Map<number, Measurable>());
  const sessionRef = useRef<DragSession | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const [draft, setDraft] = useState<CalendarDragCreate["draft"]>(null);

  // Snap a `clientY` (page coords) to a minute within the column's rect, clamped
  // to the visible [minHour, maxHour] grid so a drag past the edges never yields
  // an out-of-range minute (which would serialise to an invalid `T24:00`).
  const minutesAt = useCallback((node: Measurable, clientY: number): number => {
    const rect = node?.getBoundingClientRect?.();
    const top = rect?.top ?? 0;
    const { minHour, maxHour, pxPerHour, slotMinutes } = optsRef.current;
    const raw = yToMinutes(clientY - top, minHour, pxPerHour);
    const snapped = snap(raw, slotMinutes);
    return Math.min(Math.max(snapped, minHour * 60), maxHour * 60);
  }, []);

  const finish = useCallback((commit: boolean) => {
    removeListenersRef.current?.();
    removeListenersRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    setDraft(null);
    if (!session || !commit) {
      return;
    }
    const step = optsRef.current.slotMinutes;
    const dayEnd = optsRef.current.maxHour * 60;
    let lo = Math.min(session.topMinutes, session.bottomMinutes);
    let hi = Math.max(session.topMinutes, session.bottomMinutes);
    // A bare click (no drag) becomes a default one-slot event at the clicked slot.
    if (hi - lo < step) {
      hi = lo + step;
    }
    // Keep the range inside the grid: pin the end to the grid bottom and back the
    // start off by a slot if the one-slot extension overshot it.
    if (hi > dayEnd) {
      hi = dayEnd;
      lo = Math.min(lo, hi - step);
    }
    // Build the end from the start so a bottom-of-grid end (e.g. 24:00) carries to
    // the next day's midnight instead of an invalid `T24:00`. `lo` is always
    // `<= maxHour*60 - step`, so it is a valid same-day minute for makeDateTime.
    const start = makeDateTime(session.date, lo);
    const range: CalendarDraftRange = {
      start,
      end: addMinutes(start, hi - lo),
      allDay: false,
    };
    optsRef.current.onCreateEvent?.(range);
  }, []);

  const attachListeners = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      event.preventDefault();
      const node = nodesRef.current.get(session.column) ?? null;
      const bottom = minutesAt(node, event.clientY);
      session.bottomMinutes = bottom;
      session.moved = true;
      setDraft({
        column: session.column,
        topMinutes: Math.min(session.topMinutes, bottom),
        bottomMinutes: Math.max(session.topMinutes, bottom),
      });
    };
    const handleUp = () => finish(true);
    const handleCancel = () => finish(false);
    document.addEventListener("pointermove", handleMove, true);
    document.addEventListener("pointerup", handleUp, true);
    document.addEventListener("pointercancel", handleCancel, true);
    window.addEventListener("blur", handleCancel, true);
    removeListenersRef.current = () => {
      document.removeEventListener("pointermove", handleMove, true);
      document.removeEventListener("pointerup", handleUp, true);
      document.removeEventListener("pointercancel", handleCancel, true);
      window.removeEventListener("blur", handleCancel, true);
    };
  }, [finish, minutesAt]);

  const bindColumn = useCallback(
    (columnIndex: number, date: string) => ({
      ref: (node: unknown) => {
        if (node) {
          nodesRef.current.set(columnIndex, node as Measurable);
        } else {
          nodesRef.current.delete(columnIndex);
        }
      },
      onPointerDown: (event: unknown) => {
        if (typeof document === "undefined") {
          return;
        }
        const e = event as PointerLike;
        // Ignore touch + non-left buttons, exactly like drag-select.
        if (e.button !== undefined && e.button !== 0) {
          return;
        }
        if (e.pointerType === "touch") {
          return;
        }
        e.preventDefault?.();
        const node = nodesRef.current.get(columnIndex) ?? null;
        const start = minutesAt(node, e.clientY ?? 0);
        sessionRef.current = {
          column: columnIndex,
          date,
          topMinutes: start,
          bottomMinutes: start,
          moved: false,
        };
        setDraft({
          column: columnIndex,
          topMinutes: start,
          bottomMinutes: start,
        });
        attachListeners();
      },
    }),
    [attachListeners, minutesAt],
  );

  // Tear down any in-flight listeners if the hook unmounts mid-drag.
  useEffect(() => () => removeListenersRef.current?.(), []);

  return { draft, bindColumn };
}
