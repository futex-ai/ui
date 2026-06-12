/** Portal-backed modal frame for Expo web surfaces. */
import { X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusTimer = setTimeout(() => {
      const focusTarget =
        initialFocusTargetRef.current?.current ??
        (showCloseButtonRef.current
          ? closeButtonRef.current
          : surfaceRef.current);
      focusWebModalElement(focusTarget);
    }, 0);
    return () => {
      clearTimeout(focusTimer);
      focusWebModalElement(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!webModalEventTargetsSurface(event, surfaceRef)) {
          return;
        }
        event.preventDefault();
        requestClose("escape");
        return;
      }
      if (event.key === "Tab") {
        if (!webModalEventTargetsSurface(event, surfaceRef)) {
          return;
        }
        trapWebModalFocus(event, surfaceRef);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [requestClose, visible]);

  if (!visible || typeof document === "undefined") {
    return null;
  }

  const content = body ?? children;
  const sheet = placement === "bottom-sheet";
  const modal = (
    <View style={styles.layer} pointerEvents="box-none">
      <Pressable
        accessibilityLabel={closeLabel ?? `Close ${title}`}
        disabled={closeDisabled || !dismissible}
        onPress={() => requestClose("backdrop")}
        style={styles.backdrop}
      />
      <View
        pointerEvents="box-none"
        style={[styles.center, sheet ? styles.centerSheet : null]}
      >
        <View
          accessibilityLabel={title}
          accessibilityViewIsModal
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
              <Text style={[styles.title, titleStyle]}>{title}</Text>
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
                onPress={() => requestClose("closeButton")}
                ref={closeButtonRef}
                style={[
                  styles.closeButton,
                  closeDisabled ? styles.disabled : null,
                ]}
              >
                <X color={theme.colors.muted} size={18} />
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

function webModalEventTargetsSurface(
  event: KeyboardEvent,
  surfaceRef: RefObject<View | null>,
): boolean {
  const surface = webModalSurfaceElement(surfaceRef);
  return (
    surface !== null &&
    event.target instanceof Node &&
    surface.contains(event.target)
  );
}

function focusWebModalElement(target: Focusable | null | undefined): void {
  target?.focus?.();
}
