/**
 * `FlatList`, as a windowed `ScrollView`.
 *
 * The windowing subset of React Native's `VirtualizedList` that this library
 * needs, transcribed from the copy `react-native-web` 0.21.2 vendors: a spacer
 * sized to everything above the window, the rendered cells (each in a wrapper
 * `View` like `CellRenderer`'s, with `ItemSeparatorComponent` between them), a
 * spacer for everything below, and the header / footer / empty slots around
 * them.
 *
 * `useFlatListWindow.ts` owns the arithmetic and the batching; this file is the
 * render and the imperative methods, which are assigned onto the scroll node so
 * a `ref` answers `scrollToIndex` as well as `getScrollableNode`.
 *
 * The one deliberate simplification is the render mask: that backend keeps the
 * first `initialNumToRender` cells mounted as a scroll-to-top optimisation and
 * renders up to three regions with spacers between them, while this renders one
 * contiguous window. At rest the two agree cell for cell, which is what the
 * DataGrid's recorded baselines pin.
 */
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ForwardedRef,
  type ReactNode,
} from "react";

import type {
  FlatListComponent,
  FlatListInstance,
  FlatListProps,
  ScrollViewProps,
  ViewProps,
} from "../types";

import {
  HORIZONTAL_CELL,
  NO_SEPARATORS,
  renderSlot,
  spacer,
  spacerLength,
} from "./flatListParts";
import {
  defaultKeyExtractor,
  DEFAULT_INITIAL_NUM_TO_RENDER,
  DEFAULT_SCROLL_EVENT_THROTTLE,
} from "./flatListWindow";
import { ScrollView } from "./ScrollView";
import { useFlatListWindow } from "./useFlatListWindow";
import { View } from "./View";

type ListElement = HTMLElement & Record<string, unknown>;

