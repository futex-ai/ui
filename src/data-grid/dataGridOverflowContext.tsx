/**
 * Carries the grid's {@link DataGridOverflowTooltipMode} and type scale down to
 * every clipped label and value.
 *
 * A context rather than props because the text sits four layers below the grid
 * — row → cell → cell content → text — and none of those layers has any other
 * use for either setting.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  overflowTooltipTargets,
  type DataGridOverflowTargets,
} from "./dataGridOverflowModel";
import { dataGridMetrics } from "./dataGridStyles";
import type { DataGridOverflowTooltipMode } from "./types";

type OverflowTooltipContext = {
  /** The grid's cell font size, so the reveal matches its density. */
  fontSize: number;
  targets: DataGridOverflowTargets;
};

const OverflowTooltipContext = createContext<OverflowTooltipContext>({
  fontSize: dataGridMetrics().fontSize,
  targets: overflowTooltipTargets("all"),
});

export function DataGridOverflowProvider({
  children,
  fontSize,
  mode,
}: {
  children: ReactNode;
  fontSize: number;
  mode?: DataGridOverflowTooltipMode;
}) {
  const value = useMemo(
    () => ({ fontSize, targets: overflowTooltipTargets(mode) }),
    [fontSize, mode],
  );
  return (
    <OverflowTooltipContext.Provider value={value}>
      {children}
    </OverflowTooltipContext.Provider>
  );
}

/** Whether clipped text on this surface reveals itself, and at what size. */
export function useOverflowTooltipSurface(
  surface: keyof DataGridOverflowTargets,
): { enabled: boolean; fontSize: number } {
  const { fontSize, targets } = useContext(OverflowTooltipContext);
  return { enabled: targets[surface], fontSize };
}
