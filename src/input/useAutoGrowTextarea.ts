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
 * measures the DOM node directly instead; both files expose this same shape.
 */
import { type RefObject, useCallback, useState } from "react";
import type {
  NativeSyntheticEvent,
  TextInput,
  TextInputContentSizeChangeEventData,
  TextStyle,
} from "react-native";

/** Options for {@link useAutoGrowTextarea}, shared by the web and native builds. */
export type AutoGrowTextareaOptions = {
  /** Whether auto-grow is active (multiline + a `maxLines` cap above the min). */
  enabled: boolean;
  /** Lowest height, in px — the `numberOfLines` (min rows) floor. */
  minHeight: number;
  /** Highest height, in px — the `maxLines` cap, after which the field scrolls. */
  maxHeight: number;
  /** Resolved per-line height, applied so the row math matches what is rendered. */
  lineHeight: number;
  /** The controlled text; on web it re-triggers a measure as the caller types. */
  value?: string;
  /** The underlying `TextInput` node — measured directly on web, unused natively. */
  nodeRef: RefObject<TextInput | null>;
};

/** What {@link useAutoGrowTextarea} returns: a height style and (native) handler. */
export type AutoGrowTextarea = {
  /** Extra `TextInput` style with the resolved line height + height bounds, or null. */
  style: TextStyle | null;
  /** Native content-size handler; `undefined` on web and when disabled. */
  onContentSizeChange?: (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => void;
};

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
  return {
    style: { lineHeight, minHeight, maxHeight, height },
    onContentSizeChange,
  };
}
