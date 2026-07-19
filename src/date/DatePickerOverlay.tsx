/**
 * Native single-date picker (the default file `tsc` resolves and bundlers use on
 * iOS/Android). Presents the picker in a bottom sheet with Cancel/Done, so a tap
 * or spin stages a draft and Done commits it. The `variant` chooses the body:
 * the shared {@link CalendarMonth} grid (default) or the spinning
 * {@link DateWheel}.
 *
 * Unlike the accounting source — which delegated to the OS picker via
 * `@react-native-community/datetimepicker` — this library has no native picker
 * dependency, so it renders the calendar and the wheel itself. The web behaviour
 * (`DatePickerOverlay.web.tsx`) mirrors this seam.
 */
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { CalendarMonth } from "./CalendarMonth";
import { DateWheel } from "./DateWheel";
import { DatePickerOverlayProps } from "./types";

export function DatePickerOverlay({
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
  variant = "calendar",
  label,
  testID,
}: DatePickerOverlayProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSheetStyles(theme), [theme]);
  const [draft, setDraft] = useState(value || today);
  const wheel = variant === "wheel";

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
      transparent
      visible
    >
      <Pressable
        accessibilityLabel={label ? `Close ${label}` : "Close date picker"}
        onPress={onClose}
        style={styles.backdrop}
      />
      {/* `accessibilityViewIsModal` names the sheet and confines VoiceOver to it
          (parity with the web sheet's role="dialog" + label). */}
      <View
        accessibilityLabel={label ?? "Date picker"}
        accessibilityViewIsModal
        style={styles.sheet}
      >
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text style={styles.barButton}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onSelect(draft)}>
            <Text style={[styles.barButton, styles.barDone]}>Done</Text>
          </Pressable>
        </View>
        <View style={wheel ? styles.wheelBody : styles.calendar}>
          {wheel ? (
            <DateWheel
              max={max}
              min={min}
              onChange={setDraft}
              today={today}
              value={draft}
            />
          ) : (
            <CalendarMonth
              max={max}
              min={min}
              onSelect={setDraft}
              today={today}
              value={draft}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function createSheetStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    backdrop: { backgroundColor: "rgba(20, 24, 20, 0.35)", flex: 1 },
    bar: {
      alignItems: "center",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingBottom: 10,
      paddingHorizontal: 4,
    },
    barButton: { ...baseText, color: theme.colors.primaryDeep, fontSize: 16 },
    barDone: { fontWeight: "700" },
    calendar: { alignSelf: "center" },
    wheelBody: { paddingBottom: 4, paddingTop: 4 },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radii.xxl,
      borderTopRightRadius: theme.radii.xxl,
      bottom: 0,
      left: 0,
      paddingBottom: 28,
      paddingHorizontal: 16,
      paddingTop: 12,
      position: "absolute",
      right: 0,
    },
  });
}
