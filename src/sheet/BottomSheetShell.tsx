/**
 * Internal native bottom-sheet shell: the `@gorhom/bottom-sheet` + RN `Modal`
 * wiring shared by {@link Sheet} and the modal module's `bottom-sheet`
 * placement, so the gesture / backdrop / scroll plumbing lives in exactly one
 * place. NOT part of the public `@firna/ui/sheet` surface — it is imported by
 * the sheet and modal builds directly.
 *
 * The sheet lives inside an RN `Modal` (+ a `GestureHandlerRootView` so gestures
 * work in the Modal's isolated view tree), which keeps consumers from needing a
 * `BottomSheetModalProvider` — only the `@gorhom/bottom-sheet` / reanimated /
 * gesture-handler peer deps installed.
 */
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef } from "react";
import type { ComponentRef, ReactNode, RefObject } from "react";
import { Modal, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

/** Imperative handle for the underlying sheet, so a caller can animate it closed. */
export type BottomSheetHandle = ComponentRef<typeof BottomSheet>;

export type BottomSheetShellProps = {
  /** Body content, rendered below any `header`. */
  children: ReactNode;
  /** Extra padding/styles merged onto the scroll content container. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Backdrop tap and pan-down close (default `true`). */
  dismissible?: boolean;
  /** Footer node pinned after the body inside the scroll column. */
  footer?: ReactNode;
  /** Header node rendered above the body inside the scroll column. */
  header?: ReactNode;
  /** Accessible name announced on the scroll surface (WCAG 4.1.2). */
  label: string;
  /** Cap on the sheet's dynamic content height (px). */
  maxHeight?: number;
  /** Fires once the sheet has animated closed (gorhom `onClose`). */
  onClose: () => void;
  /** Controlled visibility of the backing RN `Modal`. */
  open: boolean;
  /** Imperative handle so the caller can animate the sheet closed. */
  sheetRef?: RefObject<BottomSheetHandle | null>;
};

export function BottomSheetShell({
  children,
  contentContainerStyle,
  dismissible = true,
  footer,
  header,
  label,
  maxHeight,
  onClose,
  open,
  sheetRef,
}: BottomSheetShellProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createShellStyles(theme), [theme]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.36}
        pressBehavior={dismissible ? "close" : "none"}
      />
    ),
    [dismissible],
  );

  return (
    <Modal
      animationType="none"
      // Android back animates the sheet down (gorhom's `onClose` then fires the
      // caller's `onClose`); a non-dismissible sheet swallows the press.
      onRequestClose={() =>
        dismissible ? sheetRef?.current?.close() : undefined
      }
      statusBarTranslucent
      transparent
      visible={open}
    >
      <GestureHandlerRootView style={styles.flex}>
        <BottomSheet
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.background}
          enableDynamicSizing
          enablePanDownToClose={dismissible}
          handleIndicatorStyle={styles.handleIndicator}
          index={0}
          maxDynamicContentSize={maxHeight}
          onClose={() => onCloseRef.current()}
          ref={sheetRef}
        >
          <BottomSheetScrollView
            accessibilityLabel={label}
            accessibilityViewIsModal
            contentContainerStyle={[styles.content, contentContainerStyle]}
          >
            {header}
            {children}
            {footer}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createShellStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    background: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
    },
    // Fixed bottom inset stands in for a true safe-area inset (that would add a
    // `react-native-safe-area-context` peer dep — a deliberate follow-up).
    content: { paddingBottom: 28 },
    flex: { flex: 1 },
    handleIndicator: { backgroundColor: theme.colors.border2, width: 40 },
  });
}
