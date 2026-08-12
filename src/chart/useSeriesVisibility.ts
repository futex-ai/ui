/** Legend toggle-to-isolate state, controlled or uncontrolled. */
import { useCallback, useMemo, useState } from "react";

export type SeriesVisibilityOptions = {
  /** Controlled hidden ids. Omit to let the hook own the state. */
  hiddenSeriesIds?: readonly string[];
  /** Notified on every toggle, in both the controlled and uncontrolled cases. */
  onHiddenSeriesIdsChange?: (ids: string[]) => void;
};

export type SeriesVisibility = {
  hidden: ReadonlySet<string>;
  isHidden(id: string): boolean;
  toggle(id: string): void;
};

/**
 * Track which series the legend has hidden.
 *
 * Callers keep passing the **full** series list and filter with `isHidden` at
 * render time, rather than removing entries from the array. That is what keeps
 * colour assignment stable: slots follow a series' position in the full list,
 * so hiding one never repaints the survivors.
 */
export function useSeriesVisibility(
  options: SeriesVisibilityOptions = {},
): SeriesVisibility {
  const { hiddenSeriesIds, onHiddenSeriesIdsChange } = options;
  const [internal, setInternal] = useState<readonly string[]>([]);
  const controlled = hiddenSeriesIds !== undefined;
  const active = controlled ? hiddenSeriesIds : internal;

  const hidden = useMemo(() => new Set(active), [active]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(active);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const list = [...next];
      if (!controlled) {
        setInternal(list);
      }
      onHiddenSeriesIdsChange?.(list);
    },
    [active, controlled, onHiddenSeriesIdsChange],
  );

  return {
    hidden,
    isHidden: useCallback((id: string) => hidden.has(id), [hidden]),
    toggle,
  };
}