function FlatListImpl<ItemT>(
  props: FlatListProps<ItemT>,
  forwardedRef: ForwardedRef<FlatListInstance<ItemT>>,
) {
  const {
    ItemSeparatorComponent,
    ListEmptyComponent,
    ListFooterComponent,
    ListHeaderComponent,
    data,
    // Only exists to force a re-render, which a changed prop already does.
    extraData: _extraData,
    getItemLayout,
    horizontal,
    initialNumToRender = DEFAULT_INITIAL_NUM_TO_RENDER,
    keyExtractor,
    onContentSizeChange,
    onEndReached,
    onEndReachedThreshold,
    onLayout,
    onScroll,
    onScrollToIndexFailed,
    renderItem,
    scrollEventThrottle = DEFAULT_SCROLL_EVENT_THROTTLE,
    ...rest
  } = props;
  const initialScrollIndex = (props as { initialScrollIndex?: number })
    .initialScrollIndex;

  const items = data ?? [];
  const itemCount = items.length;
  const isHorizontal = horizontal === true;
  const scrollRef = useRef<ListElement | null>(null);
  const hasScrolledToInitialIndex = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const getFrameFromLayout = useMemo(
    () =>
      getItemLayout == null
        ? undefined
        : (index: number) => getItemLayout(itemsRef.current, index),
    [getItemLayout],
  );

  const {
    averageCellLength,
    getFrameMetricsApprox,
    highestMeasuredFrameIndex,
    onCellLayout,
    onContentSizeChange: listContentSizeChange,
    onLayout: listLayout,
    onScroll: listScroll,
    scrollMetrics,
    window: renderWindow,
  } = useFlatListWindow({
    getFrameFromLayout,
    horizontal: isHorizontal,
    initialNumToRender,
    initialScrollIndex,
    itemCount,
    onEndReached,
    onEndReachedThreshold,
  });

  const scrollToOffset = useCallback(
    (options: { offset: number; animated?: boolean }) => {
      const scrollTo = scrollRef.current?.scrollTo as
        | ((args: { x?: number; y?: number; animated?: boolean }) => void)
        | undefined;
      scrollTo?.(
        isHorizontal
          ? { animated: options.animated, x: options.offset }
          : { animated: options.animated, y: options.offset },
      );
    },
    [isHorizontal],
  );

  const scrollToIndex = useCallback(
    (options: {
      index: number;
      animated?: boolean;
      viewOffset?: number;
      viewPosition?: number;
    }) => {
      const { animated, index, viewOffset, viewPosition } = options;
      if (getFrameFromLayout == null && index > highestMeasuredFrameIndex()) {
        onScrollToIndexFailed?.({
          averageItemLength: averageCellLength(),
          highestMeasuredFrameIndex: highestMeasuredFrameIndex(),
          index,
        });
        return;
      }
      const frame = getFrameMetricsApprox(Math.floor(index));
      const { visibleLength } = scrollMetrics();
      const offset =
        Math.max(
          0,
          frame.offset - (viewPosition ?? 0) * (visibleLength - frame.length),
        ) - (viewOffset ?? 0);
      scrollToOffset({ animated, offset });
    },
    [
      averageCellLength,
      getFrameFromLayout,
      getFrameMetricsApprox,
      highestMeasuredFrameIndex,
      onScrollToIndexFailed,
      scrollMetrics,
      scrollToOffset,
    ],
  );

  const setScrollRef = useCallback(
    (node: unknown) => {
      const element = node as ListElement | null;
      scrollRef.current = element;
      if (element != null) {
        element.scrollToIndex = scrollToIndex;
        element.scrollToOffset = scrollToOffset;
      }
      if (typeof forwardedRef === "function") {
        forwardedRef(element as unknown as FlatListInstance<ItemT>);
      } else if (forwardedRef != null) {
        forwardedRef.current = element as unknown as FlatListInstance<ItemT>;
      }
    },
    [forwardedRef, scrollToIndex, scrollToOffset],
  );

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { x: number; y: number };
        contentSize: { width: number; height: number };
        layoutMeasurement: { width: number; height: number };
      };
      timeStamp: number;
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      onScroll?.(event as never);
      listScroll({
        contentLength: isHorizontal ? contentSize.width : contentSize.height,
        offset: isHorizontal ? contentOffset.x : contentOffset.y,
        timeStamp: event.timeStamp,
        visibleLength: isHorizontal
          ? layoutMeasurement.width
          : layoutMeasurement.height,
      });
    },
    [isHorizontal, listScroll, onScroll],
  );

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { height, width } = event.nativeEvent.layout;
      onLayout?.(event as never);
      listLayout(width, height);
    },
    [listLayout, onLayout],
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      if (
        width > 0 &&
        height > 0 &&
        initialScrollIndex != null &&
        initialScrollIndex > 0 &&
        !hasScrolledToInitialIndex.current
      ) {
        hasScrolledToInitialIndex.current = true;
        scrollToIndex({ animated: false, index: initialScrollIndex });
      }
      onContentSizeChange?.(width, height);
      listContentSizeChange(width, height);
    },
    [
      initialScrollIndex,
      listContentSizeChange,
      onContentSizeChange,
      scrollToIndex,
    ],
  );

  const extractKey = keyExtractor ?? defaultKeyExtractor;
  const { first, last } = renderWindow;
  const cells: ReactNode[] = [];

  if (itemCount > 0) {
    if (first > 0) {
      cells.push(
        spacer(
          "head",
          isHorizontal,
          spacerLength(getFrameMetricsApprox, 0, first - 1),
        ),
      );
    }
    for (let index = first; index <= last; index++) {
      const item = items[index];
      const key = extractKey(item, index);
      const cellProps = {
        children: (
          <>
            {renderItem?.({ index, item, separators: NO_SEPARATORS }) ?? null}
            {index < itemCount - 1 && ItemSeparatorComponent != null ? (
              <ItemSeparatorComponent />
            ) : null}
          </>
        ),
        // Only an unmeasured list listens; a `getItemLayout` already knows.
        onLayout:
          getFrameFromLayout == null
            ? (event: {
                nativeEvent: {
                  layout: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                  };
                };
              }) => {
                const { layout } = event.nativeEvent;
                onCellLayout(key, index, {
                  length: isHorizontal ? layout.width : layout.height,
                  offset: isHorizontal ? layout.x : layout.y,
                });
              }
            : undefined,
        style: isHorizontal ? HORIZONTAL_CELL : undefined,
      } as unknown as ViewProps;
      cells.push(<View key={key} {...cellProps} />);
    }
    if (last < itemCount - 1) {
      cells.push(
        spacer(
          "tail",
          isHorizontal,
          spacerLength(getFrameMetricsApprox, last + 1, itemCount - 1),
        ),
      );
    }
  }

  const scrollProps = {
    ...(rest as ScrollViewProps),
    children: (
      <>
        {renderSlot(ListHeaderComponent)}
        {itemCount === 0 ? renderSlot(ListEmptyComponent) : cells}
        {renderSlot(ListFooterComponent)}
      </>
    ),
    horizontal,
    onContentSizeChange: handleContentSizeChange,
    onLayout: handleLayout,
    onScroll: handleScroll,
    ref: setScrollRef,
    scrollEventThrottle,
  } as unknown as ScrollViewProps;

  return <ScrollView {...scrollProps} />;
}

export const FlatList: FlatListComponent = forwardRef(
  FlatListImpl,
) as unknown as FlatListComponent;
FlatList.displayName = "FlatList";
