/**
 * The branded spinning day/month/year wheel shared by both wheel-variant
 * overlays — an iOS-style three-column picker built from our theme rather than
 * the OS picker. Each column is a snap-scrolling list whose centered row is the
 * selection; rows are also tappable (the reliable pointer/keyboard path).
 *
 * Holds no platform-modal code: the web bottom sheet (`WheelDatePickerOverlay`)
 * and the native sheet (`DatePickerOverlay.tsx`) both render it. Selection is
 * staged as a draft and committed by the sheet's Done button.
 *
 * The column order is Day · Month · Year to match the `D Mon YYYY` display
 * format (en-GB), and every change is clamped: spinning to a shorter month keeps
 * a valid day, and out-of-[min, max] dates snap back to the nearest bound.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  clampDay,
  clampIso,
  daysInMonth,
  parseIso,
  SHORT_MONTHS,
  toIso,
  wheelYearRange,
} from "./dateMath";
import { DateBounds } from "./types";
import {
  createWheelPickerStyles,
  WHEEL_ITEM_HEIGHT,
  WheelPickerStyles,
} from "./wheelPickerStyles";

/** Props for {@link DateWheel}: the controlled ISO draft plus optional bounds. */
export type DateWheelProps = DateBounds & {
  /** Current ISO `YYYY-MM-DD` draft (never `""`; the sheet seeds it with today). */
  value: string;
  /** Today's ISO date, used as the anchor when {@link value} is unparseable. */
  today: string;
  /** Called with the next ISO draft (already clamped to a valid bounded date). */
  onChange: (iso: string) => void;
};

type WheelItem = { key: string; label: string; disabled: boolean };

// A rest within this many px of a row's exact center counts as centered, so the
// platform's sub-pixel snap doesn't trigger a needless correcting scroll.
const CENTER_EPSILON = 2;

export function DateWheel({
  value,
  today,
  min,
  max,
  onChange,
}: DateWheelProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createWheelPickerStyles(theme), [theme]);

  const parts = parseIso(value) ??
    parseIso(today) ?? { year: 2026, month: 1, day: 1 };
  const { year, month, day } = parts;

  // Freeze the year span on open so spinning the year column doesn't shift its
  // own window (the no-bounds window is anchored to the date the sheet opened).
  const [{ lo, hi }] = useState(() => wheelYearRange(value, today, min, max));

  const outOfBounds = (iso: string): boolean =>
    Boolean((min && iso < min) || (max && iso > max));

  // Apply one column's change: keep the day valid for the resulting month, then
  // clamp the whole date into [min, max] so Done always commits a legal value.
  const commit = (nextYear: number, nextMonth: number, nextDay: number) => {
    const safeDay = clampDay(nextYear, nextMonth, nextDay);
    onChange(
      clampIso(
        toIso({ year: nextYear, month: nextMonth, day: safeDay }),
        min,
        max,
      ),
    );
  };

  const dayItems = useMemo<WheelItem[]>(() => {
    const count = daysInMonth(year, month);
    return Array.from({ length: count }, (_unused, index) => {
      const d = index + 1;
      return {
        key: String(d),
        label: String(d),
        disabled: outOfBounds(toIso({ year, month, day: d })),
      };
    });
  }, [year, month, min, max]);

  const monthItems = useMemo<WheelItem[]>(
    () =>
      SHORT_MONTHS.map((name, index) => {
        const m = index + 1;
        const probe = toIso({ year, month: m, day: clampDay(year, m, day) });
        return { key: name, label: name, disabled: outOfBounds(probe) };
      }),
    [year, day, min, max],
  );

  const yearItems = useMemo<WheelItem[]>(
    () =>
      Array.from({ length: hi - lo + 1 }, (_unused, index) => {
        const y = lo + index;
        const probe = toIso({ year: y, month, day: clampDay(y, month, day) });
        return {
          key: String(y),
          label: String(y),
          disabled: outOfBounds(probe),
        };
      }),
    [lo, hi, month, day, min, max],
  );

  return (
    // No accessibilityLabel/role on the wrapper: a labelled container merges its
    // descendants into one node on native (VoiceOver/TalkBack), which would
    // swallow the individual row buttons. The sheet (overlay) names the picker.
    <View style={styles.frame}>
      <View style={styles.wheel}>
        {/* Behind the columns (rendered first): the centered selection pill. */}
        <View pointerEvents="none" style={styles.selectionBand} />
        <WheelColumn
          items={dayItems}
          label="Day"
          onSelectIndex={(index) => commit(year, month, index + 1)}
          selectedIndex={day - 1}
          styles={styles}
        />
        <WheelColumn
          items={monthItems}
          label="Month"
          onSelectIndex={(index) => commit(year, index + 1, day)}
          selectedIndex={month - 1}
          styles={styles}
        />
        <WheelColumn
          items={yearItems}
          label="Year"
          onSelectIndex={(index) => commit(lo + index, month, day)}
          selectedIndex={year - lo}
          styles={styles}
        />
      </View>
    </View>
  );
}

