/** Module-level toast controller backed by the mounted provider. */
import type { ToastApi } from "./ToastContext";

let currentToastApi: ToastApi | null = null;

/**
 * Registers the provider's current API for module-level calls. The returned
 * cleanup only clears the active API when it is still the same provider API,
 * which keeps nested or remounted providers from unregistering each other.
 */
export function registerToastProviderApi(api: ToastApi): () => void {
  currentToastApi = api;
  return () => {
    if (currentToastApi === api) {
      currentToastApi = null;
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
  if (currentToastApi === null) {
    throw new Error(
      "toastController must be used after a <ToastProvider> has mounted.",
    );
  }
  return currentToastApi;
}
