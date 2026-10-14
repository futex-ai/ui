/**
 * The ignore marker: a press on or inside a marked element never starts a
 * drag. Library gesture surfaces carry it, and apps spread it on their own.
 */

/** The attribute that both spellings of the marker write. */
export const DRAG_SELECTABLE_IGNORE_ATTRIBUTE = "data-drag-select-ignore";

/** The marker for a library primitive (`View`, `Pressable`, `Text`). */
export const dragSelectableIgnoreProps = {
  dataSet: { dragSelectIgnore: "true" },
} as const;

/** The marker for a raw DOM element. */
export const dragSelectableIgnoreDomProps = {
  "data-drag-select-ignore": "true",
} as const;

/**
 * Adds the marker to props that may already carry a `dataSet`, such as the
 * focus-ring props of a library control, without dropping their keys.
 */
export function withDragSelectableIgnore<
  Props extends { dataSet?: Record<string, string | undefined> },
>(props: Props): Props & { dataSet: Record<string, string | undefined> } {
  return {
    ...props,
    dataSet: { ...props.dataSet, ...dragSelectableIgnoreProps.dataSet },
  };
}
