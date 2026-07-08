/** Shared open-state and row-close helpers for dropdown menus. */
import type { DropdownListEntry } from "./DropdownList";
import type { DropdownHoverProps } from "./useDropdownHover";

/** Keyboard event shape handled by dropdown menu triggers. */
export type DropdownMenuTriggerKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/**
 * How the child trigger opens the menu.
 *
 * - `press` (default, both platforms): tap/click opens. Unchanged behavior.
 * - `hover` (web): pointer hover opens; press still opens as the touch and
 *   keyboard fallback since hover does not exist there.
 * - `longPress` (both platforms): a press-and-hold opens; a plain tap is left
 *   to the trigger's own `onPress` so a row stays tappable.
 * - `contextMenu`: right-click opens on web (the browser menu is suppressed),
 *   long-press opens on native. A plain tap is left to the trigger.
 */
export type DropdownMenuTriggerMode =
  | "press"
  | "hover"
  | "longPress"
  | "contextMenu";

/**
 * Props to spread onto a dropdown menu trigger. Only `aria-expanded` is always
 * present; which handler is wired depends on the active {@link
 * DropdownMenuTriggerMode}.
 */
export type DropdownMenuTriggerProps = {
  /** Menu container DOM id, for `aria-controls` while open (WCAG 4.1.2). */
  "aria-controls"?: string;
  "aria-expanded": boolean;
  "aria-haspopup": "menu";
  onKeyDown?: (event: DropdownMenuTriggerKeyEvent) => boolean | void;
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onLongPress?: () => void;
  onContextMenu?: (event: { preventDefault?: () => void }) => void;
};

/** Subset of a trigger element's props that the menu composes with. */
export type DropdownMenuTriggerElementProps = {
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu";
  onPress?: (event: unknown) => void;
  onHoverIn?: (event: unknown) => void;
  onHoverOut?: (event: unknown) => void;
  onKeyDown?: (event: DropdownMenuTriggerKeyEvent) => void;
  onLongPress?: (event: unknown) => void;
  onContextMenu?: (event: { preventDefault?: () => void }) => void;
};

/** Options that tailor resolved trigger props to platform and hover wiring. */
export type DropdownMenuTriggerResolveOptions = {
  /** Whether the host is web. Defaults to true. */
  isWeb?: boolean;
  /** Hover handlers (from `useDropdownHover`) wired in `hover` mode. */
  hoverProps?: DropdownHoverProps;
};

/** Resolved controlled/uncontrolled open state for a dropdown menu. */
export type DropdownMenuOpenState = {
  controlled: boolean;
  open: boolean;
};

/** Resolve dropdown menu open state from the optional controlled prop. */
export function resolveDropdownMenuOpen(
  openProp: boolean | undefined,
  uncontrolledOpen: boolean,
): DropdownMenuOpenState {
  if (openProp === undefined) {
    return { controlled: false, open: uncontrolledOpen };
  }
  return { controlled: true, open: openProp };
}

/** Build trigger props that toggle the menu and expose expanded state. */
export function dropdownMenuTriggerProps(
  open: boolean,
  toggle: () => void,
): DropdownMenuTriggerProps {
  return {
    "aria-expanded": open,
    "aria-haspopup": "menu",
    onPress: toggle,
  };
}

/**
 * Build the trigger props for a given {@link DropdownMenuTriggerMode}. Each mode
 * wires only the handler it needs so a `longPress`/`contextMenu` trigger keeps
 * its own tap behavior, while `press`/`hover` open on press. `aria-expanded` is
 * always reported so assistive tech sees the open state in every mode.
 */
