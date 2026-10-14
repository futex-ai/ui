/**
 * The option layers of a provider: its own props first, then one layer for
 * each mounted `useDragSelectableOptions` call, ordered by the first render of
 * the component that calls it.
 */
import { useCallback, useRef, useState } from "react";

import {
  createDragSelectableLayerStore,
  type DragSelectableLayerStore,
} from "./dragSelectableLayerStore";
import {
  dragSelectableMergeOptions,
  dragSelectableResolveOptions,
  type DragSelectableResolvedOptions,
} from "./dragSelectableOptions";
import type { DragSelectableOptions } from "./dragSelectableOptionTypes";

/** How the page hook adds, updates, and removes its layer. */
export type DragSelectableOptionLayers = Pick<
  DragSelectableLayerStore,
  "remove" | "set"
>;

/** The merged options of a provider and the ways to change them. */
export type DragSelectableOptionState = {
  layers: DragSelectableOptionLayers;
  /** The resolved options of this render. */
  options: DragSelectableResolvedOptions;
  /** The resolved options at call time, for event handlers. */
  readOptions: () => DragSelectableResolvedOptions;
};

/**
 * Merges the provider props with the hook layers. A layer change that alters
 * a non-function value re-renders the provider.
 */
export function useDragSelectableOptionLayers(
  providerOptions: DragSelectableOptions,
): DragSelectableOptionState {
  const providerOptionsRef = useRef(providerOptions);
  providerOptionsRef.current = providerOptions;
  const [, setLayerVersion] = useState(0);
  const [store] = useState(() =>
    createDragSelectableLayerStore(() =>
      setLayerVersion((version) => version + 1),
    ),
  );

  const readOptions = useCallback(
    () =>
      dragSelectableResolveOptions(
        dragSelectableMergeOptions([
          providerOptionsRef.current,
          ...store.layers(),
        ]),
      ),
    [store],
  );

  return { layers: store, options: readOptions(), readOptions };
}
