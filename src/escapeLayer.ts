/**
 * Shared Escape-dismiss layer stack for overlay surfaces.
 *
 * Modals, dropdowns, popovers, and comboboxes each register a layer while they
 * are open. A single document-level `keydown` capture listener routes Escape to
 * the top-most (most recently opened) layer only, then swallows the event. So a
 * dropdown opened inside a modal closes itself on Escape while the modal beneath
 * it — which holds a layer of its own — stays open.
 *
 * This is needed because the modal and the dropdown both listen for Escape on
 * `document` in the capture phase. Listeners on the same node fire in
 * registration order, and the modal (mounted first) fires first, so the
 * dropdown's `stopPropagation()` cannot stop it — `stopPropagation` never blocks
 * same-node listeners, and `stopImmediatePropagation` would be too late. Routing
 * Escape through one shared listener that consults a stack makes "only the
 * top-most overlay closes" hold regardless of registration order.
 *
 * Contract: while any layer is open the shared listener consumes Escape
 * (`preventDefault` + `stopImmediatePropagation`), so document/window-level
 * Escape handlers in the host app do not also fire. An open overlay owns Escape.
 */

export type EscapeLayer = {
  /** Invoked when Escape fires while this layer is the top of the stack. */
  onEscape: () => void;
};

const layers: EscapeLayer[] = [];
let listening = false;

/** Registers a layer as the new top of the stack. */
export function pushEscapeLayer(layer: EscapeLayer): void {
  layers.push(layer);
  startListening();
}

/** Removes a previously pushed layer, wherever it now sits in the stack. */
export function removeEscapeLayer(layer: EscapeLayer): void {
  const index = layers.lastIndexOf(layer);
  if (index !== -1) {
    layers.splice(index, 1);
  }
  if (layers.length === 0) {
    stopListening();
  }
}

/** The most recently pushed layer still on the stack, or `null` when empty. */
export function topEscapeLayer(): EscapeLayer | null {
  return layers.length > 0 ? layers[layers.length - 1] : null;
}

/**
 * Routes a single Escape press to the top layer. Returns `true` when a layer
 * was present (and so handled it), letting the caller swallow the native event.
 */
export function dispatchEscape(): boolean {
  const top = topEscapeLayer();
  if (!top) {
    return false;
  }
  top.onEscape();
  return true;
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }
  if (dispatchEscape()) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function startListening(): void {
  if (listening || typeof document === "undefined") {
    return;
  }
  document.addEventListener("keydown", handleKeyDown, true);
  listening = true;
}

function stopListening(): void {
  if (!listening || typeof document === "undefined") {
    return;
  }
  document.removeEventListener("keydown", handleKeyDown, true);
  listening = false;
}
