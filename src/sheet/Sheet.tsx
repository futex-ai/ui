/** Native bottom sheet: a slide-up modal surface hosting arbitrary content. */
import { useCallback, useMemo, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { BottomSheetShell } from "./BottomSheetShell";
import type { BottomSheetHandle } from "./BottomSheetShell";
import { sheetMaxHeight } from "./sheetModel";
import type { SheetProps } from "./types";

/**
 * A modal bottom sheet, pinned to the bottom edge with rounded top corners, a
 * grip handle, an optional header (title + dismiss control), and a scrollable
 * body capped at ~70% of the viewport. Controlled via `open` / `onClose`; the
 * body may be a node or a `({ close, maxHeight }) => node` render function.
 */
export function Sheet({
  children,
  dismissLabel = "Cancel",
  hideHeader = false,
  label,
  maxHeight,
  onClose,
  open,
  title,
}: SheetProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSheetStyles(theme), [theme]);
  const { height: viewportHeight } = useWindowDimensions();
  const cap = sheetMaxHeight(maxHeight, viewportHeight);
  const sheetRef = useRef<BottomSheetHandle | null>(null);
  // The dismiss control and the render-prop `close` animate the sheet down;
  // gorhom's `onClose` then notifies the caller so it flips `open` to false.
  const close = useCallback(() => sheetRef.current?.close(), []);

  // Mount only while open so each open plays the slide-up; the close animation
  // still runs because `open` stays true until `onClose` fires.
  if (!open) {
    return null;
  }

  const header = hideHeader ? null : (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>
        {title ?? label}
      </Text>
      <Pressable
        accessibilityLabel={dismissLabel}
        accessibilityRole="button"
        hitSlop={10}
        onPress={close}
        style={styles.dismiss}
      >
        <Text style={styles.dismissText}>{dismissLabel}</Text>
      </Pressable>
    </View>
  );
  const body =
    typeof children === "function"
      ? children({ close, maxHeight: cap })
      : children;

  return (
    <BottomSheetShell
      header={header}
      label={label}
      maxHeight={cap}
      onClose={onClose}
      open={open}
      sheetRef={sheetRef}
    >
      <View style={styles.body}>{body}</View>
    </BottomSheetShell>
  );
}

function createSheetStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    body: { gap: 12, paddingHorizontal: 16, paddingTop: 4 },
    dismiss: { paddingHorizontal: 4, paddingVertical: 2 },
    dismissText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: 15,
      fontWeight: "600",
    },
    header: {
      alignItems: "center",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 12,
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 17,
      fontWeight: "800",
    },
  });
}
