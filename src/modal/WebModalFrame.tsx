/**
 * Native (iOS/Android) modal frame. Mirrors the caller seam of the web frame
 * (`WebModalFrame.web.tsx`) but renders through a React Native `Modal` overlay:
 *
 * - `placement="bottom-sheet"` uses `@gorhom/bottom-sheet` for a gesture-driven
 *   native sheet (drag/flick to dismiss, spring motion, a backdrop that dims with
 *   the drag, content-sized height).
 * - `placement="center"` is a plain centered dialog (fade in/out).
 *
 * The sheet lives inside an RN `Modal` (+ a `GestureHandlerRootView` so gestures
 * work in the Modal's isolated view tree), which keeps the component self
 * contained — consumers don't need a `BottomSheetModalProvider`, only the
 * `@gorhom/bottom-sheet` / reanimated / gesture-handler peer deps installed.
 *
 * `accessibilityViewIsModal` confines assistive tech to the surface (works
 * natively, unlike RNW — hence the web frame's manual `inert` focus trap).
 */
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { useCallback, useMemo, useRef } from "react";
import type { ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import type { WebModalFrameProps } from "./types";
import { webModalCanClose, webModalMaxWidth } from "./webModalModel";
import type { WebModalCloseSource } from "./webModalModel";

export function WebModalFrame({
  body,
  children,
  closeDisabled = false,
  closeLabel,
  dismissible = true,
  footer,
  bodyStyle,
  footerStyle,
  headerStyle,
  onClose,
  placement = "center",
  scroll = true,
  showCloseButton = true,
  size = "md",
  subtitleStyle,
  surfaceStyle,
  subtitle,
  title,
  titleStyle,
  visible = true,
}: WebModalFrameProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createNativeModalStyles(theme), [theme]);
  const sheet = placement === "bottom-sheet";
  const sheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const policy = { closeDisabled, dismissible };
  const canDismiss = webModalCanClose(policy, "backdrop");
  const content = body ?? children;

  // Close button / Android back animate the sheet down (gorhom's `onClose` then
  // fires the caller's `onClose`); for the centered dialog we close directly.
  const requestClose = useCallback(
    (source: WebModalCloseSource) => {
      if (!webModalCanClose({ closeDisabled, dismissible }, source)) {
        return;
      }
      if (placement === "bottom-sheet") {
        sheetRef.current?.close();
      } else {
        onCloseRef.current();
      }
    },
    [closeDisabled, dismissible, placement],
  );

  const header = (
    <View style={[styles.header, headerStyle]}>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={[styles.title, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        ) : null}
      </View>
      {showCloseButton ? (
        <Pressable
          accessibilityLabel={closeLabel ?? `Close ${title}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: closeDisabled }}
          disabled={closeDisabled}
          hitSlop={10}
          onPress={() => requestClose("closeButton")}
          style={[styles.closeButton, closeDisabled ? styles.disabled : null]}
        >
          <X color={theme.colors.ink2} size={18} />
        </Pressable>
      ) : null}
    </View>
  );

  const footerBlock = footer ? (
    <View style={[styles.footer, footerStyle]}>{footer}</View>
  ) : null;

  if (sheet) {
    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.36}
        pressBehavior={canDismiss ? "close" : "none"}
      />
    );
    return (
      <Modal
        animationType="none"
        onRequestClose={() => requestClose("escape")}
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <GestureHandlerRootView style={styles.flex}>
          <BottomSheet
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.sheetBackground}
            enableDynamicSizing
            enablePanDownToClose={canDismiss}
            handleIndicatorStyle={styles.handleIndicator}
            index={0}
            onClose={() => onCloseRef.current()}
            ref={sheetRef}
          >
            <BottomSheetScrollView
              accessibilityLabel={title}
              accessibilityViewIsModal
              contentContainerStyle={styles.sheetContent}
            >
              {header}
              <View style={[styles.body, bodyStyle]}>{content}</View>
              {footerBlock}
            </BottomSheetScrollView>
          </BottomSheet>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => requestClose("escape")}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => requestClose("backdrop")}
        style={styles.backdrop}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
        style={styles.center}
      >
        <View
          accessibilityLabel={title}
          accessibilityViewIsModal
          style={[
            styles.surface,
            { maxWidth: webModalMaxWidth(size) },
            surfaceStyle,
          ]}
        >
          {header}
          {scroll ? (
            <ScrollView contentContainerStyle={[styles.body, bodyStyle]}>
              {content}
            </ScrollView>
          ) : (
            <View style={[styles.body, bodyStyle]}>{content}</View>
          )}
          {footerBlock}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createNativeModalStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(20, 28, 22, 0.36)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    body: { gap: 12, padding: 14, paddingTop: 0 },
    center: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      padding: 24,
      position: "absolute",
      right: 0,
      top: 0,
    },
    closeButton: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    disabled: { opacity: 0.55 },
    flex: { flex: 1 },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-end",
      padding: 14,
      paddingTop: 12,
    },
    handleIndicator: { backgroundColor: theme.colors.border2, width: 40 },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      padding: 14,
      paddingBottom: 12,
    },
    sheetBackground: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
    },
    sheetContent: { paddingBottom: 28 },
    subtitle: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 13,
      lineHeight: 19.5,
      marginTop: 2,
    },
    surface: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      elevation: 12,
      maxHeight: "92%",
      overflow: "hidden",
      width: "100%",
    },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 18,
      fontWeight: "800",
      lineHeight: 27,
    },
    titleBlock: { flex: 1, minWidth: 0 },
  });
}
