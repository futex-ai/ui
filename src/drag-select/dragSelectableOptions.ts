/**
 * The option merge: library defaults, then the provider props, then each
 * page-hook layer. A key whose value is `undefined` does not override, and
 * `ignore` combines across layers.
 */
import { dragSelectableThresholdForValue } from "./dragSelectableModel";
import type {
  DragSelectableDragMode,
  DragSelectableModifierKeys,
  DragSelectableOptions,
} from "./dragSelectableOptionTypes";

/** The default `minimumControlDragDistance`, in pixels. */
export const dragSelectableDefaultControlThreshold = 10;

/**
 * The default `dragMode`: Control and Alt never start a drag, Shift adds the
 * hits, Meta (Command) toggles them, and a plain press replaces the
 * selection.
 */
export function dragSelectableDefaultDragMode(
  keys: DragSelectableModifierKeys,
): DragSelectableDragMode | null {
  if (keys.ctrlKey || keys.altKey) {
    return null;
  }
  if (keys.shiftKey) {
    return "add";
  }
  return keys.metaKey ? "toggle" : "replace";
}

/** The options with their defaults applied and their values normalized. */
export type DragSelectableResolvedOptions = Omit<
  DragSelectableOptions,
  | "autoScroll"
  | "disabled"
  | "dragMode"
  | "ignore"
  | "minimumControlDragDistance"
  | "minimumDragDistance"
  | "preventTextSelection"
  | "startFromControls"
> & {
  autoScroll: boolean;
  disabled: boolean;
  dragMode: NonNullable<DragSelectableOptions["dragMode"]>;
  ignore: readonly string[];
  minimumControlDragDistance: number;
  minimumDragDistance: number;
  preventTextSelection: boolean;
  startFromControls: boolean;
};

/**
 * Merges option layers in order: a later layer wins key by key, a key whose
 * value is `undefined` does not override, and the `ignore` selectors of
 * every layer combine.
 */
export function dragSelectableMergeOptions(
  layers: readonly DragSelectableOptions[],
): DragSelectableOptions {
  const merged: Record<string, unknown> = {};
  const ignore: string[] = [];
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined) {
        continue;
      }
      if (key === "ignore") {
        const selectors = value as string | readonly string[];
        for (const selector of typeof selectors === "string"
          ? [selectors]
          : selectors) {
          if (!ignore.includes(selector)) {
            ignore.push(selector);
          }
        }
        continue;
      }
      merged[key] = value;
    }
  }
  if (ignore.length > 0) {
    merged.ignore = ignore;
  }
  return merged as DragSelectableOptions;
}

/** Applies the library defaults to merged options. */
export function dragSelectableResolveOptions(
  options: DragSelectableOptions,
): DragSelectableResolvedOptions {
  return {
    ...options,
    autoScroll: options.autoScroll ?? true,
    disabled: options.disabled ?? false,
    dragMode: options.dragMode ?? dragSelectableDefaultDragMode,
    ignore:
      typeof options.ignore === "string"
        ? [options.ignore]
        : (options.ignore ?? []),
    minimumControlDragDistance: normalizedDistance(
      options.minimumControlDragDistance,
      dragSelectableDefaultControlThreshold,
    ),
    minimumDragDistance: dragSelectableThresholdForValue(
      options.minimumDragDistance,
    ),
    preventTextSelection: options.preventTextSelection ?? true,
    startFromControls: options.startFromControls ?? true,
  };
}

/**
 * Whether two layers render the same: every non-function value is equal,
 * with arrays compared element by element. The provider reads function
 * options when it calls them, so their identity never re-renders it.
 */
export function dragSelectableOptionValuesEqual(
  left: DragSelectableOptions,
  right: DragSelectableOptions,
): boolean {
  return optionsEqual(left, right, false);
}

/**
 * Whether two layers are the same in every key, function identities
 * included. The box layer re-renders when they differ, because it reads
 * `renderMarquee` and `selectionLabel` at its own render.
 */
export function dragSelectableOptionsIdentical(
  left: DragSelectableOptions,
  right: DragSelectableOptions,
): boolean {
  return optionsEqual(left, right, true);
}

function optionsEqual(
  left: DragSelectableOptions,
  right: DragSelectableOptions,
  compareFunctions: boolean,
): boolean {
  const leftValues = left as Record<string, unknown>;
  const rightValues = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const a = leftValues[key];
    const b = rightValues[key];
    if (
      !compareFunctions &&
      (typeof a === "function" || typeof b === "function")
    ) {
      continue;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length || a.some((item, index) => item !== b[index])) {
        return false;
      }
      continue;
    }
    if (!Object.is(a, b)) {
      return false;
    }
  }
  return true;
}

function normalizedDistance(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
}