function WheelColumn({
  items,
  label,
  onSelectIndex,
  selectedIndex,
  styles,
}: {
  items: WheelItem[];
  label: string;
  onSelectIndex: (index: number) => void;
  selectedIndex: number;
  styles: WheelPickerStyles;
}) {
  const scrollRef = useRef<ScrollView>(null);
  // The row currently under the band, tracked live so the highlight follows the
  // scroll; the committed selection (`selectedIndex`) only changes when it rests.
  const [centerIndex, setCenterIndex] = useState(selectedIndex);
  const mountedRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Best-effort live scroll position (starts at 0, the ScrollView's mount offset).
  const offsetRef = useRef(0);
  // Armed while a programmatic scroll is in flight so the settle it produces is
  // not misread as a user selection (e.g. an interrupted re-center animation
  // whose momentum-end reports an intermediate, off-row offset on native).
  const suppressRef = useRef(false);

  const lastIndex = items.length - 1;
  const clampIndex = (index: number) => Math.min(Math.max(index, 0), lastIndex);
  const indexFromOffset = (y: number) =>
    clampIndex(Math.round(y / WHEEL_ITEM_HEIGHT));
  const offsetOf = (index: number) => index * WHEEL_ITEM_HEIGHT;

  // Scroll to center `index`, arming the suppress guard — but only when it will
  // actually move. A no-op scrollTo emits no scroll event, which would otherwise
  // strand the guard and swallow the user's next rest.
  const scrollToIndex = (index: number, animated: boolean) => {
    const target = offsetOf(index);
    if (Math.abs(offsetRef.current - target) <= CENTER_EPSILON) {
      return;
    }
    suppressRef.current = true;
    scrollRef.current?.scrollTo({ y: target, animated });
  };

  // Keep the column centered on the controlled selection: jump on first paint,
  // animate afterwards (e.g. when a clamp snapped the value to a nearby row, or
  // a rest landed between rows).
  useEffect(() => {
    setCenterIndex(selectedIndex);
    const animated = mountedRef.current;
    mountedRef.current = true;
    scrollToIndex(selectedIndex, animated);
  }, [selectedIndex]);

  const settle = (y: number) => {
    // Swallow the scroll our own re-center produced rather than re-committing.
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    const next = indexFromOffset(y);
    if (next !== selectedIndex) {
      // Rested on a new row — commit it; the effect then snaps it dead-center.
      onSelectIndex(next);
      return;
    }
    // Already the committed row: nudge onto exact center only if it drifted past
    // the platform's sub-pixel snap, so a near-aligned rest doesn't micro-jank.
    scrollToIndex(next, true);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    offsetRef.current = y;
    const index = indexFromOffset(y);
    setCenterIndex((current) => (current === index ? current : index));
    // Web ScrollViews have no momentum-end event, so detect the scroll stop by
    // debouncing the scroll stream; native settles via onMomentumScrollEnd.
    if (Platform.OS === "web") {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
      stopTimerRef.current = setTimeout(() => settle(y), 130);
    }
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (Platform.OS === "web") {
      return;
    }
    settle(event.nativeEvent.contentOffset.y);
  };

  // Tapping a row selects it directly — the reliable pointer and keyboard path,
  // and what the calendar/wheel parity tests drive.
  const handleTap = (index: number) => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }
    if (index === selectedIndex) {
      // Already committed — just re-center (e.g. after a partial drag).
      scrollToIndex(index, true);
      return;
    }
    onSelectIndex(index);
  };

  useEffect(
    () => () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    },
    [],
  );

  return (
    <ScrollView
      accessible={false}
      decelerationRate="fast"
      nestedScrollEnabled
      onMomentumScrollEnd={handleMomentumEnd}
      onScroll={handleScroll}
      ref={scrollRef}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_HEIGHT}
      style={styles.column}
      contentContainerStyle={styles.columnContent}
    >
      {items.map((item, index) => (
        <WheelRow
          centered={index === centerIndex}
          distance={Math.abs(index - centerIndex)}
          item={item}
          key={item.key}
          label={label}
          onPress={() => handleTap(index)}
          selected={index === selectedIndex}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
}

function WheelRow({
  centered,
  distance,
  item,
  label,
  onPress,
  selected,
  styles,
}: {
  centered: boolean;
  distance: number;
  item: WheelItem;
  label: string;
  onPress: () => void;
  selected: boolean;
  styles: WheelPickerStyles;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label} ${item.label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: item.disabled, selected }}
      disabled={item.disabled}
      onPress={onPress}
      style={styles.item}
    >
      <Text
        style={[
          styles.itemText,
          item.disabled
            ? styles.itemTextDisabled
            : centered
              ? styles.itemTextSelected
              : distance === 1
                ? styles.itemTextNear
                : distance === 2
                  ? styles.itemTextFar
                  : styles.itemTextEdge,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
