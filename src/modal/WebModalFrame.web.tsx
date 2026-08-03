/** Portal-backed modal frame for Expo web surfaces. */
import { X } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { ViewStyle } from "react-native";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import { createWebModalFrameStyles } from "./webModalFrameStyles";
import { WebModalPortal } from "./WebModalPortal";
import { webModalCanClose, webModalMaxWidth } from "./webModalModel";
import type { WebModalCloseSource } from "./webModalModel";
import type { Focusable, WebModalFrameProps } from "./types";

type ClosePolicyRef = {
  closeDisabled: boolean;
  dismissible: boolean;
};

const WEB_MODAL_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

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
  disableFocusRing = false,
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
  const closeRing = useFocusRing({ disabled: disableFocusRing });
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
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const surfaceRef = useRef<View>(null);
  closePolicyRef.current = { closeDisabled, dismissible };
  initialFocusTargetRef.current = initialFocusRef;
  onCloseRef.current = onClose;
  const requestClose = useCallback((source: WebModalCloseSource) => {
    if (webModalCanClose(closePolicyRef.current, source)) {
      onCloseRef.current();
    }
  }, []);

  // RNW does not emit `inert`/`aria-hidden` for `accessibilityViewIsModal`, so
  // the background stays in the AT tree and tab order. Imperatively mark every
  // sibling of the modal's portal root inert while the modal is open, then
  // restore each node's prior state on close. `inert` also removes the
  // background from sequential focus, reinforcing the JS focus trap below.
  //
  // This effect is declared *before* the focus-restore effect on purpose: React
  // runs cleanups in declaration order, so the background is un-inerted here
  // first, before the focus effect's cleanup tries to restore focus to a
  // previously-focused background element (focusing an `inert` node is a no-op).
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    // Capture the trigger element here, before `inert` is applied below — marking
    // its container inert blurs it to `<body>`, so we must snapshot it first so
    // focus can be restored to it on close.
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const surface = surfaceRef.current as unknown;
    const root =
      surface instanceof HTMLElement ? webModalPortalRoot(surface) : null;
    const body = document.body;
    const siblings = Array.from(body.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== root,
    );
    const restorers = siblings.map((node) => {
      const hadInert = node.hasAttribute("inert");
      const prevAriaHidden = node.getAttribute("aria-hidden");
      node.setAttribute("inert", "");
      node.setAttribute("aria-hidden", "true");
      return () => {
        if (!hadInert) {
          node.removeAttribute("inert");
        }
        if (prevAriaHidden === null) {
          node.removeAttribute("aria-hidden");
        } else {
          node.setAttribute("aria-hidden", prevAriaHidden);
        }
      };
    });
    return () => {
      for (const restore of restorers) {
        restore();
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    // The trigger to restore on close is captured by the inertness effect above
    // (which runs first, before `inert` blurs it). The portal children are
    // committed before this effect runs, so the DOM is queryable and focus can
    // move into the surface synchronously (no `setTimeout(0)` race).
    focusWebModalElement(
      initialFocusTargetRef.current?.current ??
        webModalInitialFocusTarget(surfaceRef, closeButtonRef),
    );
    return () => {
      focusWebModalElement(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [visible]);

  // Escape goes through the shared escape-layer stack rather than this modal's
  // own keydown listener, so a dropdown, popover, or nested modal opened above
  // this surface consumes Escape first and this modal stays open. Only the
  // top-most layer closes; see escapeLayer.ts.
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    const layer = { onEscape: () => requestClose("escape") };
    pushEscapeLayer(layer);
    return () => {
      removeEscapeLayer(layer);
    };
  }, [requestClose, visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      // Trap on every Tab while the modal is visible — not only when focus is
      // already inside the surface — so focus that escaped to <body> (e.g. after
      // a click on the inert backdrop) is pulled back in on the next Tab. The
      // trap helper already handles the focus-outside case.
      if (event.key === "Tab") {
        trapWebModalFocus(event, surfaceRef);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
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
          accessibilityLabel={closeLabel ?? `Close ${title}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: closeDisabled }}
          disabled={closeDisabled}
          onBlur={closeRing.onBlur}
          onFocus={closeRing.onFocus}
          onPress={() => requestClose("closeButton")}
          ref={closeButtonRef}
          style={[
            styles.closeButton,
            closeDisabled ? styles.disabled : null,
            closeRing.focused ? closeRing.focusRingStyle : null,
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

  return <WebModalPortal visible={visible}>{modal}</WebModalPortal>;
}

/**
 * Where focus lands when a modal opens, absent an explicit `initialFocusRef`:
 * the first control the *caller* rendered — the form field, or the footer's
 * action button when the body holds nothing focusable. The close button is
 * skipped even though it comes first in DOM order, because opening a dialog
 * with "dismiss" preselected is a poor landing spot: it is the least likely
 * thing the user came to do, and a reflexive Enter throws the dialog away.
 *
 * Tab order itself needs no rework. A focus trap is a cycle, so starting on the
 * caller's first control already yields `field → … → action → close → field`:
 * the close button is the last stop on the way round, and Shift+Tab from the
 * landing element reaches it immediately.
 *
 * Falls back to the close button when the caller rendered nothing focusable at
 * all, then to the surface itself (`tabIndex={-1}`), so focus always enters the
 * dialog and screen readers announce it rather than being left on the trigger.
 */
function webModalInitialFocusTarget(
  surfaceRef: RefObject<View | null>,
  closeButtonRef: RefObject<View | null>,
): HTMLElement | null {
  const surface = webModalElement(surfaceRef);
  if (!surface) {
    return null;
  }
  // Null once `showCloseButton` is false — the Pressable is unmounted, so React
  // has cleared the ref and every focusable below is already caller content.
  const closeButton = webModalElement(closeButtonRef);
  const callerControl = webModalFocusableElements(surface).find(
    (element) => element !== closeButton,
  );
  return callerControl ?? closeButton ?? surface;
}

function trapWebModalFocus(
  event: KeyboardEvent,
  surfaceRef: RefObject<View | null>,
): void {
  const surface = webModalElement(surfaceRef);
  if (!surface) {
    return;
  }
  const focusable = webModalFocusableElements(surface);
  if (focusable.length === 0) {
    event.preventDefault();
    focusWebModalElement(surface);
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeElement = document.activeElement;
  const activeInside = activeElement ? surface.contains(activeElement) : false;
  if (event.shiftKey && (!activeInside || activeElement === first)) {
    event.preventDefault();
    focusWebModalElement(last);
    return;
  }
  if (!event.shiftKey && (!activeInside || activeElement === last)) {
    event.preventDefault();
    focusWebModalElement(first);
  }
}

function webModalFocusableElements(surface: HTMLElement): HTMLElement[] {
  return Array.from(
    surface.querySelectorAll<HTMLElement>(WEB_MODAL_FOCUSABLE_SELECTOR),
  ).filter(webModalElementIsFocusable);
}

function webModalElementIsFocusable(element: HTMLElement): boolean {
  const disabled = (element as HTMLElement & { disabled?: boolean }).disabled;
  if (disabled || element.getAttribute("aria-disabled") === "true") {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

/** RNW resolves a `View` ref to its host node; narrow it for DOM-only work. */
function webModalElement(ref: RefObject<View | null>): HTMLElement | null {
  const node = ref.current as unknown;
  return node instanceof HTMLElement ? node : null;
}

/**
 * The surface lives inside the portal subtree mounted on `document.body`. Walk
 * up from the surface to find the direct child of `body` that roots this modal,
 * so the background-inertness effect can skip it (and only it) when hiding the
 * rest of the page.
 */
function webModalPortalRoot(surface: HTMLElement): HTMLElement | null {
  const body = surface.ownerDocument.body;
  let node: HTMLElement | null = surface;
  while (node && node.parentElement !== body) {
    node = node.parentElement;
  }
  return node;
}

function focusWebModalElement(target: Focusable | null | undefined): void {
  target?.focus?.();
}
