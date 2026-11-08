/**
 * Web build of {@link PanelResizeHandle}: a vertical window splitter on the
 * inner edge of a side panel. It is a `separator` in the tab order, with its
 * name, the width as its value, and the bounds as its minimum and maximum.
 *
 * - A pointer drag follows the pointer until release (`usePanelResizeDrag`).
 * - Left and Right move the handle one step in their direction; Home and End
 *   give the minimum and the maximum width. Each key change reports its end.
 * - Under the pointer, during a drag, and with keyboard focus, the line
 *   darkens and the short grip shows. Keyboard focus puts the shared glow on
 *   the grip, the direct child that the CSS focus rule paints.
 */
import { useMemo, useState } from "react";
import { View } from "../primitives/reactNative.web";
import type { ViewStyle } from "../primitives/reactNative.web";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  PANEL_RESIZE_STEP,
  panelKeyWidth,
  panelResizeRange,
} from "./panelResizeModel";
import type { PanelResizeHandleProps } from "./panelResizeModel";
import { createPanelResizeStyles } from "./panelResizeStyles";
import { usePanelResizeDrag } from "./usePanelResizeDrag";

// This web implementation uses the web seam's style types. `touch-action:
// none` keeps a touch drag on the handle from scrolling the page.
const activeHandleStyle: ViewStyle = {
  cursor: "col-resize",
  touchAction: "none",
};

type HandleKeyEvent = {
  key?: string;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export function PanelResizeHandle({
  accessibilityLabel,
  disabled = false,
  edge,
  focusIndicator,
  gripStyle,
  lineStyle,
  max,
  min,
  onChange,
  onChangeEnd,
  step = PANEL_RESIZE_STEP,
  style,
  testID,
  value,
}: PanelResizeHandleProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createPanelResizeStyles(theme), [theme]);
  // The handle holds focus and its grip paints the glow.
  const focus = useFocusRing({ indicator: focusIndicator, target: "parent" });
  const [hovered, setHovered] = useState(false);
  const drag = usePanelResizeDrag({
    disabled,
    edge,
    max,
    min,
    onChange,
    onChangeEnd,
    value,
  });
  const keyboardFocus = focus.focusVisible && focus.indicator !== "none";
  const shown = !disabled && (hovered || drag.dragging || keyboardFocus);
  const range = panelResizeRange(value, min, max);

  const onKeyDown = (event: HandleKeyEvent) => {
    if (disabled) {
      return;
    }
    const next = panelKeyWidth(event.key ?? "", value, {
      edge,
      max,
      min,
      step,
    });
    if (next === null) {
      return;
    }
    // Keep the key from scrolling the page or reaching an ancestor's keys.
    event.preventDefault?.();
    event.stopPropagation?.();
    if (next !== value) {
      onChange(next);
      onChangeEnd?.(next);
    }
  };

  // The separator semantics and the pointer, key, and focus handlers are DOM
  // props that the shared view types omit, so they travel in one web object.
  const webProps: object = {
    "aria-disabled": disabled ? true : undefined,
    "aria-label": accessibilityLabel,
    "aria-orientation": "vertical",
    "aria-valuemax": range.max,
    "aria-valuemin": range.min,
    "aria-valuenow": range.now,
    "aria-valuetext": range.text,
    onBlur: focus.onBlur,
    onFocus: focus.onFocus,
    onKeyDown,
    onPointerDown: drag.onPointerDown,
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    role: "separator",
    tabIndex: disabled ? -1 : 0,
  };

  return (
    <View
      {...webProps}
      {...focus.focusTargetProps}
      style={[
        styles.handle,
        edge === "end" ? styles.handleEnd : styles.handleStart,
        disabled ? null : activeHandleStyle,
        style,
      ]}
      testID={testID}
    >
      <View style={[styles.line, shown ? styles.lineShown : null, lineStyle]} />
      <View
        {...focus.focusRingProps}
        style={[
          styles.grip,
          shown ? styles.gripShown : null,
          focus.focusRingVariables,
          gripStyle,
        ]}
      />
    </View>
  );
}
