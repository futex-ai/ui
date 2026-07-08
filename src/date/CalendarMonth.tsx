/**
 * The branded month grid shared by both date-picker overlays: a header with
 * prev/next month navigation, a Monday-first weekday row, and focusable, labelled
 * day buttons. Adjacent-month and out-of-bounds days are non-selectable. Clicking
 * the month/year title swaps the grid for a year picker so a far-off year is one
 * jump away. Holds no platform code — the web popover and the native sheet both
 * render it.
 */
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { ReactNode, RefObject } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { announce } from "../announcer";
import { useFocusRing } from "../focusRing";
import {
  type FocusableRef,
  focusItemAt,
  nextNavIndex,
} from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";

import {
  buildMonthGrid,
  DayCell,
  formatDisplay,
  monthLabel,
  parseIso,
  shiftMonth,
  toIso,
  WEEKDAYS,
  yearBlockStart,
  yearRange,
  yearRangeLabel,
  YEARS_PER_PAGE,
} from "./dateMath";
import { DateBounds, PressableHoverState } from "./types";
import {
  createWebCalendarStyles,
  WebCalendarStyles,
} from "./webCalendarStyles";

const isWeb = Platform.OS === "web";

// `gridcell` is a web-only ARIA role that is absent from React Native's `Role`
// union, so spread this pre-cast object (the pattern the Heatmap grid uses)
// rather than widening the View's typing.
const gridcellRole = { role: "gridcell" } as unknown as { role?: undefined };

/** A keydown event as react-native-web hands it to a Pressable on web. */
type CalendarKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

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
  // Whether the header is showing the year picker, and the start of the visible
  // year block (its own state so paging through blocks survives re-renders).
  const [pickingYear, setPickingYear] = useState(false);
  const [yearStart, setYearStart] = useState(() => yearBlockStart(base.year));
  // The persistent title button; focus returns here when a year is chosen so
  // unmounting the focused year cell never strands keyboard/AT users on <body>.
  const titleRef = useRef<View>(null);
  // Follow the value's month when it changes (e.g. the user types a valid date),
  // while leaving manual month navigation alone. A committed date also leaves the
  // year picker and realigns its block, so the header never shows a stale block.
  useEffect(() => {
    const parts = parseIso(value);
    if (parts) {
      setView({ year: parts.year, month: parts.month });
      setYearStart(yearBlockStart(parts.year));
      setPickingYear(false);
    }
  }, [value]);
  const weeks = buildMonthGrid(view.year, view.month);

  // Announce the new month to screen readers when the user pages with the
  // chevrons (off the focus path, so it doesn't steal focus) — WCAG 2.1 4.1.3.
  const step = useCallback((delta: number) => {
    setView((current) => {
      const next = shiftMonth(current.year, current.month, delta);
      announce(monthLabel(next.year, next.month));
      return next;
    });
  }, []);

  function openYearPicker() {
    setYearStart(yearBlockStart(view.year));
    setPickingYear(true);
  }

  function pageYears(delta: number) {
    setYearStart((start) => {
      const next = start + delta * YEARS_PER_PAGE;
      announce(yearRangeLabel(next));
      return next;
    });
  }

  function chooseYear(year: number) {
    setView((current) => ({ ...current, year }));
    setPickingYear(false);
    // The chosen year cell unmounts with the picker; move focus to the always-
    // mounted title button first so web keyboard focus is not lost to <body>.
    if (isWeb) {
      (titleRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    }
  }

  function outOfBounds(iso: string): boolean {
    return Boolean((min && iso < min) || (max && iso > max));
  }

  return (
    <>
      <View style={s.head}>
        <NavButton
          label={pickingYear ? "Previous years" : "Previous month"}
          onPress={() => (pickingYear ? pageYears(-1) : step(-1))}
          styles={s}
        >
          <ChevronLeft color={theme.colors.primaryDeep} size={16} />
        </NavButton>
        <TitleButton
          label={
            pickingYear
              ? `${yearRangeLabel(yearStart)}, back to month`
              : `${monthLabel(view.year, view.month)}, change year`
          }
          onPress={() =>
            pickingYear ? setPickingYear(false) : openYearPicker()
          }
          ref={titleRef}
          styles={s}
        >
          {pickingYear
            ? yearRangeLabel(yearStart)
            : monthLabel(view.year, view.month)}
        </TitleButton>
        <NavButton
          label={pickingYear ? "Next years" : "Next month"}
          onPress={() => (pickingYear ? pageYears(1) : step(1))}
          styles={s}
        >
          <ChevronRight color={theme.colors.primaryDeep} size={16} />
        </NavButton>
      </View>

      {pickingYear ? (
        <YearGrid
          max={max}
          min={min}
          onSelect={chooseYear}
          selectedYear={view.year}
          start={yearStart}
          styles={s}
        />
      ) : (
        <DayGrid
          onSelect={onSelect}
          onStepMonth={step}
          outOfBounds={outOfBounds}
          styles={s}
          today={today}
          value={value}
          view={view}
          weeks={weeks}
        />
      )}
    </>
  );
}

