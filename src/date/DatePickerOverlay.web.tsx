/**
 * Web single-date picker: a branded calendar popover anchored below the field
 * (the platform override bundlers resolve on web). Selecting a day commits
 * immediately; the field's outside-press handler dismisses it.
 */
import { useMemo } from "react";
import { View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { CalendarMonth } from "./CalendarMonth";
import { DatePickerOverlayProps } from "./types";
import { createWebCalendarStyles } from "./webCalendarStyles";

export function DatePickerOverlay({
  value,
  today,
  min,
  max,
  onSelect,
}: DatePickerOverlayProps) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  return (
    <View accessibilityViewIsModal style={s.pop}>
      <CalendarMonth
        max={max}
        min={min}
        onSelect={onSelect}
        today={today}
        value={value}
      />
    </View>
  );
}
