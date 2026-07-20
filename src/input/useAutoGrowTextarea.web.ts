/**
 * Web auto-grow measurement for the multiline {@link InputFrame}.
 *
 * RNW renders a multiline `TextInput` as a `<textarea>` and reports
 * `onContentSizeChange` from the node's raw `scrollHeight` — but `scrollHeight`
 * is pinned to `clientHeight` once the box has an explicit height, so it never
 * reports a *smaller* size and the field would grow but never shrink. So on web
 * we ignore that event and measure the DOM node ourselves: collapse it to its
 * natural size (`height`/`min-height` to `auto`/`0`), read the natural content
 * `scrollHeight`, then store it. The stored height is clamped into the row bounds
 * *at render*, so a runtime `maxLines` / `numberOfLines` change re-derives the
 * applied height immediately. Measuring re-runs when the controlled `value`
 * changes and — via a `ResizeObserver` — when the field's width changes and the
 * text re-wraps (device rotation, responsive layout). Auto-grow therefore needs a
 * controlled `value` on web.
 *
 * The `<textarea>` is `box-sizing: border-box` with zero padding/border (see
 * RNW's TextInput styles), so `scrollHeight` equals `rows × lineHeight` exactly,
 * and the browser shows the scrollbar itself once the height is capped — the hook
 * only ever manages height.
 */
import { type RefObject, useLayoutEffect, useState } from "react";

import type {
  AutoGrowTextarea,
  AutoGrowTextareaOptions,
} from "./useAutoGrowTextarea";

/** The bits of the underlying DOM `<textarea>` the measure step touches. */
type MeasurableTextArea = {
  scrollHeight: number;
  style: { height: string; minHeight: string };
};

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

/** Web build: measure the DOM node's natural content height, clamped at render. */
export function useAutoGrowTextarea({
  enabled,
  minHeight,
  maxHeight,
  lineHeight,
  value,
  nodeRef,
}: AutoGrowTextareaOptions): AutoGrowTextarea {
  // The raw natural content height (unclamped); clamped into the bounds below at
  // render so a bounds change re-derives without needing a fresh measurement.
  const [contentHeight, setContentHeight] = useState(minHeight);
  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const node = (nodeRef as RefObject<MeasurableTextArea | null>).current;
    if (!node || typeof node.scrollHeight !== "number") {
      return;
    }
    const measure = () => {
      // Collapse height AND min-height so `scrollHeight` reports the pure text
      // height, not the applied box (which the min-height floor would otherwise
      // pin it to); restore both straight away so React's next render — driven by
      // the clamped state below — is the single writer of the visible height.
      const appliedHeight = node.style.height;
      const appliedMinHeight = node.style.minHeight;
      node.style.height = "auto";
      node.style.minHeight = "0px";
      const content = node.scrollHeight;
      node.style.height = appliedHeight;
      node.style.minHeight = appliedMinHeight;
      setContentHeight(content);
    };
    measure();
    // Re-measure when the field's WIDTH changes (text re-wraps). Ignore
    // height-only notifications — our own `measure()` toggles the height, which
    // would otherwise feed back into the observer.
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    let lastWidth: number | undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === lastWidth) {
        return;
      }
      lastWidth = width;
      measure();
    });
    observer.observe(node as unknown as Element);
    return () => observer.disconnect();
  }, [enabled, value, nodeRef]);
  if (!enabled) {
    return { style: null };
  }
  const height = clamp(contentHeight, minHeight, maxHeight);
  // An uncapped (`Infinity`) max grows to fit all content: omit `maxHeight` so
  // the field never scrolls (and RNW never renders an invalid `Infinitypx`).
  return {
    style: Number.isFinite(maxHeight)
      ? { lineHeight, minHeight, maxHeight, height }
      : { lineHeight, minHeight, height },
  };
}
