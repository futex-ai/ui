/**
 * A positioned timed event block for the time grid. Absolutely placed by the
 * caller (TimeGrid computes `top`/`height`/`left`/`width` from the occurrence's
 * column layout and the grid geometry) and rendered as a labelled `button` that
 * fires `onSelect` on press. The event's `color` (falling back to the theme
 * primary) fills the block; the title/time sit on the surface colour.
 */
import { useMemo } from "react";
import {
  DimensionValue,
  Pressable,
  StyleProp,
  Text,
  ViewStyle,
} from "react-native";

import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createCalendarStyles } from "./calendarStyles";
import { formatTimeRange } from "./calendarMath";
import type { CalendarOccurrence } from "./types";

/** Props for {@link CalendarEventBlock}. */
export type CalendarEventBlockProps = {
  /** The occurrence to render. */
  occurrence: CalendarOccurrence;
  /** Absolute geometry the time grid computed for this block. */
  position: {
    top: number;
    height: number;
    left: DimensionValue;
    width: DimensionValue;
  };
  /** Called with the occurrence when the block is pressed. */
  onSelect?: (occurrence: CalendarOccurrence) => void;
  /** Extra style for the block container. */
  style?: StyleProp<ViewStyle>;
};

/**
 * One timed event block inside a day column. The accessible name is
 * `"<title>, <time range>"`; the block colour is the event `color` or the theme
 * primary. The title is hidden when the block is too short to show two lines.
 */
export function CalendarEventBlock({
  occurrence,
  position,
  onSelect,
  style,
}: CalendarEventBlockProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);
  const color = occurrence.event.color ?? theme.colors.primary;
  const timeRange = formatTimeRange(occurrence.start, occurrence.end);
  // Short blocks (a single slot tall) only have room for the title line.
  const compact = position.height < 34;
  return (
    <Pressable
      accessibilityLabel={`${occurrence.event.title}, ${timeRange}`}
      accessibilityRole="button"
      onPress={() => onSelect?.(occurrence)}
      style={({ hovered }: PressableHoverState) => [
        styles.eventBlock,
        {
          backgroundColor: color,
          height: position.height,
          left: position.left,
          top: position.top,
          width: position.width,
        },
        hovered ? { opacity: 0.9 } : null,
        style,
        hideWebOutlineView,
      ]}
      testID={`calendar-event-${occurrence.key}`}
    >
      <Text numberOfLines={1} style={styles.eventBlockTitle}>
        {occurrence.event.title}
      </Text>
      {compact ? null : (
        <Text numberOfLines={1} style={styles.eventBlockTime}>
          {timeRange}
        </Text>
      )}
    </Pressable>
  );
}
