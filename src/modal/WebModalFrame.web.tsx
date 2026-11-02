/** Modal frame for Expo web surfaces, portalled into the shared modal root. */
import { X } from "../primitives/icons";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Pressable, ScrollView, Text, View } from "../primitives/reactNative";
import type { ViewStyle } from "../primitives/reactNative";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import { useWebModalLayer, WebModalLayerContext } from "./useWebModalLayer";
import { createWebModalFrameStyles } from "./webModalFrameStyles";
import { webModalCanClose, webModalMaxWidth } from "./webModalModel";
import type { WebModalCloseSource } from "./webModalModel";
import { getWebModalRoot } from "./webModalRoot";
import { topWebModalLayer } from "./webModalStack";
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
  body,
  children,
  closeDisabled = false,
  closeLabel,
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
  const layerRef = useRef<View>(null);
  const onCloseRef = useRef(onClose);
  const surfaceRef = useRef<View>(null);
  closePolicyRef.current = { closeDisabled, dismissible };
  onCloseRef.current = onClose;
  const requestClose = useCallback((source: WebModalCloseSource) => {
    if (webModalCanClose(closePolicyRef.current, source)) {
      onCloseRef.current();
    }
  }, []);

  // The shared web modal stack owns what used to be per-frame effects: page
  // and lower-dialog inertness, the single Tab trap, initial focus, and focus
  // restore on close. See webModalStack.ts.
  const layer = useWebModalLayer({
    closeButtonRef,
    initialFocusRef,
    layerRef,
    requestClose,
    surfaceRef,
    visible,
  });

  // Escape goes through the shared escape-layer stack rather than this modal's
  // own keydown listener, so a dropdown or popover opened above the top dialog
  // consumes Escape first. The layer closes the modal stack's top dialog, not
  // necessarily this frame: frames that open in one render commit push their
  // Escape layers nested frame first, so the top Escape layer can belong to
  // the dialog beneath. A passive effect, like the stack layer's, so the two
  // register and leave in the same effect phase.
  useEffect(() => {
    if (!visible) {
      return;
    }
    const escapeLayer = {
      onEscape: () => topWebModalLayer()?.requestClose("escape"),
    };
    pushEscapeLayer(escapeLayer);
    return () => {
      removeEscapeLayer(escapeLayer);
    };
  }, [visible]);

  // Re-measure from scratch on each open: drop the cached height when the sheet
  // closes so a reopen with different content sizes to it instead of animating
  // down from the previous session's height.
  useEffect(() => {
    if (!visible) {
      setSheetHeight(null);
    }
  }, [visible]);

  // The portal needs its container while rendering. `getWebModalRoot` appends
  // the shared root once, for the first open frame, and reuses it after.
  const root = visible ? getWebModalRoot() : null;
  if (!root) {
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
          accessibilityLabel={closeLabel ?? `Close ${title}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: closeDisabled }}
          disabled={closeDisabled}
          {...closeRing.focusRingProps}
          onBlur={closeRing.onBlur}
          onFocus={closeRing.onFocus}
          onPress={() => requestClose("closeButton")}
          ref={closeButtonRef}
          style={[
            styles.closeButton,
            closeDisabled ? styles.disabled : null,
            closeRing.focusRingVariables,
          ]}
        >
          <X aria-hidden color={theme.colors.ink2} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
  const footerBlock = footer ? (
    <View style={[styles.footer, footerStyle]}>{footer}</View>
  ) : null;
  const modal = (
    <View
      pointerEvents="box-none"
      ref={layerRef}
      style={styles.layer}
      testID={testID}
    >
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
          aria-labelledby={titleId}
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

  // The layer portals straight into the shared root, not through the public
  // `WebModalPortal`, which stays a `document.body` portal for page content.
  // The context links frames rendered in this dialog's content to its layer.
  return createPortal(
    <WebModalLayerContext.Provider value={layer}>
      {modal}
    </WebModalLayerContext.Provider>,
    root,
  );
}
