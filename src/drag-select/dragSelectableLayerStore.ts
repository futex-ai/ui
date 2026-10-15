/**
 * The store of page-hook option layers for one provider. It keeps the layers
 * in the order of their keys, re-renders the provider only for a change that
 * can alter its render (a new non-function value, or a removed one), and
 * tells its subscribers about every change, function-only changes included.
 */
import {
  dragSelectableOptionsIdentical,
  dragSelectableOptionValuesEqual,
} from "./dragSelectableOptions";
import type { DragSelectableOptions } from "./dragSelectableOptionTypes";

/** The option layers of a provider. */
export type DragSelectableLayerStore = {
  /** The layers, ordered by key, the earliest first. */
  layers: () => DragSelectableOptions[];
  /** Removes the layer with this key. */
  remove: (order: number) => void;
  /** Adds or replaces the layer with this key. */
  set: (order: number, options: DragSelectableOptions) => void;
  /** Subscribes to every layer change; returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** A number that changes with every layer change. */
  version: () => number;
};

const noOptions: DragSelectableOptions = {};

/**
 * Creates a layer store. `onValueChange` runs when a change can alter the
 * provider's render; a new function identity alone does not count, because
 * the provider reads callbacks when it calls them. Subscribers hear about
 * every change, so the box layer can read new render functions.
 */
export function createDragSelectableLayerStore(
  onValueChange: () => void,
): DragSelectableLayerStore {
  const layers = new Map<number, DragSelectableOptions>();
  const listeners = new Set<() => void>();
  let version = 0;
  const changed = (
    previous: DragSelectableOptions,
    next: DragSelectableOptions,
  ) => {
    if (dragSelectableOptionsIdentical(previous, next)) {
      return;
    }
    version += 1;
    for (const listener of [...listeners]) {
      listener();
    }
    if (!dragSelectableOptionValuesEqual(previous, next)) {
      onValueChange();
    }
  };
  return {
    layers: () =>
      [...layers.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, options]) => options),
    remove: (order) => {
      const previous = layers.get(order);
      if (!previous) {
        return;
      }
      layers.delete(order);
      changed(previous, noOptions);
    },
    set: (order, options) => {
      const previous = layers.get(order) ?? noOptions;
      layers.set(order, options);
      changed(previous, options);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version: () => version,
  };
}
