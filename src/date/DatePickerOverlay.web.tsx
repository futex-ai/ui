/**
 * Web single-date picker (the platform override bundlers resolve on web). The
 * `variant` chooses the surface:
 * - `calendar` (default) — a branded calendar popover anchored below the field;
 *   selecting a day commits immediately and the field's outside-press dismisses.
 * - `wheel` — the spinning {@link DateWheel} in a bottom sheet
 *   ({@link WebModalFrame}); spinning stages a draft that Cancel discards and
 *   Done commits, matching the native sheet.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
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
      label={label}
      max={max}
      min={min}
      onClose={onClose}
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
  onClose,
  label,
  zIndex,
}: Pick<
  DatePickerOverlayProps,
  | "value"
  | "today"
  | "min"
  | "max"
  | "onSelect"
  | "onClose"
  | "label"
  | "zIndex"
>) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  // Escape dismisses the popover through the shared layer stack, so a calendar
  // opened inside a modal/dropdown closes itself first and the surface beneath
  // it stays open (WCAG 2.1 2.1.2 No Keyboard Trap / 1.4.13 Content on Focus).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const layer = { onEscape: () => onCloseRef.current?.() };
    pushEscapeLayer(layer);
    return () => removeEscapeLayer(layer);
  }, []);
  return (
    // Named `dialog` rather than a bare anonymous container, so the popover is
    // announced and its boundary is programmatically discoverable. The trigger
    // (the editable text input) keeps focus for type-or-pick, so this is an
    // anchored, non-trapping popover: Tab moves into the day grid (a single
    // roving Tab stop) and Escape closes it (WCAG 2.1 4.1.2 Name/Role/Value).
    <View
      accessibilityLabel={label ?? "Choose date"}
      accessibilityViewIsModal
      role="dialog"
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