/** A header chevron button with a managed focus ring. */
function NavButton({
  label,
  onPress,
  styles,
  children,
}: {
  label: string;
  onPress: () => void;
  styles: WebCalendarStyles;
  children: ReactNode;
}) {
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={ring.onBlur}
      onFocus={ring.onFocus}
      onPress={onPress}
      style={[styles.nav, ring.focused ? ring.focusRingStyle : null]}
    >
      {children}
    </Pressable>
  );
}

/** The month/year title toggle with a managed focus ring. */
const TitleButton = forwardRef<
  View,
  {
    label: string;
    onPress: () => void;
    styles: WebCalendarStyles;
    children: ReactNode;
  }
>(function TitleButton({ label, onPress, styles, children }, ref) {
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={ring.onBlur}
      onFocus={ring.onFocus}
      onPress={onPress}
      ref={ref}
      style={({ hovered }: PressableHoverState) => [
        styles.titleButton,
        hovered ? styles.titleButtonHover : null,
        ring.focused ? ring.focusRingStyle : null,
      ]}
    >
      <Text style={styles.title}>{children}</Text>
    </Pressable>
  );
});

/**
 * The Monday-first weekday row + selectable day grid. Wired as an APG date-grid
 * on web (`role="grid"`/`row`/`columnheader` with the day buttons inside
 * `gridcell`s) and given roving-tabindex arrow-key navigation so the whole grid
 * is one Tab stop and the keyboard can walk it — WCAG 2.1 1.3.1 / 2.1.1 / 4.1.2.
 */
