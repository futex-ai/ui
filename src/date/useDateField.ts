import { useCallback, useState } from "react";

import { clampIso, compareIso, formatDisplay, parseDisplay } from "./dateMath";
import { DateBounds } from "./types";

/** Inputs for {@link useDateField}: the controlled ISO value plus optional bounds. */
export type UseDateFieldArgs = DateBounds & {
  /** Current ISO `YYYY-MM-DD` value, or `""` when unset. */
  value: string;
  /** Called with the next ISO value (already clamped to bounds). */
  onChange: (iso: string) => void;
};

/** The platform-agnostic controller a `DateField` trigger and overlay share. */
export type DateFieldController = DateBounds & {
  /** Current ISO value (`""` when unset). */
  value: string;
  /** `D Mon YYYY` rendering of {@link value} (empty when unset). */
  display: string;
  /** Whether the picker overlay is open. */
  open: boolean;
  /** Open/close the overlay. */
  setOpen: (open: boolean) => void;
  /** Select an ISO date: clamps to bounds, fires `onChange`, closes the overlay. */
  commit: (iso: string) => void;
  /** Parse typed `D Mon YYYY` text and commit if valid; returns whether it parsed. */
  commitText: (text: string) => boolean;
  /** Reset to the unset value (`""`) and close the overlay. */
  clear: () => void;
  /** True when `iso` falls outside the inclusive bounds. */
  isDisabled: (iso: string) => boolean;
};

/**
 * Shared date-field logic: formatting, bound clamping, typed-text parsing, and
 * open/close state. Holds no platform code — the web overlay and the native
 * sheet both drive it. The underlying date math is covered by `dateMath` tests.
 */
export function useDateField({
  value,
  onChange,
  min,
  max,
}: UseDateFieldArgs): DateFieldController {
  const [open, setOpen] = useState(false);

  const commit = useCallback(
    (iso: string) => {
      onChange(clampIso(iso, min, max));
      setOpen(false);
    },
    [max, min, onChange],
  );

  const commitText = useCallback(
    (text: string): boolean => {
      const iso = parseDisplay(text);
      if (!iso) {
        return false;
      }
      const next = clampIso(iso, min, max);
      // Skip the no-op re-commit (e.g. blurring an unchanged field, or the blur
      // that precedes a clear press) so it cannot fire a redundant `onChange`.
      if (next !== value) {
        onChange(next);
      }
      return true;
    },
    [max, min, onChange, value],
  );

  // Empty is the unset sentinel, so clearing bypasses bound clamping entirely.
  const clear = useCallback(() => {
    onChange("");
    setOpen(false);
  }, [onChange]);

  const isDisabled = useCallback(
    (iso: string): boolean =>
      Boolean(
        (min && compareIso(iso, min) < 0) || (max && compareIso(iso, max) > 0),
      ),
    [max, min],
  );

  return {
    value,
    display: formatDisplay(value),
    open,
    setOpen,
    commit,
    commitText,
    clear,
    isDisabled,
    min,
    max,
  };
}
