/**
 * Edge auto-scroll of a grid drag. While the pointer rests in the edge zone of
 * the grid's scroller, each animation frame scrolls one step and extends the
 * drag to the point. The loop stops outside the zone, and the next pointer
 * move starts it again. No-op outside the browser.
 */
import { useCallback, useRef } from "react";

import { autoScrollDelta } from "../dragGesture";

import { findGridScrollers } from "./dataGridDragDom";

type Point = { x: number; y: number };

/**
 * `readGrid` and `readPoint` read the grid node and the drag's last pointer
 * point, or `null` once the drag ends. Pass stable callbacks.
 */
export function useDataGridAutoScroll(
  readGrid: () => Element | null,
  readPoint: () => Point | null,
  extend: (point: Point) => void,
) {
  const rafRef = useRef<number | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (
      rafRef.current !== null &&
      typeof cancelAnimationFrame !== "undefined"
    ) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (
      rafRef.current !== null ||
      typeof requestAnimationFrame === "undefined"
    ) {
      return;
    }
    const step = () => {
      rafRef.current = null;
      const point = readPoint();
      const grid = readGrid();
      if (!point || !grid) {
        return;
      }
      const { horizontal, vertical } = findGridScrollers(grid);
      const scroller = vertical ?? grid;
      const { dx, dy } = autoScrollDelta(
        point,
        scroller.getBoundingClientRect(),
      );
      if (dx === 0 && dy === 0) {
        return; // out of the edge zone — stop until the next move restarts it
      }
      if (horizontal && dx !== 0) {
        horizontal.scrollLeft += dx;
      }
      if (vertical && dy !== 0) {
        vertical.scrollTop += dy;
      }
      extend(point);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [extend, readGrid, readPoint]);

  return { startAutoScroll, stopAutoScroll };
}
