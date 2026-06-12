import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

type NodeLike = { contains: (target: EventTarget | null) => boolean };

/**
 * Web-only: calls `onClose` when a pointer-down lands outside the returned ref's
 * element (so clicking away from an open calendar dismisses it). Returns the ref
 * to attach to the field root. Native platforms present the picker in a modal
 * with its own backdrop, so this is a no-op there.
 */
export function useOutsideClose(active: boolean, onClose: () => void) {
  const ref = useRef<View>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (Platform.OS !== "web" || !active) {
      return;
    }
    const node = ref.current as unknown as NodeLike | null;
    const handlePointerDown = (event: Event) => {
      if (node && !node.contains(event.target)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [active]);
  return ref;
}