function DayGrid({
  weeks,
  view,
  value,
  today,
  outOfBounds,
  onSelect,
  onStepMonth,
  styles,
}: {
  weeks: DayCell[][];
  view: { year: number; month: number };
  value: string;
  today: string;
  outOfBounds: (iso: string) => boolean;
  onSelect: (iso: string) => void;
  onStepMonth: (delta: number) => void;
  styles: WebCalendarStyles;
}) {
  const cells = useMemo(() => weeks.flat(), [weeks]);
  const isDisabled = useCallback(
    (cell: DayCell) => !cell.inMonth || outOfBounds(cell.iso),
    [outOfBounds],
  );

  // The roving tab stop: the selected day, else today, else the first selectable
  // day. Only this cell is tabbable; arrow keys move focus between the rest.
  const initialActive = useMemo(() => {
    const selected = cells.findIndex((c) => c.iso === value && !isDisabled(c));
    if (selected >= 0) {
      return selected;
    }
    const todayIndex = cells.findIndex(
      (c) => c.iso === today && !isDisabled(c),
    );
    if (todayIndex >= 0) {
      return todayIndex;
    }
    const firstEnabled = cells.findIndex((c) => !isDisabled(c));
    return firstEnabled >= 0 ? firstEnabled : 0;
  }, [cells, value, today, isDisabled]);

  const [activeIndex, setActiveIndex] = useState(initialActive);
  // Re-home the roving index whenever the visible month (and so its cells)
  // changes, so the tab stop always lands on a real, selectable day.
  useEffect(() => {
    setActiveIndex(initialActive);
  }, [initialActive, view.year, view.month]);

  const cellRefs = useRef<RefObject<FocusableRef>[]>([]);
  cellRefs.current = cells.map(
    (_cell, index) => cellRefs.current[index] ?? { current: null },
  );

  // After paging the month with PageUp/PageDown we want to land focus in the new
  // grid; flag the next render to move DOM focus to the homed cell.
  const pendingFocusRef = useRef(false);
  useEffect(() => {
    if (pendingFocusRef.current && isWeb) {
      pendingFocusRef.current = false;
      focusItemAt(cellRefs.current, activeIndex);
    }
  }, [activeIndex]);

  const moveTo = useCallback((index: number) => {
    setActiveIndex(index);
    if (isWeb) {
      focusItemAt(cellRefs.current, index);
    }
  }, []);

  // Step from `from` in the direction implied by `key`, skipping disabled cells
  // (adjacent-month and out-of-bounds days) so focus always lands on a real,
  // selectable day rather than sticking on a dead cell.
  const resolveTarget = useCallback(
    (key: string): number | null => {
      const step = nextNavIndex({
        key,
        index: 0,
        count: 2,
        orientation: "grid",
        columns: 7,
        loop: false,
      });
      // Horizontal keys move by 1, vertical by 7; Home/End jump to an end.
      const delta =
        key === "ArrowRight"
          ? 1
          : key === "ArrowLeft"
            ? -1
            : key === "ArrowDown"
              ? 7
              : key === "ArrowUp"
                ? -7
                : 0;
      if (key === "Home" || key === "End") {
        const start = key === "Home" ? 0 : cells.length - 1;
        const dir = key === "Home" ? 1 : -1;
        for (let i = start; i >= 0 && i < cells.length; i += dir) {
          if (!isDisabled(cells[i])) {
            return i;
          }
        }
        return null;
      }
      if (step === null || delta === 0) {
        return null;
      }
      let next = activeIndex + delta;
      while (next >= 0 && next < cells.length && isDisabled(cells[next])) {
        next += delta;
      }
      if (next < 0 || next >= cells.length || isDisabled(cells[next])) {
        return null;
      }
      return next;
    },
    [activeIndex, cells, isDisabled],
  );

  const handleKey = useCallback(
    (event: CalendarKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key) {
        return;
      }
      // Page whole months with PageUp/PageDown (APG date-grid). The grid remounts
      // on the new month, so defer the focus move to the post-paging render.
      if (key === "PageUp" || key === "PageDown") {
        event.preventDefault?.();
        pendingFocusRef.current = true;
        onStepMonth(key === "PageUp" ? -1 : 1);
        return;
      }
      const next = resolveTarget(key);
      if (next === null) {
        return;
      }
      event.preventDefault?.();
      moveTo(next);
    },
    [moveTo, onStepMonth, resolveTarget],
  );

  // Web-only ARIA grid wiring. On native a labelled container would merge its
  // day buttons into one node (the VoiceOver/TalkBack "labelled container"
  // gotcha), so the name + grid roles are scoped to web; native keeps the plain
  // Views and its per-button labels.
  const gridProps = isWeb
    ? {
        accessibilityLabel: monthLabel(view.year, view.month),
        role: "grid" as const,
      }
    : null;
  const rowProps = isWeb ? { role: "row" as const } : null;
  const colHeaderProps = isWeb ? { role: "columnheader" as const } : null;

  // The weekday header row lives inside the grid so its `columnheader`s are valid
  // `grid` descendants (an APG date grid). On native the roles are omitted and
  // the structure is plain Views/Text.
  return (
    <View {...gridProps}>
      <View style={styles.dowRow} {...rowProps}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.dow} {...colHeaderProps}>
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={week[0].iso} style={styles.week} {...rowProps}>
          {week.map((cell, dayIndex) => {
            const index = weekIndex * 7 + dayIndex;
            return (
              <DayButton
                cell={cell}
                cellRef={cellRefs.current[index]}
                disabled={isDisabled(cell)}
                isActive={index === activeIndex}
                isToday={cell.iso === today}
                key={cell.iso}
                onKey={handleKey}
                onSelect={onSelect}
                selected={cell.iso === value}
                styles={styles}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * True when every day of `year` falls outside the [min, max] window, so the year
 * is non-selectable. Uses the same raw ISO string compare as the day grid's
 * `outOfBounds`, so the year picker and the day grid agree on the bounds.
 */
function yearOutOfBounds(
  year: number,
  min?: string | null,
  max?: string | null,
): boolean {
  return Boolean(
    (min && toIso({ year, month: 12, day: 31 }) < min) ||
    (max && toIso({ year, month: 1, day: 1 }) > max),
  );
}

/** The year picker shown in place of the day grid; rows of three year buttons. */
function YearGrid({
  start,
  selectedYear,
  min,
  max,
  onSelect,
  styles,
}: DateBounds & {
  start: number;
  selectedYear: number;
  onSelect: (year: number) => void;
  styles: WebCalendarStyles;
}) {
  const years = yearRange(start);
  const rows = [0, 3, 6, 9].map((offset) => years.slice(offset, offset + 3));
  return (
    <View style={styles.yearGrid}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.yearRow}>
          {row.map((year) => (
            <YearButton
              disabled={yearOutOfBounds(year, min, max)}
              key={year}
              onSelect={onSelect}
              selected={year === selectedYear}
              styles={styles}
              year={year}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function YearButton({
  year,
  disabled,
  onSelect,
  selected,
  styles,
}: {
  year: number;
  disabled: boolean;
  onSelect: (year: number) => void;
  selected: boolean;
  styles: WebCalendarStyles;
}) {
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityLabel={String(year)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onBlur={ring.onBlur}
      onFocus={ring.onFocus}
      onPress={() => onSelect(year)}
      style={({ hovered }: PressableHoverState) => [
        styles.yearCell,
        hovered && !disabled && !selected ? styles.yearCellHover : null,
        selected ? styles.yearCellSelected : null,
        ring.focused ? ring.focusRingStyle : null,
      ]}
    >
      <Text
        style={[
          styles.yearText,
          disabled ? styles.cellMuted : null,
          selected ? styles.yearTextSelected : null,
        ]}
      >
        {year}
      </Text>
    </Pressable>
  );
}

function DayButton({
  cell,
  cellRef,
  disabled,
  isActive,
  isToday,
  onKey,
  onSelect,
  selected,
  styles,
}: {
  cell: DayCell;
  cellRef: RefObject<FocusableRef>;
  disabled: boolean;
  isActive: boolean;
  isToday: boolean;
  onKey: (event: CalendarKeyEvent) => void;
  onSelect: (iso: string) => void;
  selected: boolean;
  styles: WebCalendarStyles;
}) {
  const ring = useFocusRing();
  // Each day stays a labelled `button`, but is wrapped in a `gridcell` on web so
  // the calendar reads as an APG date grid without changing the button's name.
  // `gridcell` is web-only ARIA (not in RN's `Role` union), so cast it as the
  // Heatmap grid does rather than widen the View's role typing.
  const cellProps = isWeb ? gridcellRole : null;
  // Roving tabindex: only the active cell is in the Tab order; arrow keys move
  // focus across the rest. Disabled cells are never tabbable.
  const tabIndex = disabled ? -1 : isActive ? 0 : -1;
  // RNW eats a forwarded `onKeyDown` on a TextInput but honours it on a
  // Pressable (the Switch/RadioCard pattern), so wire arrow keys there on web.
  const keyProps = isWeb ? { onKeyDown: onKey } : null;
  const button = (
    <Pressable
      accessibilityLabel={formatDisplay(cell.iso)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onBlur={ring.onBlur}
      onFocus={ring.onFocus}
      onPress={() => onSelect(cell.iso)}
      ref={(node) => {
        cellRef.current = node as unknown as FocusableRef;
      }}
      tabIndex={tabIndex}
      {...keyProps}
      style={({ hovered }: PressableHoverState) => [
        styles.cell,
        hovered && !disabled && !selected ? styles.cellHover : null,
        selected ? styles.cellSelected : null,
        isToday && !selected && !disabled ? styles.cellToday : null,
        ring.focused ? ring.focusRingStyle : null,
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
  if (!cellProps) {
    return button;
  }
  return <View {...cellProps}>{button}</View>;
}
