/**
 * Shared stack of open web dropdown surfaces, for nested outside-click.
 *
 * Every portal-backed overlay (selector, menu, combobox, popover) renders its
 * floating surface in its own `document.body` portal and closes on an outside
 * `pointerdown`. When one overlay is opened inside another — a selector inside a
 * popover, say — the inner surface is a DOM *sibling* of the outer one, not a
 * descendant, so a press on an inner option reads as "outside" the popover and
 * would dismiss it (losing the selection). This mirrors why {@link ../escapeLayer}
 * exists for Escape.
 *
 * Each open portal registers a layer here while it is mounted. An overlay treats
 * the surfaces of every layer opened *after* its own (its descendants, stacked
 * above it) as inside itself, so a press inside a descendant surface never
 * dismisses an ancestor overlay. Registration order matches nesting order: an
 * ancestor must be open before a descendant can be opened inside it.
 */

import type { DropdownNode } from "./dropdownOutsideClose";

/**
 * A registered open portal. `surface()` reads the portal's current floating
 * surface DOM node, or `null` before it mounts (the anchor measures for a frame
 * before the surface appears).
 */
export type DropdownDismissLayer = {
  surface: () => DropdownNode | null;
};

const layers: DropdownDismissLayer[] = [];

/** Registers a portal as the new top of the open-surface stack. */
export function pushDropdownDismissLayer(layer: DropdownDismissLayer): void {
  layers.push(layer);
}

/** Removes a previously pushed layer, wherever it now sits in the stack. */
export function removeDropdownDismissLayer(layer: DropdownDismissLayer): void {
  const index = layers.lastIndexOf(layer);
  if (index !== -1) {
    layers.splice(index, 1);
  }
}

/**
 * The mounted surfaces of every layer opened after `layer` — its descendants,
 * stacked above it. A press inside any of these is not an outside press for
 * `layer`, so the caller keeps the ancestor open. Layers whose surface has not
 * mounted yet are skipped. Returns an empty array for a top-most or unregistered
 * layer, so a lone dropdown behaves exactly as before.
 */
export function dropdownSurfacesAbove(
  layer: DropdownDismissLayer,
): DropdownNode[] {
  const index = layers.lastIndexOf(layer);
  if (index === -1) {
    return [];
  }
  const above: DropdownNode[] = [];
  for (let i = index + 1; i < layers.length; i += 1) {
    const node = layers[i].surface();
    if (node) {
      above.push(node);
    }
  }
  return above;
}
