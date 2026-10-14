/**
 * The store of page-hook option layers for one provider. It keeps the layers
 * in the order of their keys and reports only the changes that can alter a
 * render: a new non-function value, or a removed one.
 */
import { dragSelectableOptionValuesEqual } from "./dragSelectableOptions";
import type { DragSelectableOptions } from "./dragSelectableOptionTypes";

/** The option layers of a provider. */
export type DragSelectableLayerStore = {
  /** The layers, ordered by key, the earliest first. */
  layers: () => DragSelectableOptions[];
  /** Removes the layer with this key. */
  remove: (order: number) => void;
  /** Adds or replaces the layer with this key. */
  set: (order: number, options: DragSelectableOptions) => void;
};

const noOptions: DragSelectableOptions = {};

/**
 * Creates a layer store. `onValueChange` runs when a change can alter the
 * render; a new function identity alone does not count, because handlers
 * read the options when they run.
 */
export function createDragSelectableLayerStore(
  onValueChange: () => void,
): DragSelectableLayerStore {
  const layers = new Map<number, DragSelectableOptions>();
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
      if (!dragSelectableOptionValuesEqual(previous, noOptions)) {
        onValueChange();
      }
    },
    set: (order, options) => {
      const previous = layers.get(order) ?? noOptions;
      layers.set(order, options);
      if (!dragSelectableOptionValuesEqual(previous, options)) {
        onValueChange();
      }
    },
  };
}
