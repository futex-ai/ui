/**
 * The scrolling primitives: `ScrollView` and `FlatList`.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Components/ScrollView/ScrollView.d.ts` and
 * `Libraries/Lists/FlatList.d.ts`), trimmed to the props this library passes
 * plus the ones it deliberately passes and lets the backend ignore
 * (`decelerationRate`, `keyboardShouldPersistTaps`, `nestedScrollEnabled`,
 * `snapToInterval`), so the web build's declarations never reference the
 * `react-native` package.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type {
  ComponentType,
  ForwardRefExoticComponent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";

import type { ViewProps } from "./components";
import type { NativeSyntheticEvent } from "./events";
import type { HostInstance } from "./hostInstance";
import type { StyleProp, ViewStyle } from "./style";

/** An edge-inset rectangle reported by a scroll event. */
export interface NativeScrollRectangle {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

/** A point reported by a scroll event. */
export interface NativeScrollPoint {
  x: number;
  y: number;
}

/** A velocity reported by a scroll event. */
export interface NativeScrollVelocity {
  x: number;
  y: number;
}

/** A size reported by a scroll event. */
export interface NativeScrollSize {
  height: number;
  width: number;
}

/** Payload of every `ScrollView` scroll callback. */
export interface NativeScrollEvent {
  contentInset: NativeScrollRectangle;
  contentOffset: NativeScrollPoint;
  contentSize: NativeScrollSize;
  layoutMeasurement: NativeScrollSize;
  velocity?: NativeScrollVelocity | undefined;
  zoomScale: number;
  targetContentOffset?: NativeScrollPoint | undefined;
}

/** A scroll callback. */
export type ScrollEventHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void;

/**
 * Props of a `ScrollView`.
 *
 * @see https://reactnative.dev/docs/scrollview#props
 */
export interface ScrollViewProps extends ViewProps {
  /** Style applied to the wrapper around the scrolled content. */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;
  /** How quickly scrolling decelerates after a fling; ignored on web. */
  decelerationRate?: "fast" | "normal" | number | undefined;
  /** Lays children out in a row instead of a column. */
  horizontal?: boolean | null | undefined;
  /** Whether a drag dismisses the keyboard; ignored on web. */
  keyboardDismissMode?: "none" | "interactive" | "on-drag" | undefined;
  /** Whether a tap keeps the keyboard up; ignored on web. */
  keyboardShouldPersistTaps?:
    | boolean
    | "always"
    | "never"
    | "handled"
    | undefined;
  /** Whether nested scrolling is enabled (Android); ignored on web. */
  nestedScrollEnabled?: boolean | undefined;
  /** Fired with the content's width and height when they change. */
  onContentSizeChange?:
    | ((contentWidth: number, contentHeight: number) => void)
    | undefined;
  /** Fired at most once per frame while scrolling. */
  onScroll?: ScrollEventHandler | undefined;
  onScrollBeginDrag?: ScrollEventHandler | undefined;
  onScrollEndDrag?: ScrollEventHandler | undefined;
  onMomentumScrollBegin?: ScrollEventHandler | undefined;
  /** Fired once the scroll comes to rest. */
  onMomentumScrollEnd?: ScrollEventHandler | undefined;
  /** Snaps to multiples of the view's size. */
  pagingEnabled?: boolean | undefined;
  /** Milliseconds between `onScroll` callbacks (iOS); ignored on web. */
  scrollEventThrottle?: number | undefined;
  /** Whether the content scrolls at all. */
  scrollEnabled?: boolean | undefined;
  showsHorizontalScrollIndicator?: boolean | undefined;
  showsVerticalScrollIndicator?: boolean | undefined;
  /** Snaps to multiples of this offset; ignored on web. */
  snapToInterval?: number | undefined;
  /** Snaps to these offsets; ignored on web. */
  snapToOffsets?: number[] | undefined;
  /** Indices of children that stick to the top while scrolling. */
  stickyHeaderIndices?: number[] | undefined;
}

/** Argument of {@link ScrollViewInstance.scrollTo}. */
export interface ScrollToOptions {
  x?: number | undefined;
  y?: number | undefined;
  animated?: boolean | undefined;
}

/** A mounted `ScrollView`. */
export interface ScrollViewInstance extends HostInstance {
  /** Scrolls to an offset, optionally animating. */
  scrollTo(options?: ScrollToOptions): void;
  /** Scrolls to the end of the content. */
  scrollToEnd(options?: { animated?: boolean | undefined }): void;
  /** The underlying scrollable node. */
  getScrollableNode(): unknown;
}

/** The `ScrollView` component. */
export type ScrollViewComponent = ForwardRefExoticComponent<
  ScrollViewProps & RefAttributes<ScrollViewInstance>
>;

/** What a `FlatList` hands its `renderItem` callback. */
export interface ListRenderItemInfo<ItemT> {
  item: ItemT;
  index: number;
  separators: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: "leading" | "trailing", newProps: object) => void;
  };
}

