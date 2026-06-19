/** Portal-backed modal frame for Expo web surfaces. */
import { X } from "lucide-react-native";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createWebModalFrameStyles } from "./webModalFrameStyles";
import { WebModalPortal } from "./WebModalPortal";
import { webModalCanClose, webModalMaxWidth } from "./webModalModel";
import type {
  WebModalCloseSource,
  WebModalPlacement,
  WebModalSize,
} from "./webModalModel";

export type WebModalFrameProps = {
  body?: ReactNode;
  children?: ReactNode;
  closeDisabled?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
  footer?: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  initialFocusRef?: RefObject<Focusable | null>;
  onClose: () => void;
  /** `center` (default) or `bottom-sheet` (pinned full-width to the bottom). */
  placement?: WebModalPlacement;
  scroll?: boolean;
  showCloseButton?: boolean;
  size?: WebModalSize;
  subtitleStyle?: StyleProp<TextStyle>;
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Header subtitle; a node so callers can embed inline links. */
  subtitle?: ReactNode;
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  visible?: boolean;
};

type Focusable = { focus?: () => void };
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
  initialFocusRef,
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
  const styles = useMemo(() => createWebModalFrameStyles(theme), [theme]);
  const titleId = useId();
  const closeRing = useFocusRing();
  const closeButtonRef = useRef<View>(null);
  const closePolicyRef = useRef<ClosePolicyRef>({
    closeDisabled,
    dismissible,
  });
  const initialFocusTargetRef = useRef(initialFocusRef);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const showCloseButtonRef = useRef(showCloseButton);
  const surfaceRef = useRef<View>(null);
  closePolicyRef.current = { closeDisabled, dismissible };
  initialFocusTargetRef.current = initialFocusRef;
  onCloseRef.current = onClose;
  showCloseButtonRef.current = showCloseButton;
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
    // committed before this effect runs, so the refs are populated and focus can
    // move into the surface synchronously (no `setTimeout(0)` race).
    const focusTarget =
      initialFocusTargetRef.current?.current ??
      (showCloseButtonRef.current
        ? closeButtonRef.current
        : surfaceRef.current);
    focusWebModalElement(focusTarget);
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

  if (!visible || typeof document === "undefined") {
    return null;
  }

  const content = body ?? children;
  const sheet = placement === "bottom-sheet";
  const modal = (
    <View style={styles.layer} pointerEvents="box-none">
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
            sheet ? styles.surfaceSheet : { maxWidth: webModalMaxWidth(size) },
            surfaceStyle,
          ]}
          tabIndex={-1}
        >
          {sheet ? <View style={styles.grip} /> : null}
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
          {scroll ? (
            <ScrollView contentContainerStyle={[styles.body, bodyStyle]}>
              {content}
            </ScrollView>
          ) : (
            <View style={[styles.body, bodyStyle]}>{content}</View>
          )}
          {footer ? (
            <View style={[styles.footer, footerStyle]}>{footer}</View>
          ) : null}
        </View>
      </View>
    </View>
  );

  return <WebModalPortal visible={visible}>{modal}</WebModalPortal>;
}

function trapWebModalFocus(
  event: KeyboardEvent,
  surfaceRef: RefObject<View | null>,
): void {
  const surface = webModalSurfaceElement(surfaceRef);
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

function webModalSurfaceElement(
  surfaceRef: RefObject<View | null>,
): HTMLElement | null {
  const surface = surfaceRef.current as unknown;
  return surface instanceof HTMLElement ? surface : null;
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
