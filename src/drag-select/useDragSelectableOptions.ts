/** The page hook that sets the options of the nearest drag-select provider. */
import { useContext, useEffect, useLayoutEffect, useState } from "react";

import { DragSelectableContext } from "./DragSelectableContext";
import type { DragSelectableOptions } from "./dragSelectableOptionTypes";

// Publish before paint, falling back to useEffect during server pre-render.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Orders layers by the first render of the component that adds them. */
let layerSequence = 0;

/**
 * Sets options on the nearest `DragSelectableProvider` while the calling
 * component is mounted. The layer overrides the provider props key by key,
 * a later layer wins, a key whose value is `undefined` does not override,
 * and `ignore` selectors combine across layers. Outside a provider it does
 * nothing.
 *
 * ```tsx
 * useDragSelectableOptions({ disabled: false, ignore: "[data-notes]" });
 * ```
 */
export function useDragSelectableOptions(options: DragSelectableOptions): void {
  const { optionLayers } = useContext(DragSelectableContext);
  const [order] = useState(() => {
    layerSequence += 1;
    return layerSequence;
  });

  useIsoLayoutEffect(() => {
    optionLayers.set(order, options);
  });

  useIsoLayoutEffect(
    () => () => {
      optionLayers.remove(order);
    },
    [optionLayers, order],
  );
}