export function resolveDropdownMenuTriggerProps(
  open: boolean,
  toggle: () => void,
  mode: DropdownMenuTriggerMode,
  options: DropdownMenuTriggerResolveOptions = {},
): DropdownMenuTriggerProps {
  const { hoverProps, isWeb = true } = options;
  switch (mode) {
    case "hover": {
      // Press stays wired as the touch/keyboard fallback for hover menus.
      const props: DropdownMenuTriggerProps = {
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onPress: toggle,
      };
      if (hoverProps) {
        props.onHoverIn = hoverProps.onHoverIn;
        props.onHoverOut = hoverProps.onHoverOut;
      }
      return props;
    }
    case "longPress":
      return {
        "aria-expanded": open,
        "aria-haspopup": "menu",
        onLongPress: toggle,
      };
    case "contextMenu":
      return isWeb
        ? {
            "aria-expanded": open,
            "aria-haspopup": "menu",
            onContextMenu: (event) => {
              event?.preventDefault?.();
              toggle();
            },
          }
        : {
            "aria-expanded": open,
            "aria-haspopup": "menu",
            onLongPress: toggle,
          };
    case "press":
    default:
      return dropdownMenuTriggerProps(open, toggle);
  }
}

function composeTriggerHandler<E>(
  original: ((event: E) => void) | undefined,
  added: (event: E) => boolean | void,
): (event: E) => void {
  return (event: E) => {
    original?.(event);
    added(event);
  };
}

/**
 * Merge resolved trigger props onto a child trigger element's props, composing
 * each injected handler with the element's own handler of the same name so a
 * trigger keeps its existing behavior (e.g. hover styling or a row tap).
 */
export function mergeDropdownMenuTriggerProps(
  childProps: DropdownMenuTriggerElementProps,
  triggerProps: DropdownMenuTriggerProps,
): DropdownMenuTriggerElementProps {
  const merged: DropdownMenuTriggerElementProps = {
    ...childProps,
    "aria-controls": triggerProps["aria-controls"],
    "aria-expanded": triggerProps["aria-expanded"],
    "aria-haspopup": triggerProps["aria-haspopup"],
  };
  if (triggerProps.onPress) {
    merged.onPress = composeTriggerHandler(
      childProps.onPress,
      triggerProps.onPress,
    );
  }
  if (triggerProps.onHoverIn) {
    merged.onHoverIn = composeTriggerHandler(
      childProps.onHoverIn,
      triggerProps.onHoverIn,
    );
  }
  if (triggerProps.onHoverOut) {
    merged.onHoverOut = composeTriggerHandler(
      childProps.onHoverOut,
      triggerProps.onHoverOut,
    );
  }
  if (triggerProps.onKeyDown) {
    merged.onKeyDown = composeTriggerHandler(
      childProps.onKeyDown,
      triggerProps.onKeyDown,
    );
  }
  if (triggerProps.onLongPress) {
    merged.onLongPress = composeTriggerHandler(
      childProps.onLongPress,
      triggerProps.onLongPress,
    );
  }
  if (triggerProps.onContextMenu) {
    merged.onContextMenu = composeTriggerHandler(
      childProps.onContextMenu,
      triggerProps.onContextMenu,
    );
  }
  return merged;
}

/**
 * Combine the consumer-supplied portal `surfaceHoverProps` with the menu's own
 * hover bridge so both fire (consumer first) when a hover trigger auto-wires its
 * own bridge. Returns whichever side is defined when only one is present.
 */
export function mergeDropdownSurfaceHoverProps(
  consumer: DropdownHoverProps | undefined,
  internal: DropdownHoverProps | undefined,
): DropdownHoverProps | undefined {
  if (!consumer) {
    return internal;
  }
  if (!internal) {
    return consumer;
  }
  return {
    onHoverIn: () => {
      consumer.onHoverIn();
      internal.onHoverIn();
    },
    onHoverOut: () => {
      consumer.onHoverOut();
      internal.onHoverOut();
    },
  };
}

/** Wrap selectable row presses so common action menus close after selection. */
export function closeDropdownMenuEntries(
  entries: DropdownListEntry[],
  onClose: () => void,
  closeOnSelect: boolean,
): DropdownListEntry[] {
  if (!closeOnSelect) {
    return entries;
  }
  return entries.map((entry): DropdownListEntry => {
    if ((entry.type !== "item" && entry.type !== "footer") || entry.disabled) {
      return entry;
    }
    return {
      ...entry,
      onPress: () => {
        entry.onPress?.();
        onClose();
      },
    };
  });
}
