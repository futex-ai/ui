/**
 * Which rows a windowed list renders, given where it is scrolled to.
 *
 * Transcribed from React Native's `VirtualizedList/VirtualizeUtils.js` as
 * `react-native-web` 0.21.2 vendors it: the binary search that maps offsets to
 * indices, and `computeWindowedRenderLimits`, which starts from the visible
 * range and grows outwards towards the overscan window a batch at a time.
 *
 * The `zoomScale` factor is dropped — a DOM scroller never reports one — and
 * so is the render-mask machinery that keeps the first `initialNumToRender`
 * cells mounted while scrolled away; this backend renders one contiguous
 * window with a spacer on each side. At rest both models render the same cells,
 * which is what the recorded DataGrid baselines pin.
 *
 * Pure; `tests/unit/domFlatListWindow.test.ts` pins it.
 */

/** A row's measured or declared geometry. */
export type FrameMetrics = { length: number; offset: number };

/** The half-open range of rows to render, inclusive at both ends. */
export type WindowRange = { first: number; last: number };

/** What the scroll container currently reports. */
export type WindowScrollMetrics = {
  offset: number;
  velocity: number;
  visibleLength: number;
};

/** Reads a row's geometry, measured or estimated. */
export type GetFrameMetrics = (index: number) => FrameMetrics;

/** Rows rendered before any measurement has happened. */
export const DEFAULT_INITIAL_NUM_TO_RENDER = 10;
/** Rows added per batch while the window grows. */
export const DEFAULT_MAX_TO_RENDER_PER_BATCH = 10;
/** Overscan window, counted in viewports. */
export const DEFAULT_WINDOW_SIZE = 21;
/** How long the batcher waits before growing the window again. */
export const DEFAULT_UPDATE_CELLS_BATCHING_PERIOD_MS = 50;
/** `onScroll` throttle a `VirtualizedList` asks its scroller for. */
export const DEFAULT_SCROLL_EVENT_THROTTLE = 50;
/** Threshold used when `onEndReachedThreshold` is not given, in pixels. */
export const DEFAULT_END_REACHED_THRESHOLD_PX = 2;
/** Distances below this count as zero, so a debounced scroll still fires. */
export const ON_EDGE_REACHED_EPSILON = 0.001;

/**
 * The first row containing each offset.
 *
 * `offsets` must be ascending; the result is index-aligned with it and may have
 * holes where an offset falls beyond the content.
 */
export function elementsThatOverlapOffsets(
  offsets: readonly number[],
  itemCount: number,
  getFrameMetrics: GetFrameMetrics,
): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
    const currentOffset = offsets[offsetIndex];
    let left = 0;
    let right = itemCount - 1;
    while (left <= right) {
      const mid = left + ((right - left) >>> 1);
      const frame = getFrameMetrics(mid);
      const start = frame.offset;
      const end = frame.offset + frame.length;
      // The first frame's start is inclusive; every later one's is exclusive,
      // so an offset exactly on a boundary belongs to the frame above it.
      if (
        (mid === 0 && currentOffset < start) ||
        (mid !== 0 && currentOffset <= start)
      ) {
        right = mid - 1;
      } else if (currentOffset > end) {
        left = mid + 1;
      } else {
        result[offsetIndex] = mid;
        break;
      }
    }
  }
  return result;
}

/** How many rows `next` renders that `prev` did not. */
export function newRangeCount(prev: WindowRange, next: WindowRange): number {
  return (
    next.last -
    next.first +
    1 -
    Math.max(
      0,
      1 + Math.min(next.last, prev.last) - Math.max(next.first, prev.first),
    )
  );
}

/**
 * The window to render, biased in the direction of travel.
 *
 * Starts at the visible rows and grows outwards towards the overscan window,
 * adding at most `maxToRenderPerBatch` new rows per call so a fast scroll fills
 * the screen before it fills the buffer. Repeated calls converge on the whole
 * overscan window.
 */
