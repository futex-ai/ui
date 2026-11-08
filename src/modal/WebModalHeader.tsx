/**
 * The title row of the web modal frame: the title, an optional subtitle, and
 * the close button. The frame and the in-place menu sheet share it, so both
 * draw the same header. Inside a `TouchSurface` the close button is a 44 by
 * 44px target.
 */
import type { ReactNode, Ref } from "react";
import { X } from "../primitives/icons";
import { Pressable, Text, View } from "../primitives/reactNative";
import type {
  StyleProp,
  TextStyle,
  ViewStyle,
} from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import type { FocusIndicator } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useTouchSurface } from "../touchSurface";

import type { WebModalFrameStyles } from "./webModalFrameStyles";

export type WebModalHeaderProps = {
  /** The close button, which the default initial focus of a dialog skips. */
  closeButtonRef?: Ref<View>;
  closeDisabled?: boolean;
  closeLabel?: string;
  focusIndicator?: FocusIndicator;
  headerStyle?: StyleProp<ViewStyle>;
  /** Runs when the close button is pressed. */
  onClose: () => void;
  showCloseButton?: boolean;
  styles: WebModalFrameStyles;
  subtitle?: ReactNode;
  subtitleStyle?: StyleProp<TextStyle>;
  title: string;
  /** DOM id of the title, which names the dialog. */
  titleId: string;
  titleStyle?: StyleProp<TextStyle>;
};

export function WebModalHeader({
  closeButtonRef,
  closeDisabled = false,
  closeLabel,
  focusIndicator,
  headerStyle,
  onClose,
  showCloseButton = true,
  styles,
  subtitle,
  subtitleStyle,
  title,
  titleId,
  titleStyle,
}: WebModalHeaderProps) {
  const theme = useSharedUiTheme();
  const touch = useTouchSurface();
  const closeRing = useFocusRing({ indicator: focusIndicator });
  return (
    <View
      style={[styles.header, touch ? styles.headerTouch : null, headerStyle]}
    >
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
          onPress={onClose}
          ref={closeButtonRef}
          style={[
            styles.closeButton,
            touch ? styles.closeButtonTouch : null,
            closeDisabled ? styles.disabled : null,
            closeRing.focusRingVariables,
          ]}
        >
          <X aria-hidden color={theme.colors.ink2} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}
