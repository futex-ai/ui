/**
 * Native auto-grow measurement for the multiline {@link InputFrame}.
 *
 * On native, a multiline `TextInput` reports its rendered content height through
 * `onContentSizeChange`, which shrinks as well as grows. The hook stores that raw
 * content height and clamps it between the min/max row heights *at render*, so a
 * later change to the row bounds (a runtime `maxLines` / `numberOfLines` toggle)
 * re-derives the applied height immediately rather than waiting for the next
 * content edit. The web build (`useAutoGrowTextarea.web.ts`) can't rely on that
 * event (RNW's `scrollHeight` reading never shrinks once the box has grown) and
 * measures the DOM node directly instead; both files expose the same shape,
 * declared in `autoGrowTextareaTypes.ts`.
 */
import { useCallback, useState } from "react";
import type {
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from "../primitives/reactNative";

import type {
  AutoGrowTextarea,
  AutoGrowTextareaOptions,
} from "./autoGrowTextareaTypes";

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

/** Native build: store the raw content height from `onContentSizeChange`. */
export function useAutoGrowTextarea({
  enabled,
  minHeight,
  maxHeight,
  lineHeight,
}: AutoGrowTextareaOptions): AutoGrowTextarea {
  // The raw measured content height (unclamped); clamped into the bounds below at
  // render so a bounds change re-derives without waiting for a new measurement.
  const [contentHeight, setContentHeight] = useState(minHeight);
  const onContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      setContentHeight(event.nativeEvent.contentSize.height);
    },
    [],
  );
  if (!enabled) {
    return { style: null };
  }
  const height = clamp(contentHeight, minHeight, maxHeight);
  // An uncapped (`Infinity`) max grows to fit all content: omit `maxHeight` so
  // the field never scrolls (and never emits an invalid `Infinity` height).
  return {
    style: Number.isFinite(maxHeight)
      ? { lineHeight, minHeight, maxHeight, height }
      : { lineHeight, minHeight, height },
    onContentSizeChange,
  };
}
