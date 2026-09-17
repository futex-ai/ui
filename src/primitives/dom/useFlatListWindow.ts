/**
 * The stateful half of the windowed list: scroll metrics, frames and batching.
 *
 * Transcribed from React Native's `VirtualizedList` as `react-native-web`
 * 0.21.2 vendors it — `_onScroll`, `_onLayout`, `_onContentSizeChange`,
 * `_onCellLayout`, `_scheduleCellsToRenderUpdate`, `_maybeCallOnEdgeReached`
 * and `__getFrameMetricsApprox` — reduced to one hook. `FlatList.tsx` renders
 * whatever window this reports.
 *
 * The window grows a batch at a time on a 50 ms timer, and jumps straight to a
 * synchronous update when the viewport has outrun it (the "hi-pri" path), which
 * is what keeps a `scrollToIndex` far down the list mounting its target row
 * before the next frame.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  computeWindowedRenderLimits,
  constrainToItemCount,
  getScrollingThreshold,
  initialRenderRegion,
  DEFAULT_END_REACHED_THRESHOLD_PX,
  DEFAULT_MAX_TO_RENDER_PER_BATCH,
  DEFAULT_UPDATE_CELLS_BATCHING_PERIOD_MS,
  DEFAULT_WINDOW_SIZE,
  ON_EDGE_REACHED_EPSILON,
  type FlatListWindow,
  type FlatListWindowOptions,
  type FrameMetrics,
  type ScrollMetrics,
  type WindowRange,
} from "./flatListWindow";

export function useFlatListWindow(
  options: FlatListWindowOptions,
): FlatListWindow {
  const latest = useRef(options);
  latest.current = options;

  const [renderWindow, setRenderWindow] = useState<WindowRange>(() =>
    initialRenderRegion(
      options.itemCount,
      options.initialNumToRender,
      options.initialScrollIndex,
    ),
  );
  // Appending or removing rows clips the window in place, exactly as that
  // backend's `getDerivedStateFromProps` did, without a second render.
  const effectiveWindow = constrainToItemCount(
    renderWindow,
    options.itemCount,
    DEFAULT_MAX_TO_RENDER_PER_BATCH,
  );
  const windowRef = useRef(effectiveWindow);
  windowRef.current = effectiveWindow;

  const frames = useRef(new Map<string, FrameMetrics & { index: number }>());
  const totals = useRef({ length: 0, measured: 0 });
  const averageCellLength = useRef(0);
  const highestMeasuredFrameIndex = useRef(0);
  const sentEndForContentLength = useRef(0);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiPriInProgress = useRef(false);
  const scrollMetrics = useRef<ScrollMetrics>({
    contentLength: 0,
    offset: 0,
    timestamp: 0,
    velocity: 0,
    visibleLength: 0,
  });

  useEffect(
    () => () => {
      if (batchTimer.current != null) {
        clearTimeout(batchTimer.current);
      }
    },
    [],
  );

  const getFrameMetricsApprox = useCallback((index: number): FrameMetrics => {
    const { getFrameFromLayout } = latest.current;
    if (getFrameFromLayout != null) {
      return getFrameFromLayout(index);
    }
    for (const frame of frames.current.values()) {
      if (frame.index === index) {
        return frame;
      }
    }
    return {
      length: averageCellLength.current,
      offset: averageCellLength.current * index,
    };
  }, []);

  const maybeCallOnEndReached = useCallback(() => {
    const { itemCount, onEndReached, onEndReachedThreshold } = latest.current;
    const { contentLength, offset, visibleLength } = scrollMetrics.current;
    let distanceFromEnd = contentLength - visibleLength - offset;
    // Debouncing means the last pixel is often never reported, so a distance
    // this small counts as having arrived.
    if (distanceFromEnd < ON_EDGE_REACHED_EPSILON) {
      distanceFromEnd = 0;
    }
    const threshold =
      onEndReachedThreshold != null
        ? onEndReachedThreshold * visibleLength
        : DEFAULT_END_REACHED_THRESHOLD_PX;
    const isWithinThreshold = distanceFromEnd <= threshold;

    if (
      onEndReached != null &&
      windowRef.current.last === itemCount - 1 &&
      isWithinThreshold &&
      contentLength !== sentEndForContentLength.current
    ) {
      sentEndForContentLength.current = contentLength;
      onEndReached({ distanceFromEnd });
      return;
    }
    // Scrolling away and back again re-arms the callback.
    if (!isWithinThreshold) {
      sentEndForContentLength.current = 0;
    }
  }, []);

  const updateCellsToRender = useCallback(() => {
    const { itemCount } = latest.current;
    const { contentLength, visibleLength } = scrollMetrics.current;
    const previous = windowRef.current;
    // Until the scroller has been measured, trust `initialNumToRender`.
    if (visibleLength <= 0 || contentLength <= 0) {
      return;
    }
    const next = computeWindowedRenderLimits(
      itemCount,
      DEFAULT_MAX_TO_RENDER_PER_BATCH,
      DEFAULT_WINDOW_SIZE,
      previous,
      getFrameMetricsApprox,
      scrollMetrics.current,
    );
    if (next.first !== previous.first || next.last !== previous.last) {
      windowRef.current = next;
      setRenderWindow(next);
    }
  }, [getFrameMetricsApprox]);

  const scheduleUpdate = useCallback(() => {
    const { itemCount } = latest.current;
    const { first, last } = windowRef.current;
    const { offset, velocity, visibleLength } = scrollMetrics.current;
    let hiPri = false;
    const endThreshold = getScrollingThreshold(
      latest.current.onEndReachedThreshold ?? 2,
      visibleLength,
    );
    if (first > 0) {
      const distTop = offset - getFrameMetricsApprox(first).offset;
      // `onStartReached` is not part of the seam, so its threshold is the
      // default two viewports.
      hiPri =
        distTop < 0 ||
        (velocity < -2 && distTop < getScrollingThreshold(2, visibleLength));
    }
    if (!hiPri && last >= 0 && last < itemCount - 1) {
      const distBottom =
        getFrameMetricsApprox(last).offset - (offset + visibleLength);
      hiPri = distBottom < 0 || (velocity > 2 && distBottom < endThreshold);
    }
    // A hi-pri update skips the batcher so the blank area fills immediately.
    if (
      hiPri &&
      (averageCellLength.current > 0 ||
        latest.current.getFrameFromLayout != null) &&
      !hiPriInProgress.current
    ) {
      hiPriInProgress.current = true;
      if (batchTimer.current != null) {
        clearTimeout(batchTimer.current);
        batchTimer.current = null;
      }
      updateCellsToRender();
      return;
    }
    if (batchTimer.current == null) {
      batchTimer.current = setTimeout(() => {
        batchTimer.current = null;
        updateCellsToRender();
      }, DEFAULT_UPDATE_CELLS_BATCHING_PERIOD_MS);
    }
  }, [getFrameMetricsApprox, updateCellsToRender]);

  // `componentDidUpdate` scheduled another batch after *every* render, which is
  // what grows the window past the first batch when nothing else is happening:
  // each batch re-renders, each re-render schedules the next, and the chain
  // stops the moment a batch leaves the window unchanged. The `hiPri` flag is
  // cleared here, not in the update, so one fiber update can only take the
  // synchronous path once.
  useEffect(() => {
    const wasHiPri = hiPriInProgress.current;
    scheduleUpdate();
    if (wasHiPri) {
      hiPriInProgress.current = false;
    }
  });

  const onScroll = useCallback(
    (metrics: {
      contentLength: number;
      offset: number;
      timeStamp: number;
      visibleLength: number;
    }) => {
      const previous = scrollMetrics.current;
      const dOffset = metrics.offset - previous.offset;
      const dt = previous.timestamp
        ? Math.max(1, metrics.timeStamp - previous.timestamp)
        : 1;
      scrollMetrics.current = {
        contentLength: metrics.contentLength,
        offset: metrics.offset,
        timestamp: metrics.timeStamp,
        velocity: dOffset / dt,
        visibleLength: metrics.visibleLength,
      };
      maybeCallOnEndReached();
      scheduleUpdate();
    },
    [maybeCallOnEndReached, scheduleUpdate],
  );

  const onLayout = useCallback(
    (width: number, height: number) => {
      scrollMetrics.current.visibleLength = latest.current.horizontal
        ? width
        : height;
      scheduleUpdate();
      maybeCallOnEndReached();
    },
    [maybeCallOnEndReached, scheduleUpdate],
  );

  const onContentSizeChange = useCallback(
    (width: number, height: number) => {
      scrollMetrics.current.contentLength = latest.current.horizontal
        ? width
        : height;
      scheduleUpdate();
      maybeCallOnEndReached();
    },
    [maybeCallOnEndReached, scheduleUpdate],
  );

  const onCellLayout = useCallback(
    (key: string, index: number, frame: FrameMetrics) => {
      const current = frames.current.get(key);
      if (
        current != null &&
        current.offset === frame.offset &&
        current.length === frame.length &&
        current.index === index
      ) {
        return;
      }
      totals.current.length += frame.length - (current ? current.length : 0);
      totals.current.measured += current ? 0 : 1;
      averageCellLength.current =
        totals.current.length / totals.current.measured;
      frames.current.set(key, { ...frame, index });
      highestMeasuredFrameIndex.current = Math.max(
        highestMeasuredFrameIndex.current,
        index,
      );
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const readAverageCellLength = useCallback(
    () => averageCellLength.current,
    [],
  );
  const readHighestMeasuredFrameIndex = useCallback(
    () => highestMeasuredFrameIndex.current,
    [],
  );
  const readScrollMetrics = useCallback(() => scrollMetrics.current, []);

  return {
    averageCellLength: readAverageCellLength,
    getFrameMetricsApprox,
    highestMeasuredFrameIndex: readHighestMeasuredFrameIndex,
    onCellLayout,
    onContentSizeChange,
    onLayout,
    onScroll,
    scrollMetrics: readScrollMetrics,
    window: effectiveWindow,
  };
}
