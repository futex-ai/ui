/**
 * Centroid maths over the touch bank.
 *
 * A transcription of React Native's `TouchHistoryMath` as `react-native-web`
 * 0.21.2 vendors it. `PanResponder` accumulates *changes* in the centroid of
 * recently-moved touches rather than tracking one centroid over time, which is
 * what makes a three-finger gesture behave when one finger stops.
 *
 * Pure; `tests/unit/domResponder.test.ts` pins it.
 */
import type { TouchHistory } from "./touchHistory";

/** Returned when no touch qualifies, so callers can tell "none" from zero. */
export const NO_CENTROID = -1;

/**
 * The centroid of the touches that moved after `touchesChangedAfter`.
 *
 * @param isXAxis whether to measure x rather than y.
 * @param ofCurrent whether to use each touch's current rather than previous
 *   position.
 */
export function centroidDimension(
  touchHistory: TouchHistory,
  touchesChangedAfter: number,
  isXAxis: boolean,
  ofCurrent: boolean,
): number {
  const { touchBank } = touchHistory;
  let total = 0;
  let count = 0;

  const oneTouchData =
    touchHistory.numberActiveTouches === 1
      ? touchBank[touchHistory.indexOfSingleActiveTouch]
      : null;

  if (oneTouchData != null) {
    if (
      oneTouchData.touchActive &&
      oneTouchData.currentTimeStamp > touchesChangedAfter
    ) {
      total += ofCurrent
        ? isXAxis
          ? oneTouchData.currentPageX
          : oneTouchData.currentPageY
        : isXAxis
          ? oneTouchData.previousPageX
          : oneTouchData.previousPageY;
      count = 1;
    }
  } else {
    for (const touchTrack of touchBank) {
      if (
        touchTrack != null &&
        touchTrack.touchActive &&
        touchTrack.currentTimeStamp >= touchesChangedAfter
      ) {
        total += ofCurrent
          ? isXAxis
            ? touchTrack.currentPageX
            : touchTrack.currentPageY
          : isXAxis
            ? touchTrack.previousPageX
            : touchTrack.previousPageY;
        count++;
      }
    }
  }
  return count > 0 ? total / count : NO_CENTROID;
}

/** Current x centroid of the touches that moved after `after`. */
export function currentCentroidXOfTouchesChangedAfter(
  touchHistory: TouchHistory,
  after: number,
): number {
  return centroidDimension(touchHistory, after, true, true);
}

/** Current y centroid of the touches that moved after `after`. */
export function currentCentroidYOfTouchesChangedAfter(
  touchHistory: TouchHistory,
  after: number,
): number {
  return centroidDimension(touchHistory, after, false, true);
}

/** Previous x centroid of the touches that moved after `after`. */
export function previousCentroidXOfTouchesChangedAfter(
  touchHistory: TouchHistory,
  after: number,
): number {
  return centroidDimension(touchHistory, after, true, false);
}

/** Previous y centroid of the touches that moved after `after`. */
export function previousCentroidYOfTouchesChangedAfter(
  touchHistory: TouchHistory,
  after: number,
): number {
  return centroidDimension(touchHistory, after, false, false);
}

/** Current x centroid of every active touch. */
export function currentCentroidX(touchHistory: TouchHistory): number {
  return centroidDimension(touchHistory, 0, true, true);
}

/** Current y centroid of every active touch. */
export function currentCentroidY(touchHistory: TouchHistory): number {
  return centroidDimension(touchHistory, 0, false, true);
}