/** Renders one row of a `FlatList`. */
export type ListRenderItem<ItemT> = (
  info: ListRenderItemInfo<ItemT>,
) => ReactElement | null;

/** The fixed geometry of a row, which turns on windowed rendering. */
export interface ItemLayout {
  length: number;
  offset: number;
  index: number;
}

/**
 * Props of a `FlatList`.
 *
 * @see https://reactnative.dev/docs/flatlist#props
 */
export interface FlatListProps<ItemT> extends ScrollViewProps {
  /** The rows to render. */
  data?: ReadonlyArray<ItemT> | null | undefined;
  /** Renders one row. */
  renderItem?: ListRenderItem<ItemT> | null | undefined;
  /** Stable key for a row. */
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;
  /** Fixed row geometry; enables windowing and `scrollToIndex`. */
  getItemLayout?:
    | ((data: ArrayLike<ItemT> | null | undefined, index: number) => ItemLayout)
    | undefined;
  /** Re-renders rows when this value changes. */
  extraData?: unknown;
  /** Rendered after the last row. */
  ListFooterComponent?:
    | ComponentType<unknown>
    | ReactElement
    | null
    | undefined;
  /** Rendered before the first row. */
  ListHeaderComponent?:
    | ComponentType<unknown>
    | ReactElement
    | null
    | undefined;
  /** Rendered when `data` is empty. */
  ListEmptyComponent?: ComponentType<unknown> | ReactElement | null | undefined;
  /** Rendered between rows. */
  ItemSeparatorComponent?: ComponentType<unknown> | null | undefined;
  /** Rows rendered in the first batch. */
  initialNumToRender?: number | undefined;
  /** Fired when the end of the content comes within `onEndReachedThreshold`. */
  onEndReached?: ((info: { distanceFromEnd: number }) => void) | undefined;
  /** Distance from the end, in list lengths, that triggers `onEndReached`. */
  onEndReachedThreshold?: number | null | undefined;
  /** Fired when `scrollToIndex` cannot reach an unmeasured index. */
  onScrollToIndexFailed?:
    | ((info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
      }) => void)
    | undefined;
}

/** Argument of {@link FlatListInstance.scrollToIndex}. */
export interface ScrollToIndexOptions {
  index: number;
  animated?: boolean | undefined;
  viewOffset?: number | undefined;
  viewPosition?: number | undefined;
}

/** A mounted `FlatList`. */
export interface FlatListInstance<ItemT = unknown> extends ScrollViewInstance {
  /** Scrolls the row at `index` into view. */
  scrollToIndex(options: ScrollToIndexOptions): void;
  /** Scrolls to a content offset. */
  scrollToOffset(options: {
    offset: number;
    animated?: boolean | undefined;
  }): void;
  /** Phantom marker keeping the item type observable. */
  readonly __itemType?: ItemT;
}

/**
 * The `FlatList` component. A call signature rather than an alias so `ItemT`
 * is inferred from `data` at each use site, the way a generic class would.
 */
export interface FlatListComponent {
  <ItemT>(
    props: FlatListProps<ItemT> & RefAttributes<FlatListInstance<ItemT>>,
  ): ReactNode;
  displayName?: string | undefined;
}
