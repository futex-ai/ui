/**
 * The branded month grid shared by both date-picker overlays: a header with
 * prev/next month navigation, a Monday-first weekday row, and focusable, labelled
 * day buttons. Adjacent-month and out-of-bounds days are non-selectable. Holds no
 * platform code — the web popover and the native sheet both render it.
 */
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  buildMonthGrid,
  DayCell,
  formatDisplay,
  monthLabel,
  parseIso,
  shiftMonth,
  WEEKDAYS,
} from "./dateMath";
import { DateBounds, PressableHoverState } from "./types";
import {
  createWebCalendarStyles,
  WebCalendarStyles,
} from "./webCalendarStyles";

/** Props for {@link CalendarMonth}. */
export type CalendarMonthProps = DateBounds & {
  /** Currently selected ISO date, or `""` when unset. */
  value: string;
  /** Today's ISO date, used for the "today" marker. */
  today: string;
  /** Called with the picked ISO date. */
  onSelect: (iso: string) => void;
};

export function CalendarMonth({
  value,
  today,
  min,
  max,
  onSelect,
}: CalendarMonthProps) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  const base = parseIso(value) ??
    parseIso(today) ?? { year: 2026, month: 1, day: 1 };
  const [view, setView] = useState({ year: base.year, month: base.month });
  // Follow the value's month when it changes (e.g. the user types a valid date),
  // while leaving manual month navigation alone.
  useEffect(() => {
    const parts = parseIso(value);
    if (parts) {
      setView({ year: parts.year, month: parts.month });
    }
  }, [value]);
  const weeks = buildMonthGrid(view.year, view.month);

  function step(delta: number) {
    setView((current) => shiftMonth(current.year, current.month, delta));
  }

  function outOfBounds(iso: string): boolean {
    return Boolean((min && iso < min) || (max && iso > max));
  }

  return (
    <>
      <View style={s.head}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          onPress={() => step(-1)}
          style={s.nav}
        >
          <ChevronLeft color={theme.colors.primaryDeep} size={16} />
        </Pressable>
        <Text style={s.title}>{monthLabel(view.year, view.month)}</Text>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          onPress={() => step(1)}
          style={s.nav}
        >
          <ChevronRight color={theme.colors.primaryDeep} size={16} />
        </Pressable>
      </View>

      <View style={s.dowRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={s.dow}>
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].iso} style={s.week}>
          {week.map((cell) => (
            <DayButton
              cell={cell}
              disabled={!cell.inMonth || outOfBounds(cell.iso)}
              isToday={cell.iso === today}
              key={cell.iso}
              onSelect={onSelect}
              selected={cell.iso === value}
              styles={s}
            />
          ))}
        </View>
      ))}
    </>
  );
}

function DayButton({
  cell,
  disabled,
  isToday,
  onSelect,
  selected,
  styles,
}: {
  cell: DayCell;
  disabled: boolean;
  isToday: boolean;
  onSelect: (iso: string) => void;
  selected: boolean;
  styles: WebCalendarStyles;
}) {
  return (
    <Pressable
      accessibilityLabel={formatDisplay(cell.iso)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => onSelect(cell.iso)}
      style={({ hovered }: PressableHoverState) => [
        styles.cell,
        hovered && !disabled && !selected ? styles.cellHover : null,
        selected ? styles.cellSelected : null,
        isToday && !selected && !disabled ? styles.cellToday : null,
      ]}
    >
      {/* Mute every disabled cell (adjacent-month *and* out-of-bounds days) so a
          dead click never looks selectable. */}
      <Text
        style={[
          styles.cellText,
          disabled ? styles.cellMuted : null,
          selected ? styles.cellTextSelected : null,
        ]}
      >
        {cell.day}
      </Text>
    </Pressable>
  );
}
