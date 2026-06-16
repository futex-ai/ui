/**
 * Web single-date picker (the platform override bundlers resolve on web). The
 * `variant` chooses the surface:
 * - `calendar` (default) — a branded calendar popover anchored below the field;
 *   selecting a day commits immediately and the field's outside-press dismisses.
 * - `wheel` — the spinning {@link DateWheel} in a bottom sheet
 *   ({@link WebModalFrame}); spinning stages a draft that Cancel discards and
 *   Done commits, matching the native sheet.
 */
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { WebModalFrame } from "../modal";
import { useSharedUiTheme } from "../theme";

import { CalendarMonth } from "./CalendarMonth";
import { DateWheel } from "./DateWheel";
import { dateFieldZIndex } from "./dateFieldLayers";
import { DatePickerOverlayProps } from "./types";
import { createWebCalendarStyles } from "./webCalendarStyles";
import { createWheelPickerStyles } from "./wheelPickerStyles";

export function DatePickerOverlay({
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  variant = "calendar",
  label,
  zIndex,
}: DatePickerOverlayProps) {
  if (variant === "wheel") {
    return (
      <WheelSheet
        label={label}
        max={max}
        min={min}
        onClose={onClose}
        onSelect={onSelect}
        today={today}
        value={value}
      />
    );
  }
  return (
    <CalendarPopover
      max={max}
      min={min}
      onSelect={onSelect}
      today={today}
      value={value}
      zIndex={zIndex}
    />
  );
}

function CalendarPopover({
  value,
  today,
  min,
  max,
  onSelect,
  zIndex,
}: Pick<
  DatePickerOverlayProps,
  "value" | "today" | "min" | "max" | "onSelect" | "zIndex"
>) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  return (
    <View
      accessibilityViewIsModal
      style={[s.pop, { zIndex: dateFieldZIndex(zIndex) }]}
    >
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

function WheelSheet({
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  label,
}: Pick<
  DatePickerOverlayProps,
  "value" | "today" | "min" | "max" | "onSelect" | "onClose" | "label"
>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createWheelPickerStyles(theme), [theme]);
  // Spin stages a draft; Done commits it, Cancel/backdrop/Escape discard it.
  const [draft, setDraft] = useState(value || today);

  return (
    <WebModalFrame
      footer={
        <>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.footerButton, styles.footerCancel]}
          >
            <Text style={styles.footerCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect(draft)}
            style={[styles.footerButton, styles.footerDone]}
          >
            <Text style={styles.footerDoneText}>Done</Text>
          </Pressable>
        </>
      }
      onClose={onClose}
      placement="bottom-sheet"
      scroll={false}
      title={label ?? "Select date"}
    >
      <DateWheel
        max={max}
        min={min}
        onChange={setDraft}
        today={today}
        value={draft}
      />
    </WebModalFrame>
  );
}
