/**
 * Keeps a focused tab of a scrolling tab row fully inside the row, with room
 * for its focus glow.
 *
 * A browser scrolls a focused element into view only when the element is
 * wholly out of view, so a partly visible tab would stay cut, and its own
 * scroll stops at the edge of the tab, which clips the glow. The row therefore
 * scrolls itself when a tab takes focus, through the `ScrollView` API, so the
 * same rule holds on native.
 */
import { useCallback, useRef } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "../primitives/reactNative";

/** Where a tab sits in the content of the row. */
type TabSpan = { width: number; x: number };

/**
 * The handlers of a scrolling tab row. `room` is the space to keep visible
 * beside a focused tab: the width of the focus glow.
 */
export function useRevealFocusedTab(room: number) {
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const viewport = useRef(0);
  const tabs = useRef(new Map<string, TabSpan>());

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.x;
    },
    [],
  );
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    viewport.current = event.nativeEvent.layout.width;
  }, []);
  const onTabLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    tabs.current.set(key, { width, x });
  }, []);
  const reveal = useCallback(
    (key: string) => {
      const tab = tabs.current.get(key);
      const scroller = scrollRef.current;
      if (tab == null || scroller == null) {
        return;
      }
      const start = tab.x - room;
      const end = tab.x + tab.width + room;
      let next: number | null = null;
      if (start < offset.current) {
        next = start;
      } else if (end > offset.current + viewport.current) {
        next = end - viewport.current;
      }
      if (next != null) {
        scroller.scrollTo({ animated: false, x: next });
        offset.current = next;
      }
    },
    [room],
  );
  return { onLayout, onScroll, onTabLayout, reveal, scrollRef };
}
