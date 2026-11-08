/**
 * The phone menu sheet drawn open in place, for static and server-rendered
 * HTML: a backdrop, the sheet with its grip, title, and close control, and the
 * menu rows at the touch size, with no active row. It has the anatomy and the
 * styles of the interactive web sheet, but no portal, focus trap, or scroll
 * lock, so it renders without scripts. It fills its nearest positioned
 * ancestor, such as a phone frame.
 *
 * It is a named dialog, but not a modal one: nothing keeps focus or the
 * pointer inside it, so it does not claim `aria-modal`. The interactive sheet
 * that `InlineMenu` and `ResponsiveMenu` open on a touch surface is the modal
 * one, with its focus trap and inert background.
 */
import { useId, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { DropdownList } from "../dropdown";
import type { DropdownHighlightVariant } from "../dropdown";
import { WEB_MODAL_LAYERS } from "../modal/modalLayers";
import { WebModalHeader } from "../modal/WebModalHeader";
import { createWebModalFrameStyles } from "../modal/webModalFrameStyles";
import { useSharedUiTheme } from "../theme";
import { TouchSurface } from "../touchSurface";

import { useInlineMenuEntries } from "./inlineMenuModel";
import type { InlineMenuEntries } from "./inlineMenuModel";

/** Height of the row list before it scrolls, in px. */
const INLINE_MENU_SHEET_MAX_HEIGHT = 480;

export type InlineMenuSheetProps = {
  /** Close after a selectable row runs. Defaults to `true`. */
  closeOnSelect?: boolean;
  /** Accessible name of the close control. Default `"Close {title}"`. */
  dismissLabel?: string;
  /** Rows of the menu, or a factory given `{ close }`. */
  entries: InlineMenuEntries;
  /** How the active row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  /** Accessible name of the menu, and the default title. */
  label: string;
  /** Height of the row list before it scrolls. Default 480. */
  maxHeight?: number;
  /** The close control, a backdrop press, Escape on the list, or a row. */
  onClose: () => void;
  /** The row size whose title weight the touch rows keep, such as `"xs"`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visible title when it should differ from `label`. */
  title?: string;
};

export function InlineMenuSheet({
  closeOnSelect,
  dismissLabel,
  entries,
  highlightVariant,
  label,
  maxHeight = INLINE_MENU_SHEET_MAX_HEIGHT,
  onClose,
  size,
  testID,
  title,
}: InlineMenuSheetProps) {
  const theme = useSharedUiTheme();
  const frame = useMemo(() => createWebModalFrameStyles(theme), [theme]);
  const titleId = useId();
  const listId = useId();
  // A sheet opens without an active row; the arrow keys still move it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const menuEntries = useInlineMenuEntries(entries, onClose, closeOnSelect);
  return (
    <TouchSurface>
      <View style={styles.layer} testID={testID}>
        {/* As in the interactive sheet, the backdrop is a pointer-only close
            target, out of the tab order and the accessibility tree. */}
        <Pressable
          aria-hidden
          focusable={false}
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          style={frame.backdrop}
          tabIndex={-1}
        />
        <View
          aria-label={label}
          role="dialog"
          style={[frame.surface, frame.surfaceSheet]}
        >
          <View style={frame.grip} />
          <WebModalHeader
            closeLabel={dismissLabel}
            onClose={onClose}
            styles={frame}
            title={title ?? label}
            titleId={titleId}
          />
          <View style={frame.body}>
            <DropdownList
              activeId={activeId}
              entries={menuEntries}
              focusMode="list"
              highlightVariant={highlightVariant}
              label={label}
              listId={listId}
              listRole="menu"
              maxHeight={maxHeight}
              onActiveIdChange={setActiveId}
              onClose={onClose}
              size={size}
            />
          </View>
        </View>
      </View>
    </TouchSurface>
  );
}

const styles = StyleSheet.create({
  layer: {
    bottom: 0,
    justifyContent: "flex-end",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: WEB_MODAL_LAYERS.portal,
  },
});
