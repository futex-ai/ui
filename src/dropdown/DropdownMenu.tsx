/** Ergonomic trigger-backed dropdown menu built from portal and list primitives. */
import {
  cloneElement,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { DropdownList } from "./DropdownList";
import type { DropdownListEntry } from "./DropdownList";
import { DropdownPortal } from "./DropdownPortal";
import type { DropdownPlacementOptions } from "./dropdownGeometry";
import {
  closeDropdownMenuEntries,
  dropdownMenuTriggerProps,
  resolveDropdownMenuOpen,
} from "./dropdownMenuModel";
import type {
  DropdownMenuTriggerKeyEvent,
  DropdownMenuTriggerProps,
} from "./dropdownMenuModel";
import { useDropdownSelectorNavigation } from "./useDropdownSelectorNavigation";
import type { DropdownHoverProps } from "./useDropdownHover";

/** State exposed to menu entry factories. */
export type DropdownMenuEntriesState = {
  /** Close the menu. */
  close: () => void;
  /** Current open state. */
  open: boolean;
  /** Toggle the menu open or closed. */
  toggle: () => void;
};

/** Static menu rows or a factory that can close/toggle the menu. */
export type DropdownMenuEntries =
  | DropdownListEntry[]
  | ((state: DropdownMenuEntriesState) => DropdownListEntry[]);

/** State handed to the `trigger` render prop. */
export type DropdownMenuTriggerState = DropdownMenuEntriesState & {
  /** Props to spread onto the pressable trigger. */
  triggerProps: DropdownMenuTriggerProps;
};

/** Child trigger element or render function. */
export type DropdownMenuTrigger =
  | ReactElement<DropdownMenuTriggerElementProps>
  | ((state: DropdownMenuTriggerState) => ReactNode);

/** Props for `DropdownMenu`. */
export type DropdownMenuProps = DropdownPlacementOptions & {
  /** Parent-owned keyboard active row id. */
  activeId?: string | null;
  /** Trigger element, or a render function for advanced state access. */
  children: DropdownMenuTrigger;
  /** Close automatically after selectable row presses. Defaults to true. */
  closeOnSelect?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Rows rendered in the menu list. */
  entries: DropdownMenuEntries;
  /** Content pinned below the scrollable row list. */
  footer?: ReactNode;
  /** Content pinned above the scrollable row list. */
  header?: ReactNode;
  /** Notified when the keyboard active row changes. */
  onActiveIdChange?: (id: string | null) => void;
  /** Notified whenever the menu wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Controls the open state. Omit to let the menu manage it internally. */
  open?: boolean;
  /** Optional search/control slot pinned above the header and rows. */
  search?: ReactNode;
  /** Style merged onto the measured trigger wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Hover props for web hover menus that bridge trigger and portal surface. */
  surfaceHoverProps?: DropdownHoverProps;
  /** z-index for the portal layer. Defaults to `DROPDOWN_LAYERS.portal`. */
  zIndex?: number;
};

/**
 * Renders a standard action menu with owned anchor measurement, open state,
 * trigger props, and a `DropdownList` surface. Use `DropdownPortal` and
 * `DropdownList` directly when a custom picker needs to own those pieces.
 */
export function DropdownMenu({
  activeId,
  align,
  children,
  closeOnSelect = true,
  defaultOpen = false,
  entries,
  footer,
  gutter,
  header,
  margin,
  maxHeight,
  minHeight,
  minWidth,
  onActiveIdChange,
  onOpenChange,
  open: openProp,
  search,
  style,
  surfaceHoverProps,
  zIndex,
}: DropdownMenuProps) {
  const anchorRef = useRef<View>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const { controlled, open } = resolveDropdownMenuOpen(
    openProp,
    uncontrolledOpen,
  );
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const menuState = useMemo(
    () => ({ close, open, toggle }),
    [close, open, toggle],
  );
  const rawEntries =
    typeof entries === "function" ? entries(menuState) : entries;
  const menuEntries = useMemo(
    () => closeDropdownMenuEntries(rawEntries, close, closeOnSelect),
    [close, closeOnSelect, rawEntries],
  );
  const {
    activeId: navigationActiveId,
    keyProps: navigationKeyProps,
    setActiveId: setNavigationActiveId,
  } = useDropdownSelectorNavigation({
    entries: menuEntries,
    interactive: hasSelectableDropdownMenuEntry(menuEntries),
    onClose: close,
    onOpen: () => setOpen(true),
    open,
    resetOnOpen: true,
  });
  const activeRowId = activeId === undefined ? navigationActiveId : activeId;
  const setActiveRowId = useCallback(
    (id: string | null) => {
      setNavigationActiveId(id);
      onActiveIdChange?.(id);
    },
    [onActiveIdChange, setNavigationActiveId],
  );
  const triggerProps = {
    ...dropdownMenuTriggerProps(open, toggle),
    ...navigationKeyProps,
  };

  return (
    <View ref={anchorRef} style={[styles.anchor, style]}>
      {dropdownMenuTriggerNode(children, menuState, triggerProps)}
      <DropdownPortal
        align={align}
        anchorRef={anchorRef}
        gutter={gutter}
        margin={margin}
        maxHeight={maxHeight}
        minHeight={minHeight}
        minWidth={minWidth}
        onClose={close}
        open={open}
        surfaceHoverProps={surfaceHoverProps}
        zIndex={zIndex}
      >
        {(placement) => (
          <DropdownList
            activeId={activeRowId}
            entries={menuEntries}
            footer={footer}
            header={header}
            maxHeight={placement.maxHeight}
            onActiveIdChange={setActiveRowId}
            onClose={close}
            search={search}
          />
        )}
      </DropdownPortal>
    </View>
  );
}

type DropdownMenuTriggerElementProps = {
  "aria-expanded"?: boolean;
  onKeyDown?: (event: DropdownMenuTriggerKeyEvent) => void;
  onPress?: (event: unknown) => void;
};

function dropdownMenuTriggerNode(
  trigger: DropdownMenuTrigger,
  state: DropdownMenuEntriesState,
  triggerProps: DropdownMenuTriggerProps,
) {
  if (typeof trigger === "function") {
    return trigger({ ...state, triggerProps });
  }
  if (!isValidElement<DropdownMenuTriggerElementProps>(trigger)) {
    return trigger;
  }
  const originalOnPress = trigger.props.onPress;
  const originalOnKeyDown = trigger.props.onKeyDown;
  return cloneElement(trigger, {
    ...triggerProps,
    onKeyDown: (event: DropdownMenuTriggerKeyEvent) => {
      originalOnKeyDown?.(event);
      triggerProps.onKeyDown?.(event);
    },
    onPress: (event: unknown) => {
      originalOnPress?.(event);
      triggerProps.onPress();
    },
  });
}

function hasSelectableDropdownMenuEntry(entries: DropdownListEntry[]): boolean {
  return entries.some(
    (entry) =>
      (entry.type === "item" || entry.type === "footer") && !entry.disabled,
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
});
