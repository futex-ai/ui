/**
 * The option layers of a provider: its own props first, then one layer for
 * each mounted `useDragSelectableOptions` call, ordered by the first render of
 * the component that calls it.
 */
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

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

/** Live access to the merged options. */
export type DragSelectableOptionSource = {
  /** The resolved options at call time. */
  read: () => DragSelectableResolvedOptions;
  /** Subscribes to every hook-layer change, function-only ones included. */
  subscribe: (listener: () => void) => () => void;
  /** A number that changes with every hook-layer change. */
  version: () => number;
};

/** The merged options of a provider and the ways to change them. */
export type DragSelectableOptionState = {
  layers: DragSelectableOptionLayers;
  /** The resolved options of this render. */
  options: DragSelectableResolvedOptions;
  /**
   * Live options for event handlers, effects, and the box layer, which read
   * the current callbacks even when only a function changed.
   */
  source: DragSelectableOptionSource;
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
  const source = useMemo<DragSelectableOptionSource>(
    () => ({
      read: () =>
        dragSelectableResolveOptions(
          dragSelectableMergeOptions([
            providerOptionsRef.current,
            ...store.layers(),
          ]),
        ),
      subscribe: store.subscribe,
      version: store.version,
    }),
    [store],
  );
  return { layers: store, options: source.read(), source };
}

/**
 * The options at this render, re-rendering the calling component on every
 * hook-layer change. The box layer uses it, so a page that passes a new
 * `renderMarquee` or `selectionLabel` sees it without a provider render.
 */
export function useDragSelectableLiveOptions(
  source: DragSelectableOptionSource,
): DragSelectableResolvedOptions {
  useSyncExternalStore(source.subscribe, source.version, source.version);
  return source.read();
}
