/**
 * Shared, platform-agnostic contract of {@link InlineMenu}: a menu drawn open
 * in place beside its trigger on web, and the phone menu sheet on a touch
 * surface and on native. Both platform builds (`InlineMenu.web.tsx`,
 * `InlineMenu.tsx`) implement `InlineMenuProps`.
 */
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import {
  DEFAULT_DROPDOWN_MAX_WIDTH,
  closeDropdownMenuEntries,
} from "../dropdown";
import type { DropdownHighlightVariant, DropdownListEntry } from "../dropdown";
import { dropdownContentWidthStyle } from "../dropdown/dropdownContentWidthStyle";

/** State handed to a menu `entries` factory. */
export type InlineMenuEntriesState = {
  /** Close the menu. */
  close: () => void;
};

/** Static menu rows, or a factory that can close the menu from a row press. */
export type InlineMenuEntries =
  | DropdownListEntry[]
  | ((state: InlineMenuEntriesState) => DropdownListEntry[]);

export type InlineMenuProps = {
  /**
   * Controlled active row. Omit it and the in-place menu opens on its first
   * enabled row, while the sheet opens without an active row.
   */
  activeId?: string | null;
  /** Web: the trigger edge that the menu lines up with. Default `"start"`. */
  align?: "end" | "start";
  /** The trigger. The menu draws next to it and leaves it out of outside presses. */
  children: ReactNode;
  /** Close after a selectable row runs. Defaults to `true`. */
  closeOnSelect?: boolean;
  /** Accessible name of the sheet's close control. */
  dismissLabel?: string;
  /** Rows of the menu, or a factory given `{ close }`. */
  entries: InlineMenuEntries;
  /** How the active row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  /** Accessible name of the menu, and the default sheet title. */
  label: string;
  /** Height of the row list before it scrolls. The in-place menu defaults to 320. */
  maxHeight?: number;
  /** Web: widest the in-place menu grows to fit its rows. Default 360. */
  maxWidth?: number;
  /** Web: narrowest the in-place menu gets. Default 180. */
  minWidth?: number;
  /** Notified when the active row changes. */
  onActiveIdChange?: (id: string | null) => void;
  /** Escape, an outside press, a backdrop press, the close control, or a row. */
  onClose: () => void;
  /** Controlled open state. */
  open: boolean;
  /** Web: draw the menu above or below the trigger. Default `"below"`. */
  side?: "above" | "below";
  /** Row size, for example `"xs"` for 26px rows. A sheet uses touch rows. */
  size?: ControlSize;
  /** Style of the wrapper around the trigger and the in-place menu. */
  style?: StyleProp<ViewStyle>;
  /** Web: style merged onto the in-place menu surface. */
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visible sheet title when it should differ from `label`. */
  title?: string;
  /** Web: a fixed width for the in-place menu, in place of the content width. */
  width?: number;
};

/** Gap between the trigger and the in-place menu, in px. */
const INLINE_MENU_GAP = 4;

/** Narrowest default width of the in-place menu, in px. */
const INLINE_MENU_MIN_WIDTH = 180;

/**
 * Places the in-place menu against its trigger wrapper: below or above it, and
 * lined up with its start or end edge. It needs no measurement, so static and
 * server-rendered HTML draws the menu where the caller puts it.
 */
export function inlineMenuPlacementStyle(
  side: "above" | "below",
  align: "end" | "start",
): ViewStyle {
  return {
    ...(side === "above"
      ? { bottom: "100%", marginBottom: INLINE_MENU_GAP }
      : { marginTop: INLINE_MENU_GAP, top: "100%" }),
    ...(align === "end" ? { right: 0 } : { left: 0 }),
  };
}

/** A fixed width, or the content width between the menu's bounds. */
export function inlineMenuWidthStyle(options: {
  maxWidth?: number;
  minWidth?: number;
  width?: number;
}): ViewStyle {
  if (options.width !== undefined) {
    return { width: options.width };
  }
  return dropdownContentWidthStyle({
    maxWidth: options.maxWidth ?? DEFAULT_DROPDOWN_MAX_WIDTH,
    minWidth: options.minWidth ?? INLINE_MENU_MIN_WIDTH,
  });
}

/**
 * Resolves the menu rows and wraps each selectable row so that it closes the
 * menu after it runs, unless `closeOnSelect` is `false`.
 */
export function useInlineMenuEntries(
  entries: InlineMenuEntries,
  onClose: () => void,
  closeOnSelect = true,
): DropdownListEntry[] {
  const rawEntries =
    typeof entries === "function" ? entries({ close: onClose }) : entries;
  return useMemo(
    () => closeDropdownMenuEntries(rawEntries, onClose, closeOnSelect),
    [closeOnSelect, onClose, rawEntries],
  );
}
