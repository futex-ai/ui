/** DOM-portalled toast region for React Native Web surfaces. */
import { createPortal } from "react-dom";
import { View } from "react-native";
import type { ViewStyle } from "react-native";

import { Toast } from "./Toast";
import { ToastLiveRegion } from "./ToastLiveRegion";
import { TOAST_LAYERS } from "./toastLayers";
import {
  toastStackAlign,
  toastStackDirection,
  toastViewportInset,
} from "./toastModel";
import type { ToastItem, ToastPlacement } from "./toastModel";

export type ToastViewportProps = {
  placement: ToastPlacement;
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

// `position: fixed` so the region tracks the viewport rather than the scrolled
// document, matching the web modal layer.
const fixedPosition = "fixed" as unknown as ViewStyle["position"];

/**
 * Renders the toast stack through a `document.body` portal so it escapes React
 * Native Web stacking contexts and floats above modals and page chrome. The
 * region is `pointerEvents="box-none"` so only the toasts themselves catch
 * pointer events while the rest of the page stays interactive.
 */
export function ToastViewport({
  placement,
  toasts,
  onDismiss,
}: ToastViewportProps) {
  if (typeof document === "undefined") {
    return null;
  }

  // The live region is portalled even when the stack is empty so it is a
  // persistent, initially-empty region — screen readers announce text injected
  // into an existing region far more reliably than a region born with content
  // (WCAG 2.1 — 4.1.3 Status Messages, AA).
  const region = (
    <>
      <ToastLiveRegion toasts={toasts} />
      {toasts.length > 0 ? (
        <View
          aria-label="Notifications"
          pointerEvents="box-none"
          role="region"
          style={{
            alignItems: toastStackAlign(placement),
            flexDirection: toastStackDirection(placement),
            gap: 12,
            position: fixedPosition,
            zIndex: TOAST_LAYERS.viewport,
            ...toastViewportInset(placement),
          }}
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} onDismiss={onDismiss} toast={toast} />
          ))}
        </View>
      ) : null}
    </>
  );

  return createPortal(region, document.body);
}
