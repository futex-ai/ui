/**
 * The controls at the end of the modal header row: the caller's
 * `headerActions`, then the Close button. The web and native frames share it,
 * so both platforms order and space the controls the same way. With no
 * actions it renders only the Close button, with no wrapper.
 */
import type { ReactNode, Ref } from "react";
import { X } from "../primitives/icons";
import { StyleSheet, View } from "../primitives/reactNative";

import type { FocusIndicator } from "../focusRing";

import { WebModalHeaderButton } from "./WebModalHeaderButton";

export type WebModalHeaderControlsProps = {
  closeButtonRef?: Ref<View>;
  closeDisabled: boolean;
  closeLabel: string;
  focusIndicator?: FocusIndicator;
  headerActions?: ReactNode;
  onClose: () => void;
  showCloseButton: boolean;
};

export function WebModalHeaderControls({
  closeButtonRef,
  closeDisabled,
  closeLabel,
  focusIndicator,
  headerActions,
  onClose,
  showCloseButton,
}: WebModalHeaderControlsProps) {
  const close = showCloseButton ? (
    <WebModalHeaderButton
      accessibilityLabel={closeLabel}
      buttonRef={closeButtonRef}
      disabled={closeDisabled}
      focusIndicator={focusIndicator}
      icon={X}
      onPress={onClose}
    />
  ) : null;
  if (!headerActions) {
    return close;
  }
  // The actions come first in DOM order, so Tab reaches them before Close.
  return (
    <View style={styles.controls}>
      <View style={styles.controls}>{headerActions}</View>
      {close}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { alignItems: "center", flexDirection: "row", gap: 4 },
});
