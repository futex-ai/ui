/**
 * Web single-date picker (the platform override bundlers resolve on web). The
 * `variant` chooses the surface:
 * - `calendar` (default) — a branded calendar popover portaled and anchored
 *   below the field, or above it when a whole month does not fit below;
 *   selecting a day commits immediately.
 * - `wheel` — the spinning wheel in the shared bottom sheet; spinning stages a
 *   draft that Cancel discards and Done commits, matching the native sheet.
 */
import { useMemo } from "react";
import { ScrollView, View } from "../primitives/reactNative";

import { DropdownPortal } from "../dropdown";
import { useSharedUiTheme } from "../theme";

import { CalendarMonth } from "./CalendarMonth";
import { CALENDAR_POPOVER_PLACEMENT } from "./calendarPopoverPlacement";
import { DateWheelSheet } from "./DateWheelSheet";
import { dateFieldZIndex } from "./dateFieldLayers";
import { DatePickerOverlayProps } from "./types";
import { createWebCalendarStyles } from "./webCalendarStyles";

export function DatePickerOverlay({
  anchorRef,
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  variant = "calendar",
  label,
  zIndex,
  testID,
}: DatePickerOverlayProps) {
  if (variant === "wheel") {
    return (
      <DateWheelSheet
        label={label}
        max={max}
        min={min}
        onClose={onClose}
        onSelect={onSelect}
        testID={testID}
        today={today}
        value={value}
      />
    );
  }
  return (
    <CalendarPopover
      anchorRef={anchorRef}
      label={label}
      max={max}
      min={min}
      onClose={onClose}
      onSelect={onSelect}
      testID={testID}
      today={today}
      value={value}
      zIndex={zIndex}
    />
  );
}

function CalendarPopover({
  anchorRef,
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  label,
  zIndex,
  testID,
}: Pick<
  DatePickerOverlayProps,
  | "value"
  | "anchorRef"
  | "today"
  | "min"
  | "max"
  | "onSelect"
  | "onClose"
  | "label"
  | "zIndex"
  | "testID"
>) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  return (
    <DropdownPortal
      {...CALENDAR_POPOVER_PLACEMENT}
      anchorRef={anchorRef}
      onClose={onClose}
      open
      zIndex={dateFieldZIndex(zIndex)}
    >
      {() => (
        // Named `dialog` rather than a bare anonymous container, so the
        // popover is announced and its boundary is discoverable. The editable
        // trigger keeps focus; Tab moves into the roving day grid and the shared
        // portal owns outside-press/Escape dismissal. When neither side of the
        // field has room for a whole month, the portal clamps the surface and
        // the month scrolls inside it instead of losing its last week rows.
        <View
          accessibilityLabel={label ?? "Choose date"}
          accessibilityViewIsModal
          role="dialog"
          style={s.portalBody}
          testID={testID}
        >
          <ScrollView>
            <CalendarMonth
              max={max}
              min={min}
              onSelect={onSelect}
              today={today}
              value={value}
            />
          </ScrollView>
        </View>
      )}
    </DropdownPortal>
  );
}
