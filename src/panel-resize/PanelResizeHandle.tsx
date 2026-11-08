/**
 * Native build of {@link PanelResizeHandle}. A touch drag on the handle
 * follows the finger through the responder system until release, and a parent
 * scroll view cannot take the gesture over. Assistive technology sees an
 * adjustable control with its name and width; its increment and decrement
 * actions change the width by one step and report the end at once.
 *
 * The 9px handle reaches 12px further on each side for the finger, through
 * its hit slop, while it keeps its drawn width.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, View } from "../primitives/reactNative";
import type { ViewProps } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";

import {
  PANEL_RESIZE_STEP,
  panelActionWidth,
  panelDragWidth,
  panelResizeRange,
} from "./panelResizeModel";
import type { PanelResizeHandleProps } from "./panelResizeModel";
import { createPanelResizeStyles } from "./panelResizeStyles";

const HANDLE_HIT_SLOP = { bottom: 0, left: 12, right: 12, top: 0 };

const ADJUSTABLE_ACTIONS = [{ name: "increment" }, { name: "decrement" }];

type DragSession = { last: number; startWidth: number };

export function PanelResizeHandle({
  accessibilityLabel,
  disabled = false,
  edge,
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
  const [dragging, setDragging] = useState(false);
  const optionsRef = useRef({
    disabled,
    edge,
    max,
    min,
    onChange,
    onChangeEnd,
    value,
  });
  optionsRef.current = {
    disabled,
    edge,
    max,
    min,
    onChange,
    onChangeEnd,
    value,
  };
  const sessionRef = useRef<DragSession | null>(null);

  const endDrag = useCallback((report: boolean) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) {
      return;
    }
    setDragging(false);
    if (report && session.last !== session.startWidth) {
      optionsRef.current.onChangeEnd?.(session.last);
    }
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => !optionsRef.current.disabled,
        onPanResponderGrant: () => {
          const width = optionsRef.current.value;
          sessionRef.current = { last: width, startWidth: width };
          setDragging(true);
        },
        onPanResponderMove: (_event, gesture) => {
          const session = sessionRef.current;
          if (!session) {
            return;
          }
          const current = optionsRef.current;
          const next = panelDragWidth(
            session.startWidth,
            gesture.dx,
            current.edge,
            current.min,
            current.max,
          );
          if (next !== session.last) {
            session.last = next;
            current.onChange(next);
          }
        },
        onPanResponderRelease: () => endDrag(true),
        onPanResponderTerminate: () => endDrag(true),
        // A parent scroll view cannot take an active drag, unless the handle
        // was turned off during it.
        onPanResponderTerminationRequest: () => optionsRef.current.disabled,
        onStartShouldSetPanResponder: () => !optionsRef.current.disabled,
      }),
    [endDrag],
  );

  useEffect(() => {
    if (disabled) {
      endDrag(true);
    }
  }, [disabled, endDrag]);

  // An unmount drops the drag without callbacks.
  useEffect(
    () => () => {
      sessionRef.current = null;
    },
    [],
  );

  const onAccessibilityAction: ViewProps["onAccessibilityAction"] = (event) => {
    const action = event.nativeEvent.actionName;
    if (disabled || (action !== "increment" && action !== "decrement")) {
      return;
    }
    const next = panelActionWidth(action, value, { max, min, step });
    if (next !== value) {
      onChange(next);
      onChangeEnd?.(next);
    }
  };

  return (
    <View
      {...responder.panHandlers}
      accessibilityActions={disabled ? [] : ADJUSTABLE_ACTIONS}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={panelResizeRange(value, min, max)}
      accessible
      hitSlop={HANDLE_HIT_SLOP}
      onAccessibilityAction={onAccessibilityAction}
      style={[
        styles.handle,
        edge === "end" ? styles.handleEnd : styles.handleStart,
        style,
      ]}
      testID={testID}
    >
      <View
        style={[styles.line, dragging ? styles.lineShown : null, lineStyle]}
      />
      <View
        style={[styles.grip, dragging ? styles.gripShown : null, gripStyle]}
      />
    </View>
  );
}
