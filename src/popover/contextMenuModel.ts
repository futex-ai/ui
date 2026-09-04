/**
 * Shared contract and gesture plumbing for {@link ContextMenu} — a menu opened
 * by a secondary gesture and positioned at the point of that gesture rather
 * than against a trigger element.
 *
 * Pure on purpose: no JSX and no `react-native` runtime import, so `node --test`
 * can load it directly (importing `react-native` here would make esbuild try to
 * transform RN's Flow source and fail the whole test file).
 */
import type { DropdownListEntry, DropdownPoint } from "../dropdown";

export type ContextMenuProps = {
  /** Accessible name for the menu surface; the native sheet's default title. */
  accessibilityLabel: string;
  entries: DropdownListEntry[];
  /** Body cap. Defaults to 320. */
  maxHeight?: number;
  /**
   * Web surface minimum width. Defaults to 220. A point anchor has zero width,
   * so without this the resolved surface width would be 0.
   */
  minWidth?: number;
  onClose: () => void;
  open: boolean;
  /**
   * Viewport coordinates of the gesture. Ignored on native, where the menu is a
   * bottom sheet with no anchor. The menu stays closed while this is `null`.
   */
  point: DropdownPoint | null;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Visible native sheet title, when it should differ from the label. */
  title?: string;
  zIndex?: number;
};

/**
 * Reads the viewport point from a synthetic or native pointer event.
 *
 * react-native-web sometimes carries the DOM fields at the top level and
 * sometimes only under `nativeEvent`, so both are read — the same defensive
 * shape as `pointFromEvent` in `useDataGridDrag`. A native long-press reports
 * `pageX` / `pageY` instead, which is the closest native equivalent.
 */
export function contextMenuPoint(rawEvent: unknown): DropdownPoint | null {
  // A gesture handler can be invoked with no event at all (and RN's own press
  // handlers are typed loosely enough that callers do it), so this must not
  // throw on `undefined` — the caller treats a null point as "do not open".
  if (rawEvent == null || typeof rawEvent !== "object") {
    return null;
  }
  const event = rawEvent as {
    clientX?: number;
    clientY?: number;
    nativeEvent?: {
      clientX?: number;
      clientY?: number;
      pageX?: number;
      pageY?: number;
    };
  };
  const x =
    event.clientX ?? event.nativeEvent?.clientX ?? event.nativeEvent?.pageX;
  const y =
    event.clientY ?? event.nativeEvent?.clientY ?? event.nativeEvent?.pageY;
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

type ContextMenuTriggerOptions = {
  isWeb: boolean;
  onOpen: (point: DropdownPoint | null) => void;
};

/**
 * Gesture props that open a context menu: right-click on web (suppressing the
 * browser's own menu), long-press on native.
 *
 * Neither branch wires `onPress`, so a plain tap or click is always left to the
 * host's own handler — matching the `contextMenu` trigger contract that
 * {@link resolveDropdownMenuTriggerProps} already established.
 */
export function contextMenuTriggerProps({
  isWeb,
  onOpen,
}: ContextMenuTriggerOptions): Record<string, unknown> {
  return isWeb
    ? {
        onContextMenu: (event: unknown) => {
          (event as { preventDefault?: () => void }).preventDefault?.();
          onOpen(contextMenuPoint(event));
        },
      }
    : {
        onLongPress: (event: unknown) => onOpen(contextMenuPoint(event)),
      };
}