export function computeWindowedRenderLimits(
  itemCount: number,
  maxToRenderPerBatch: number,
  windowSize: number,
  prev: WindowRange,
  getFrameMetrics: GetFrameMetrics,
  scrollMetrics: WindowScrollMetrics,
): WindowRange {
  if (itemCount === 0) {
    return { first: 0, last: -1 };
  }
  const { offset, velocity, visibleLength } = scrollMetrics;

  const visibleBegin = Math.max(0, offset);
  const visibleEnd = visibleBegin + visibleLength;
  const overscanLength = (windowSize - 1) * visibleLength;
  // Velocity-proportional lead was measured to churn more than it helps.
  const leadFactor = 0.5;
  const fillPreference =
    velocity > 1 ? "after" : velocity < -1 ? "before" : "none";
  const overscanBegin = Math.max(
    0,
    visibleBegin - (1 - leadFactor) * overscanLength,
  );
  const overscanEnd = Math.max(0, visibleEnd + leadFactor * overscanLength);

  if (getFrameMetrics(itemCount - 1).offset < overscanBegin) {
    // The whole list sits above the window.
    return {
      first: Math.max(0, itemCount - 1 - maxToRenderPerBatch),
      last: itemCount - 1,
    };
  }

  const [rawOverscanFirst, rawFirst, rawLast, rawOverscanLast] =
    elementsThatOverlapOffsets(
      [overscanBegin, visibleBegin, visibleEnd, overscanEnd],
      itemCount,
      getFrameMetrics,
    );
  const overscanFirst = rawOverscanFirst ?? 0;
  let first = rawFirst ?? Math.max(0, overscanFirst);
  const overscanLast = rawOverscanLast ?? itemCount - 1;
  let last = rawLast ?? Math.min(overscanLast, first + maxToRenderPerBatch - 1);

  const visible = { first, last };
  let newCellCount = newRangeCount(prev, visible);

  for (;;) {
    if (first <= overscanFirst && last >= overscanLast) {
      break;
    }
    const maxNewCells = newCellCount >= maxToRenderPerBatch;
    const firstWillAddMore = first <= prev.first || first > prev.last;
    const firstShouldIncrement =
      first > overscanFirst && (!maxNewCells || !firstWillAddMore);
    const lastWillAddMore = last >= prev.last || last < prev.first;
    const lastShouldIncrement =
      last < overscanLast && (!maxNewCells || !lastWillAddMore);

    // Stop only once the batch is full *and* neither edge can grow without
    // mounting something new, so already-rendered rows are preserved.
    if (maxNewCells && !firstShouldIncrement && !lastShouldIncrement) {
      break;
    }
    if (
      firstShouldIncrement &&
      !(fillPreference === "after" && lastShouldIncrement && lastWillAddMore)
    ) {
      if (firstWillAddMore) {
        newCellCount++;
      }
      first--;
    }
    if (
      lastShouldIncrement &&
      !(fillPreference === "before" && firstShouldIncrement && firstWillAddMore)
    ) {
      if (lastWillAddMore) {
        newCellCount++;
      }
      last++;
    }
  }

  return { first, last };
}

/** `value` clipped into `[min, max]`, as React Native's `clamp` defines it. */
function clamp(min: number, value: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

/**
 * Clips a window to a list that has changed length.
 *
 * Appending rows leaves the window where it was — the batcher grows it on the
 * next scroll — while removing them pulls it back inside the data. The `first`
 * expression is `_constrainToItemCount`'s verbatim: the value being clamped is
 * the last index a full batch can start at, and the window's own `first` is the
 * *upper* bound, so shrinking the data pulls the window back by a whole batch
 * rather than by one row.
 */
export function constrainToItemCount(
  cells: WindowRange,
  itemCount: number,
  maxToRenderPerBatch: number,
): WindowRange {
  return {
    first: clamp(0, itemCount - 1 - maxToRenderPerBatch, cells.first),
    last: Math.min(itemCount - 1, cells.last),
  };
}

/** How close to an edge counts as "reached" while scrolling towards it. */
export function getScrollingThreshold(
  threshold: number,
  visibleLength: number,
): number {
  return (threshold * visibleLength) / 2;
}

/** The rows rendered before the list has measured anything. */
export function initialRenderRegion(
  itemCount: number,
  initialNumToRender: number,
  initialScrollIndex: number | undefined,
): WindowRange {
  const first = Math.max(
    0,
    Math.min(itemCount - 1, Math.floor(initialScrollIndex ?? 0)),
  );
  return {
    first,
    last: Math.min(itemCount, first + initialNumToRender) - 1,
  };
}

/** `item.key`, then `item.id`, then the index — React Native's own default. */
export function defaultKeyExtractor(item: unknown, index: number): string {
  if (typeof item === "object" && item != null) {
    const record = item as { key?: unknown; id?: unknown };
    if (record.key != null) {
      return String(record.key);
    }
    if (record.id != null) {
      return String(record.id);
    }
  }
  return String(index);
}

/** What the hook needs to know about the list it is windowing. */
export type FlatListWindowOptions = {
  /** Declared geometry, when the caller gave a `getItemLayout`. */
  getFrameFromLayout: ((index: number) => FrameMetrics) | undefined;
  horizontal: boolean;
  initialNumToRender: number;
  initialScrollIndex: number | undefined;
  itemCount: number;
  onEndReached: ((info: { distanceFromEnd: number }) => void) | undefined;
  onEndReachedThreshold: number | null | undefined;
};

/** What a windowed list's scroller currently reports. */
export type ScrollMetrics = {
  contentLength: number;
  offset: number;
  timestamp: number;
  velocity: number;
  visibleLength: number;
};

/** What `FlatList.tsx` drives and reads. */
export type FlatListWindow = {
  averageCellLength: () => number;
  getFrameMetricsApprox: (index: number) => FrameMetrics;
  highestMeasuredFrameIndex: () => number;
  onCellLayout: (key: string, index: number, frame: FrameMetrics) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onLayout: (width: number, height: number) => void;
  onScroll: (metrics: {
    contentLength: number;
    offset: number;
    timeStamp: number;
    visibleLength: number;
  }) => void;
  scrollMetrics: () => ScrollMetrics;
  window: WindowRange;
};
