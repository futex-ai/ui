/**
 * Native single-date picker (the default file `tsc` resolves and bundlers use on
 * iOS/Android). Presents the shared calendar in a bottom sheet with Cancel/Done,
 * so a tap stages a draft and Done commits it.
 *
 * Unlike the accounting source — which delegated to the OS picker via
 * `@react-native-community/datetimepicker` — this library has no native picker
 * dependency, so it renders {@link CalendarMonth} itself. The web behaviour
 * (`DatePickerOverlay.web.tsx`) is unchanged.
 */
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { CalendarMonth } from "./CalendarMonth";
import { DatePickerOverlayProps } from "./types";

export function DatePickerOverlay({
  value,
  today,
  min,
  max,
  onSelect,
  onClose,
}: DatePickerOverlayProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSheetStyles(theme), [theme]);
  const [draft, setDraft] = useState(value || today);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel="Close date picker"
        onPress={onClose}
        style={styles.backdrop}
      />
      <View style={styles.sheet}>
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text style={styles.barButton}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onSelect(draft)}>
            <Text style={[styles.barButton, styles.barDone]}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.calendar}>
          <CalendarMonth
            max={max}
            min={min}
            onSelect={setDraft}
            today={today}
            value={draft}
          />
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
