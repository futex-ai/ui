/**
 * Native build of {@link InlineMenu}: the trigger, and the phone menu sheet
 * while the menu is open. Native has no in-place drawing, so the web-only
 * placement props (`side`, `align`, `width`, `minWidth`, `maxWidth`,
 * `surfaceStyle`) are ignored here. The sheet uses touch rows and a 44px
 * close control, and Android back closes it.
 */
import { StyleSheet, View } from "../primitives/reactNative";

import { MenuSheet } from "./MenuSheet";
import { useInlineMenuEntries } from "./inlineMenuModel";
import type { InlineMenuProps } from "./inlineMenuModel";

export function InlineMenu({
  activeId,
  children,
  closeOnSelect,
  dismissLabel,
  entries,
  highlightVariant,
  label,
  maxHeight,
  onActiveIdChange,
  onClose,
  open,
  size,
  style,
  testID,
  title,
}: InlineMenuProps) {
  const menuEntries = useInlineMenuEntries(entries, onClose, closeOnSelect);
  return (
    <View style={[styles.anchor, style]} testID={testID}>
      {children}
      <MenuSheet
        activeId={activeId}
        dismissLabel={dismissLabel}
        entries={menuEntries}
        highlightVariant={highlightVariant}
        label={label}
        maxHeight={maxHeight}
        onActiveIdChange={onActiveIdChange}
        onClose={onClose}
        open={open}
        size={size}
        title={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
});
