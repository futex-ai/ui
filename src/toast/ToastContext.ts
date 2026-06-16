/** React context and hook for the toast notification system. */
import { createContext, useContext } from "react";

import type { ToastOptions } from "./toastModel";

/** The imperative API exposed to consumers through {@link useToast}. */
export type ToastApi = {
  /** Shows a toast and returns its id (usable with {@link ToastApi.dismiss}). */
  toast: (options: ToastOptions) => string;
  /** Dismisses a single toast by id. A no-op if it is already gone. */
  dismiss: (id: string) => void;
  /** Dismisses every visible toast. */
  dismissAll: () => void;
};

/**
 * `null` until a {@link ToastProvider} mounts above the consumer, so
 * {@link useToast} can throw a clear error instead of silently no-op'ing.
 */
export const ToastContext = createContext<ToastApi | null>(null);

/**
 * Returns the toast API published by the nearest {@link ToastProvider}. Throws
 * when no provider is mounted above the caller, which is always a wiring bug.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return api;
}
