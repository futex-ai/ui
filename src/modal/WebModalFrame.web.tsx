/** Portal-backed modal frame for Expo web surfaces. */
import { X } from "../primitives/icons";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, ScrollView, Text, View } from "../primitives/reactNative";
import type { ViewStyle } from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import { createWebModalFrameStyles } from "./webModalFrameStyles";
import { useWebModalFocusTrap } from "./useWebModalFocusTrap";
import { WebModalPortal } from "./WebModalPortal";
import { webModalCanClose, webModalMaxWidth } from "./webModalModel";
import type { WebModalCloseSource } from "./webModalModel";
import type { WebModalFrameProps } from "./types";

type ClosePolicyRef = {
  closeDisabled: boolean;
  dismissible: boolean;
};

// Web-only: ease the bottom sheet to its new height when its content grows or
// shrinks, mirroring the native gorhom sheet's spring instead of snapping.
// `height` is the animatable length because the sheet is pinned to the bottom;
// RNW forwards `transition` straight to the underlying CSS. Cast because RNW's
// `ViewStyle` type does not model the web-only `transition` shorthand.
const SHEET_HEIGHT_TRANSITION = {
  transition: "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
} as unknown as ViewStyle;

export function WebModalFrame({
  accessibilityLabel,
  body,
  children,
  closeDisabled = false,
  closeLabel,
  closeText,
  focusIndicator,
  dismissible = true,
  footer,
  bodyStyle,
  footerStyle,
  headerStyle,
  initialFocusRef,
  onClose,
  placement = "center",
  scroll = true,
  showCloseButton = true,
  size = "md",
  subtitleStyle,
  surfaceStyle,
  subtitle,
  testID,
  title,
  titleStyle,
  visible = true,
}: WebModalFrameProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createWebModalFrameStyles(theme), [theme]);
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const closeRing = useFocusRing({ indicator: focusIndicator });
  // Measured natural height of the sheet's content, driven from the scroll
  // view's `onContentSizeChange`. Applying it as an explicit `height` (with the
  // transition above) is what makes the sheet animate as content changes; the
  // surface's `maxHeight: 92%` still caps it so overflow scrolls instead.
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  const closeButtonRef = useRef<View>(null);
  const closePolicyRef = useRef<ClosePolicyRef>({
    closeDisabled,
    dismissible,
  });
  const initialFocusTargetRef = useRef(initialFocusRef);
  const onCloseRef = useRef(onClose);
  const surfaceRef = useRef<View>(null);
  closePolicyRef.current = { closeDisabled, dismissible };
  initialFocusTargetRef.current = initialFocusRef;
  onCloseRef.current = onClose;
  const requestClose = useCallback((source: WebModalCloseSource) => {
    if (webModalCanClose(closePolicyRef.current, source)) {
      onCloseRef.current();
    }
  }, []);

  useWebModalFocusTrap({
    closeButtonRef,
    initialFocusTargetRef,
    requestClose,
    surfaceRef,
    visible,
  });

  // Re-measure from scratch on each open: drop the cached height when the sheet
  // closes so a reopen with different content sizes to it instead of animating
  // down from the previous session's height.
  useEffect(() => {
    if (!visible) {
      setSheetHeight(null);
    }
  }, [visible]);

  if (!visible || typeof document === "undefined") {
    return null;
  }

  const content = body ?? children;
  const sheet = placement === "bottom-sheet";
  const header = (
    <View style={[styles.header, headerStyle]}>
      <View style={styles.titleBlock}>
        <Text
          accessibilityRole="header"
          aria-level={1}
          nativeID={titleId}
          style={[styles.title, titleStyle]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        ) : null}
      </View>
      {showCloseButton ? (
        <Pressable
          // Visible text names the button (WCAG 2.5.3); the ✕ icon needs a label.
          accessibilityLabel={closeText ?? closeLabel ?? `Close ${title}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: closeDisabled }}
          disabled={closeDisabled}
          {...closeRing.focusRingProps}
          onBlur={closeRing.onBlur}
          onFocus={closeRing.onFocus}
          onPress={() => requestClose("closeButton")}
          ref={closeButtonRef}
          style={[
            closeText ? styles.closeTextButton : styles.closeButton,
            closeDisabled ? styles.disabled : null,
            closeRing.focusRingVariables,
          ]}
        >
          {closeText ? (
            <Text style={styles.closeText}>{closeText}</Text>
          ) : (
            <X aria-hidden color={theme.colors.ink2} size={18} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
  const footerBlock = footer ? (
    <View style={[styles.footer, footerStyle]}>{footer}</View>
  ) : null;
  const modal = (
    <View style={styles.layer} pointerEvents="box-none" testID={testID}>
      {/* Backdrop is a mouse-only dismiss target: hidden from assistive tech and
          skipped by the keyboard (Escape already provides the accessible close
          path), so it never injects a full-viewport "Close" control into the AT
          tree or the modal's tab order. */}
      <Pressable
        aria-hidden
        focusable={false}
        importantForAccessibility="no-hide-descendants"
        onPress={() =>
          closeDisabled || !dismissible ? undefined : requestClose("backdrop")
        }
        style={styles.backdrop}
        tabIndex={-1}
      />
      <View
        pointerEvents="box-none"
        style={[styles.center, sheet ? styles.centerSheet : null]}
      >
        <View
          accessibilityViewIsModal
          // Named by the visible title unless the caller names it.
          aria-label={accessibilityLabel}
          aria-labelledby={accessibilityLabel ? undefined : titleId}
          aria-modal
          ref={surfaceRef}
          role="dialog"
          style={[
            styles.surface,
            sheet
              ? [
                  styles.surfaceSheet,
                  reducedMotion ? null : SHEET_HEIGHT_TRANSITION,
                  sheetHeight != null ? { height: sheetHeight } : null,
                ]
              : { maxWidth: webModalMaxWidth(size) },
            surfaceStyle,
          ]}
          tabIndex={-1}
        >
          {sheet ? (
            // The sheet scrolls header/body/footer as one column (matching the
            // native sheet) so `onContentSizeChange` reports the full content
            // height — the value that drives the height animation above.
            <ScrollView
              onContentSizeChange={(_width, height) => setSheetHeight(height)}
              scrollEnabled={scroll}
              style={styles.sheetScroll}
            >
              <View style={styles.grip} />
              {header}
              <View style={[styles.body, bodyStyle]}>{content}</View>
              {footerBlock}
            </ScrollView>
          ) : (
            <>
              {header}
              {scroll ? (
                <ScrollView contentContainerStyle={[styles.body, bodyStyle]}>
                  {content}
                </ScrollView>
              ) : (
                <View style={[styles.body, bodyStyle]}>{content}</View>
              )}
              {footerBlock}
            </>
          )}
        </View>
      </View>
    </View>
  );

  return <WebModalPortal visible={visible}>{modal}</WebModalPortal>;
}
