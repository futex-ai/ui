/**
 * The title row of the web modal frame: the title, an optional subtitle, the
 * caller's header actions, and the close button. The frame and the in-place
 * menu sheet share it, so both draw the same header.
 */
import type { ReactNode, Ref } from "react";
import { Text, View } from "../primitives/reactNative";
import type {
  StyleProp,
  TextStyle,
  ViewStyle,
} from "../primitives/reactNative";

import type { FocusIndicator } from "../focusRing";
import { useTouchSurface } from "../touchSurface";

import type { WebModalFrameStyles } from "./webModalFrameStyles";
import { WebModalHeaderControls } from "./WebModalHeaderControls";

export type WebModalHeaderProps = {
  /** The close button, which the default initial focus of a dialog skips. */
  closeButtonRef?: Ref<View>;
  closeDisabled?: boolean;
  closeLabel?: string;
  focusIndicator?: FocusIndicator;
  /** Controls drawn before the close button, such as `WebModalHeaderButton`s. */
  headerActions?: ReactNode;
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
  headerActions,
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
  const touch = useTouchSurface();
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
      <WebModalHeaderControls
        closeButtonRef={closeButtonRef}
        closeDisabled={closeDisabled}
        closeLabel={closeLabel ?? `Close ${title}`}
        focusIndicator={focusIndicator}
        headerActions={headerActions}
        onClose={onClose}
        showCloseButton={showCloseButton}
      />
    </View>
  );
}
