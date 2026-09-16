/**
 * `Modal`, as a portal into `document.body`.
 *
 * A fixed, inset-zero container with `role="dialog"` and `aria-modal`, closed
 * by Escape through `onRequestClose`. It does not trap focus: the library's own
 * web modal frames (`WebModalFrame.web.tsx`, the dropdown and sheet portals)
 * own that, and every caller of this primitive has a `.web` sibling, so on web
 * it is only here to keep the seam's two sides mirrored.
 */
import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { ModalComponent, ModalInstance, ModalProps } from "../types";

import { useHostRef } from "./hostRef";

const CONTAINER_STYLE = {
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  left: 0,
  position: "fixed",
  right: 0,
  top: 0,
  // The stacking level `react-native-web`'s own modal wrapper used, so a
  // consumer's fixed chrome cannot paint over the dialog.
  zIndex: 9999,
} as const;

export const Modal: ModalComponent = forwardRef<ModalInstance, ModalProps>(
  function Modal(props, forwardedRef) {
    const {
      children,
      onDismiss,
      onRequestClose,
      onShow,
      testID,
      transparent,
      visible = true,
    } = props;
    const hostRef = useRef<HTMLElement | null>(null);
    const setRef = useHostRef(hostRef, forwardedRef);

    // Held in a ref so a caller's new closure identity cannot re-announce a
    // modal that never moved.
    const lifecycle = useRef({ onDismiss, onShow });
    lifecycle.current = { onDismiss, onShow };
    useEffect(() => {
      if (!visible) {
        return;
      }
      lifecycle.current.onShow?.(undefined as never);
      return () => lifecycle.current.onDismiss?.();
    }, [visible]);

    useEffect(() => {
      if (!visible || onRequestClose == null) {
        return;
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onRequestClose();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [onRequestClose, visible]);

    if (!visible || typeof document === "undefined") {
      return null;
    }
    return createPortal(
      <div
        aria-label={props.accessibilityLabel ?? props["aria-label"]}
        aria-modal={true}
        data-testid={testID}
        ref={setRef}
        role="dialog"
        style={{
          ...CONTAINER_STYLE,
          backgroundColor: transparent === true ? "transparent" : "white",
        }}
      >
        {children}
      </div>,
      document.body,
    );
  },
);
Modal.displayName = "Modal";
