/**
 * The calendar toolbar: prev/next/today navigation, the view title, and (when
 * more than one view is offered) a {@link SegmentedControl} to switch views. The
 * prev/next icon buttons step the anchor date by the view's granularity via the
 * caller's `onStep`; "Today" jumps to today. When `views` has a single entry the
 * switcher is hidden — the view is enforced.
 */
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { SegmentedControl } from "../segmented";
import { useSharedUiTheme } from "../theme";

import { createCalendarStyles } from "./calendarStyles";
import { viewTitle } from "./calendarMath";
import type { CalendarViewType } from "./types";

/** Human label for each view, shown on the switcher segments. */
const VIEW_LABELS: Record<CalendarViewType, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
};

/** Props for {@link CalendarToolbar}. */
export type CalendarToolbarProps = {
  /** The active view. */
  view: CalendarViewType;
  /** The anchor ISO date (drives the title). */
  date: string;
  /** Switcher options; the switcher is hidden when this has one entry. */
  views: CalendarViewType[];
  /** First day of the week, for the week/agenda title spans. */
  weekStartsOn: number;
  /** Agenda window length, for the agenda title span. */
  agendaDays: number;
  /** Step the anchor date by the view granularity (`-1` prev, `1` next). */
  onStep: (dir: -1 | 1) => void;
  /** Jump to today. */
  onToday: () => void;
  /** Change the active view. */
  onViewChange: (view: CalendarViewType) => void;
};

/** The calendar toolbar row. */
export function CalendarToolbar({
  view,
  date,
  views,
  weekStartsOn,
  agendaDays,
  onStep,
  onToday,
  onViewChange,
}: CalendarToolbarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);
  const title = viewTitle(view, date, weekStartsOn, agendaDays);
  const options = useMemo(
    () => views.map((value) => ({ label: VIEW_LABELS[value], value })),
    [views],
  );

  return (
    <View style={styles.toolbar}>
      <View style={styles.toolbarLeft}>
        <Pressable
          accessibilityLabel="Previous"
          accessibilityRole="button"
          onPress={() => onStep(-1)}
          style={({ hovered }: PressableHoverState) => [
            styles.navButton,
            hovered ? styles.navButtonHover : null,
            hideWebOutlineView,
          ]}
        >
          <ChevronLeft color={theme.colors.ink2} size={16} />
        </Pressable>
        <Pressable
          accessibilityLabel="Next"
          accessibilityRole="button"
          onPress={() => onStep(1)}
          style={({ hovered }: PressableHoverState) => [
            styles.navButton,
            hovered ? styles.navButtonHover : null,
            hideWebOutlineView,
          ]}
        >
          <ChevronRight color={theme.colors.ink2} size={16} />
        </Pressable>
        <Pressable
          accessibilityLabel="Today"
          accessibilityRole="button"
          onPress={onToday}
          style={({ hovered }: PressableHoverState) => [
            styles.todayButton,
            hovered ? styles.todayButtonHover : null,
            hideWebOutlineView,
          ]}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.toolbarTitle}>
          {title}
        </Text>
      </View>
      {views.length > 1 ? (
        <View style={styles.toolbarRight}>
          <SegmentedControl
            accessibilityLabel="Calendar view"
            onChange={onViewChange}
            options={options}
            size="sm"
            value={view}
          />
        </View>
      ) : null}
    </View>
  );
}
