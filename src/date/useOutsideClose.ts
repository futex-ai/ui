import { useEffect, useRef } from "react";
import { Platform, View } from "../primitives/reactNative";

import { useOverlayInputOwner } from "../modal/useOverlayInputOwner";

type NodeLike = { contains: (target: EventTarget | null) => boolean };

/**
 * Web-only: calls `onClose` when a pointer-down lands outside the returned ref's
 * element (so clicking away from an open calendar dismisses it). Returns the ref
 * to attach to the field root. Native platforms present the picker in a modal
 * with its own backdrop, so this is a no-op there. A press inside a web dialog
 * above the field belongs to that dialog, so it does not close the calendar.
 */
export function useOutsideClose(active: boolean, onClose: () => void) {
  const ref = useRef<View>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const ownsInput = useOverlayInputOwner();
  useEffect(() => {
    if (Platform.OS !== "web" || !active) {
      return;
    }
    const node = ref.current as unknown as NodeLike | null;
    const handlePointerDown = (event: Event) => {
      if (ownsInput() && node && !node.contains(event.target)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [active, ownsInput]);
  return ref;
}
