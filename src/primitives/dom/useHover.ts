/**
 * Hover tracking for `Pressable`, ported from `react-native-web`'s `useHover`.
 *
 * Only a non-touch pointer hovers: a tap on a phone must not leave a control
 * looking hovered. Hover is also *contained* — entering a nested `Pressable`
 * dispatches a lock event that ends its ancestors' hover, and leaving restores
 * it — so a row and the button inside it never both look hovered.
 *
 * The four listeners are attached once per target, and the callbacks are read
 * from a ref when they fire. A caller that rebuilds `onHoverIn` / `onHoverOut`
 * on every render (`DropdownList` passes
 * `onHoverIn={entry.disabled ? undefined : onHover}`) would otherwise leave the
 * leave/lock listeners holding whichever closures existed when the pointer
 * entered.
 */
import { useEffect, useRef, type RefObject } from "react";

type HoverEvent = PointerEvent;

export type HoverConfig = {
  disabled?: boolean | null;
  onHoverChange: (hovered: boolean) => void;
  onHoverStart?: ((event: HoverEvent) => void) | null;
  onHoverEnd?: ((event: HoverEvent) => void) | null;
};

const LOCK_EVENT = "firna-ui:hover:lock";
const UNLOCK_EVENT = "firna-ui:hover:unlock";

function isTouch(event: PointerEvent): boolean {
  return event.pointerType === "touch";
}

export function useHover(
  targetRef: RefObject<HTMLElement | null>,
  config: HoverConfig,
): void {
  const configRef = useRef(config);
  configRef.current = config;
  const { disabled } = config;

  useEffect(() => {
    const target = targetRef.current;
    if (target == null || disabled === true) {
      return;
    }

    // The event that started the current hover, and the flag for whether one is
    // running: a lock from a nested pressable only matters while it is.
    let entered: HoverEvent | null = null;

    const hoverStart = (event: HoverEvent) => {
      configRef.current.onHoverStart?.(event);
      configRef.current.onHoverChange(true);
    };
    const hoverEnd = (event: HoverEvent) => {
      configRef.current.onHoverEnd?.(event);
      configRef.current.onHoverChange(false);
    };
    const dispatch = (type: string) => {
      target.dispatchEvent(new CustomEvent(type, { bubbles: true }));
    };

    const onEnter = (event: PointerEvent) => {
      if (isTouch(event) || entered != null) {
        return;
      }
      entered = event;
      dispatch(LOCK_EVENT);
      hoverStart(event);
    };
    const onLeave = (event: PointerEvent) => {
      if (isTouch(event) || entered == null) {
        return;
      }
      entered = null;
      dispatch(UNLOCK_EVENT);
      hoverEnd(event);
    };
    const onLock = (event: Event) => {
      if (entered != null && event.target !== target) {
        hoverEnd(entered);
      }
    };
    const onUnlock = (event: Event) => {
      if (entered != null && event.target !== target) {
        hoverStart(entered);
      }
    };

    target.addEventListener("pointerenter", onEnter);
    target.addEventListener("pointerleave", onLeave);
    target.addEventListener(LOCK_EVENT, onLock);
    target.addEventListener(UNLOCK_EVENT, onUnlock);
    return () => {
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      target.removeEventListener(LOCK_EVENT, onLock);
      target.removeEventListener(UNLOCK_EVENT, onUnlock);
    };
  }, [disabled, targetRef]);
}
