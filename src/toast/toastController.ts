/** Module-level toast controller backed by the mounted provider. */
import type { ToastApi } from "./ToastContext";

const toastApiStack: ToastApi[] = [];

/**
 * Registers the provider's current API for module-level calls. The returned
 * cleanup removes only that provider API, so nested or remounted providers
 * reveal the previously-mounted provider when they unmount.
 */
export function registerToastProviderApi(api: ToastApi): () => void {
  toastApiStack.push(api);
  return () => {
    const index = toastApiStack.lastIndexOf(api);
    if (index >= 0) {
      toastApiStack.splice(index, 1);
    }
  };
}

/** Imperative API for callers outside React components. */
export const toastController: ToastApi = {
  dismiss: (id) => activeToastApi().dismiss(id),
  dismissAll: () => activeToastApi().dismissAll(),
  toast: (options) => activeToastApi().toast(options),
};

function activeToastApi(): ToastApi {
  const api = toastApiStack.at(-1);
  if (!api) {
    throw new Error(
      "toastController must be used after a <ToastProvider> has mounted.",
    );
  }
  return api;
}
