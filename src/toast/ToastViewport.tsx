/** Native toast region: an absolutely-positioned overlay within the provider. */
import { View } from "react-native";

import { Toast } from "./Toast";
import { ToastLiveRegion } from "./ToastLiveRegion";
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

/**
 * On native there is no DOM portal, so the region is an absolutely-positioned
 * overlay rendered in the provider's tree. Keep the {@link ToastProvider} near
 * the app root so the overlay covers the screen. The region is
 * `pointerEvents="box-none"` so only the toasts catch touches; everything
 * behind them stays interactive. A toast can still sit beneath a native
 * `Modal`, which renders in its own window — show critical confirmations
 * before opening such a modal.
 */
export function ToastViewport({
  placement,
  toasts,
  onDismiss,
}: ToastViewportProps) {
  // The live region stays mounted even when the stack is empty so toast text is
  // injected into an already-existing region (WCAG 2.1 — 4.1.3, AA). On native
  // it drives `AccessibilityInfo` announcements via `accessibilityLiveRegion`.
  return (
    <>
      <ToastLiveRegion toasts={toasts} />
      {toasts.length > 0 ? (
        <View
          pointerEvents="box-none"
          style={{
            alignItems: toastStackAlign(placement),
            flexDirection: toastStackDirection(placement),
            gap: 12,
            position: "absolute",
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
}
