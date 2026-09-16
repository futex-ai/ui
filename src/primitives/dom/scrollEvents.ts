/**
 * The scroll event shape and throttle rule a `ScrollView` reports with.
 *
 * Transcribed from `react-native-web` 0.21.2's
 * `exports/ScrollView/ScrollViewBase.js`. Every measurement is a getter reading
 * the scroll node, so a handler that only wants `contentOffset.y` never forces
 * the browser to compute `scrollWidth`, and the values are always current even
 * if the handler defers its work.
 *
 * Pure; `tests/unit/domScrollView.test.ts` pins both.
 */
import type { NativeScrollEvent, NativeSyntheticEvent } from "../types";

/** The node a scroll event measures. */
export type ScrollNode = {
  offsetHeight: number;
  offsetWidth: number;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
};

/** The scroll event a `ScrollView` hands `onScroll`. */
export function normalizeScrollEvent(
  target: ScrollNode,
): NativeSyntheticEvent<NativeScrollEvent> {
  return {
    nativeEvent: {
      contentOffset: {
        get x() {
          return target.scrollLeft;
        },
        get y() {
          return target.scrollTop;
        },
      },
      contentSize: {
        get height() {
          return target.scrollHeight;
        },
        get width() {
          return target.scrollWidth;
        },
      },
      layoutMeasurement: {
        get height() {
          return target.offsetHeight;
        },
        get width() {
          return target.offsetWidth;
        },
      },
    },
    timeStamp: Date.now(),
  } as unknown as NativeSyntheticEvent<NativeScrollEvent>;
}

/**
 * Whether enough time has passed since the last reported tick.
 *
 * A `scrollEventThrottle` of `0` (the default) reports only the first event of
 * a gesture and the one the settle timer fires, which is why every caller that
 * wants a stream passes `16`.
 */
export function shouldEmitScrollEvent(
  lastTick: number,
  eventThrottle: number,
  now: number = Date.now(),
): boolean {
  return eventThrottle > 0 && now - lastTick >= eventThrottle;
}
