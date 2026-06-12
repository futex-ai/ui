/** Hover-open state helpers for trigger-backed dropdown menus. */
import { useCallback, useEffect, useRef } from "react";

export type DropdownHoverProps = {
  onHoverIn: () => void;
  onHoverOut: () => void;
};

type DropdownHoverOptions = {
  closeDelayMs?: number;
  disabled?: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function useDropdownHover({
  closeDelayMs = 120,
  disabled = false,
  onClose,
  onOpen,
}: DropdownHoverOptions) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const handleHoverIn = useCallback(() => {
    if (disabled) {
      return;
    }
    clearCloseTimer();
    onOpen();
  }, [clearCloseTimer, disabled, onOpen]);

  const handleHoverOut = useCallback(() => {
    if (disabled) {
      return;
    }
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, closeDelayMs);
  }, [clearCloseTimer, closeDelayMs, disabled, onClose]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return {
    clearHoverClose: clearCloseTimer,
    surfaceHoverProps: { onHoverIn: handleHoverIn, onHoverOut: handleHoverOut },
    triggerHoverProps: { onHoverIn: handleHoverIn, onHoverOut: handleHoverOut },
  };
}
