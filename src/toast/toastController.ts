/** Module-level toast controller backed by the mounted provider. */
import type { ToastApi } from "./ToastContext";

type ToastApiEntry = {
  api: ToastApi;
  depth: number;
  order: number;
};

const toastApiEntries: ToastApiEntry[] = [];
let nextToastApiOrder = 0;

/**
 * Registers the provider's current API for module-level calls. The returned
 * cleanup removes only that provider API. Deeper providers win over ancestors,
 * and newer providers win among siblings.
 */
export function registerToastProviderApi(api: ToastApi, depth = 0): () => void {
  const entry = { api, depth, order: nextToastApiOrder };
  nextToastApiOrder += 1;
  toastApiEntries.push(entry);
  return () => {
    const index = toastApiEntries.lastIndexOf(entry);
    if (index >= 0) {
      toastApiEntries.splice(index, 1);
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
  const entry = activeToastApiEntry();
  if (!entry) {
    throw new Error(
      "toastController must be used after a <ToastProvider> has mounted.",
    );
  }
  return entry.api;
}

function activeToastApiEntry(): ToastApiEntry | undefined {
  return toastApiEntries.reduce<ToastApiEntry | undefined>((active, entry) => {
    if (!active) {
      return entry;
    }
    if (entry.depth > active.depth) {
      return entry;
    }
    if (entry.depth === active.depth && entry.order > active.order) {
      return entry;
    }
    return active;
  }, undefined);
}
