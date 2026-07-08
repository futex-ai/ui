/**
 * A compact event chip for the month grid and agenda rows. Two visual variants:
 *  - `bar` — a filled spanning pill (the event `color`) used for all-day /
 *    multi-day month bars;
 *  - `dot` — a colour dot + title used for short timed events in a month cell.
 * Rendered as a labelled `button` firing `onSelect` on press. Kept independently
 * accessible so the parent day cell's own press target never swallows it.
 */
import { useMemo } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createCalendarStyles } from "./calendarStyles";
import { formatTime } from "./calendarMath";
import type { CalendarOccurrence } from "./types";

/** Visual style of a {@link CalendarEventChip}. */
export type CalendarEventChipVariant = "bar" | "dot";

/** Props for {@link CalendarEventChip}. */
export type CalendarEventChipProps = {
  /** The occurrence to render. */
  occurrence: CalendarOccurrence;
  /** `bar` (filled spanning pill) or `dot` (colour dot + title). Default `bar`. */
  variant?: CalendarEventChipVariant;
  /** Called with the occurrence when the chip is pressed. */
  onSelect?: (occurrence: CalendarOccurrence) => void;
  /** Extra style for the chip container. */
  style?: StyleProp<ViewStyle>;
};

/**
 * One month/agenda event chip. The accessible name is `"<title>, all day"` for
 * an all-day occurrence or `"<title>, <start time>"` for a timed one. The chip
 * colour is the event `color` or the theme primary.
 */
export function CalendarEventChip({
  occurrence,
  variant = "bar",
  onSelect,
  style,
}: CalendarEventChipProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);
  const color = occurrence.event.color ?? theme.colors.primary;
  const label = occurrence.allDay
    ? `${occurrence.event.title}, all day`
    : `${occurrence.event.title}, ${formatTime(occurrence.start)}`;

  if (variant === "dot") {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={() => onSelect?.(occurrence)}
        style={({ hovered }: PressableHoverState) => [
          styles.chipDot,
          hovered ? styles.moreButtonHover : null,
          style,
          hideWebOutlineView,
        ]}
        testID={`calendar-event-${occurrence.key}`}
      >
        <View style={[styles.chipDotMarker, { backgroundColor: color }]} />
        <Text numberOfLines={1} style={styles.chipDotText}>
          {occurrence.event.title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onSelect?.(occurrence)}
      style={({ hovered }: PressableHoverState) => [
        styles.chip,
        { backgroundColor: color },
        hovered ? { opacity: 0.9 } : null,
        style,
        hideWebOutlineView,
      ]}
      testID={`calendar-event-${occurrence.key}`}
    >
      <Text numberOfLines={1} style={styles.chipText}>
        {occurrence.event.title}
      </Text>
    </Pressable>
  );
}
