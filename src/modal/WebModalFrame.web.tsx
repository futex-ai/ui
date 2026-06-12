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
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const surfaceRef = useRef<View>(null);
  const requestClose = useCallback(
    (source: WebModalCloseSource) => {
      if (webModalCanClose({ closeDisabled, dismissible }, source)) {
        onClose();
      }
    },
    [closeDisabled, dismissible, onClose],
  );

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
        initialFocusRef?.current ??
        (showCloseButton ? closeButtonRef.current : surfaceRef.current);
      (focusTarget as Focusable | null)?.focus?.();
    }, 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose("escape");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [initialFocusRef, requestClose, showCloseButton, visible]);

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
