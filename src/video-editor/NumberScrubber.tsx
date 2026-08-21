/**
 * A numeric property field you can either type into or drag to change — the
 * scrubbable value an editor's inspector is built from.
 *
 * The text field is the control: it holds the value, carries the accessible
 * name, and is fully operable by keyboard. Dragging is a *pointer enhancement*
 * layered over it, claimed only once the pointer has actually travelled, so a
 * tap still lands in the field and a keyboard user loses nothing (WCAG 2.1 —
 * 2.1.1 Keyboard, A).
 */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  type GestureResponderEvent,
  type StyleProp,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createInspectorStyles } from "./inspectorStyles";
import { clampToRange, formatPropertyValue } from "./inspectorModel";
import { videoEditorSizing } from "./videoEditorSizing";

/** Points the pointer must travel before a press becomes a scrub. */
const SCRUB_THRESHOLD = 3;

export type NumberScrubberProps = {
  value: number;
  /** Accessible name — the property this field edits. */
  label: string;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** Quantum the value snaps to. Default `0.01`. */
  step?: number;
  /** Units changed per point of pointer travel. Default `step * 10`. */
  sensitivity?: number;
  /** Decimals shown. Default inferred from `step`. */
  precision?: number;
  /** Trailing unit, e.g. `"%"` or `"dB"`. */
  unit?: string;
  disabled?: boolean;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function NumberScrubber({
  disableFocusRing = false,
  disabled = false,
  label,
  max,
  min,
  onValueChange,
  precision,
  sensitivity,
  size = "md",
  step = 0.01,
  style,
  testID,
  unit,
  value,
}: NumberScrubberProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInspectorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });
  // While the field has focus it shows exactly what was typed, so a partial
  // entry like "1." is not rewritten mid-keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const scrub = useRef<{ startX: number; startValue: number } | null>(null);

  const commit = useCallback(
    (next: number) => {
      if (!Number.isFinite(next)) {
        return;
      }
      onValueChange?.(clampToRange(next, { max, min, step }));
    },
    [max, min, onValueChange, step],
  );

  const shown = draft ?? formatPropertyValue(value, { precision, step, unit });

  const onGrant = useCallback(
    (event: GestureResponderEvent) => {
      scrub.current = {
        startValue: value,
        startX: event.nativeEvent.pageX,
      };
    },
    [value],
  );

  const onMove = useCallback(
    (event: GestureResponderEvent) => {
      const session = scrub.current;
      if (!session) {
        return;
      }
      const travelled = event.nativeEvent.pageX - session.startX;
      commit(session.startValue + travelled * (sensitivity ?? step * 10));
    },
    [commit, sensitivity, step],
  );

  return (
    <View
      onMoveShouldSetResponder={(event: GestureResponderEvent) => {
        if (disabled || !onValueChange) {
          return false;
        }
        const session = scrub.current;
        return session
          ? Math.abs(event.nativeEvent.pageX - session.startX) > SCRUB_THRESHOLD
          : false;
      }}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={() => {
        scrub.current = null;
      }}
      onStartShouldSetResponder={() => {
        // Record the origin without claiming the gesture, so a plain tap still
        // reaches the text field underneath.
        return false;
      }}
      onTouchStart={onGrant}
      style={[
        styles.field,
        {
          height: metrics.rowHeight,
          opacity: disabled ? 0.5 : 1,
        },
        focus.webOutlineReset,
        focus.focused && focus.ringEnabled ? styles.fieldFocused : null,
        style,
      ]}
      testID={testID}
    >
      <TextInput
        accessibilityLabel={label}
        editable={!disabled && Boolean(onValueChange)}
        inputMode="decimal"
        onBlur={() => {
          focus.onBlur();
          if (draft !== null) {
            commit(Number.parseFloat(draft));
            setDraft(null);
          }
        }}
        onChangeText={setDraft}
        onFocus={focus.onFocus}
        onSubmitEditing={() => {
          if (draft !== null) {
            commit(Number.parseFloat(draft));
            setDraft(null);
          }
        }}
        style={[
          styles.fieldInput,
          {
            color: theme.colors.ink,
            fontFamily: theme.fonts.mono,
            fontSize: metrics.fontSize,
          },
        ]}
        value={shown}
      />
      {unit ? (
        <Text
          aria-hidden
          style={[styles.fieldUnit, { fontSize: metrics.fontSize - 1 }]}
        >
          {unit}
        </Text>
      ) : null}
    </View>
  );
}
