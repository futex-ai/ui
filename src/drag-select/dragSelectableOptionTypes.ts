/** Public types of the drag-select options and the start rules. */
import type {
  DragSelectableSelection,
  DragSelectableSelectionAnnouncement,
  DragSelectableSelectionLabel,
} from "./dragSelectableTypes";

/**
 * How a drag changes the selection: `replace` selects the hits, `add` adds
 * them, and `toggle` flips each of them.
 */
export type DragSelectableDragMode = "replace" | "add" | "toggle";

/** The modifier keys held at the press. */
export type DragSelectableModifierKeys = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

/** Why the default start rules refused a press. */
export type DragSelectableStartReason =
  | "modifier"
  | "ignored"
  | "field"
  | "control";

/** One press, as `shouldStartDrag` sees it. */
export type DragSelectableStart = {
  /** The answer of the default rules. */
  allowed: boolean;
  /** The pressed element. */
  element: Element;
  /** The native `pointerdown`. */
  event: PointerEvent;
  keys: DragSelectableModifierKeys;
  /** The mode that `dragMode` gave, or `null` when it refused the press. */
  mode: DragSelectableDragMode | null;
  /** Why the default rules refused the press, or `null` when they allowed it. */
  reason: DragSelectableStartReason | null;
  /** The registered target that contains the press, if any. */
  targetId: string | null;
};

/** What a proposed selection came from. */
export type DragSelectableSelectionChange = {
  /** The hits of the drag or the keys, in document order. */
  hitIds: string[];
  mode: DragSelectableDragMode;
  /** The rendered selection when the proposal was made. */
  previousIds: string[];
  source: "drag" | "keyboard";
};

/**
 * The options that both `DragSelectableProvider` and
 * `useDragSelectableOptions` take. A hook layer overrides the provider props
 * key by key; `ignore` combines across layers.
 */
export type DragSelectableOptions = {
  /** Turns the provider off: no press arms and a running drag cancels. */
  disabled?: boolean;
  /** Maps the modifier keys of a press to a mode, or to `null` for no drag. */
  dragMode?: (
    keys: DragSelectableModifierKeys,
  ) => DragSelectableDragMode | null;
  /** CSS selectors of regions where a press never starts a drag. */
  ignore?: string | readonly string[];
  /** Pixels of movement before a press on a control starts a drag. */
  minimumControlDragDistance?: number;
  /** Pixels of movement before a press starts a drag. */
  minimumDragDistance?: number;
  /**
   * Receives each proposed selection. In controlled mode the app applies it
   * by passing it back as `selectedIds`.
   */
  onSelectedIdsChange?: (
    ids: string[],
    change: DragSelectableSelectionChange,
  ) => void;
  /** Receives each change of the rendered selection. */
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  /** The z-index of the box layer, for a custom stacking context. */
  overlayZIndex?: number;
  /** Blocks text selection from the start of a drag to the release. */
  preventTextSelection?: boolean;
  /**
   * Makes the selection controlled when it is defined: the provider renders
   * these ids and stores none. The order carries no meaning.
   */
  selectedIds?: readonly string[];
  /**
   * Customizes the polite live-region announcement of an applied proposal
   * (WCAG 2.1 — 4.1.3 Status Messages, AA). Return an empty string to stay
   * silent.
   */
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
  /** The badge text of the box, from the live matching count and targets. */
  selectionLabel?: DragSelectableSelectionLabel;
  /** Gives the final answer for each press that passes the fixed rules. */
  shouldStartDrag?: (start: DragSelectableStart) => boolean;
  /** Lets a press on a control inside an enabled target start a drag. */
  startFromControls?: boolean;
};
