/** The selection that a drag-select provider keeps or follows, and reports. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { dragSelectableSnapshotsForIds } from "./dragSelectableDom";
import { dragSelectableIdsEqual } from "./dragSelectableModel";
import type {
  DragSelectableResolvedOptions,
  DragSelectableSelectionOwner,
} from "./dragSelectableOptions";
import type {
  DragSelectableDragMode,
  DragSelectableSelectionChange,
} from "./dragSelectableOptionTypes";
import {
  dragSelectableIdSetsEqual,
  dragSelectableInitialReport,
  dragSelectableNextSelection,
  dragSelectableRecordProposal,
  dragSelectableStoredAfterEmpty,
  dragSelectableStoredForScope,
  dragSelectableStoredIdsIn,
  dragSelectableUniqueIds,
  type DragSelectableStoredSelection,
} from "./dragSelectableSelectionModel";
import type {
  DragSelectableSelection,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";
import { useDragSelectableSelectionReport } from "./useDragSelectableSelectionReport";

/** What the selection state needs from its provider. */
export type DragSelectableSelectionConfig = {
  /** The starting stored selection, read once on mount. */
  defaultSelectedIds?: readonly string[];
  /**
   * The options at call time. `disabled`, controlled mode, and the callbacks
   * are read when a proposal or a report happens, so a page that changes
   * only a callback is heard without a provider render.
   */
  readOptions: () => DragSelectableResolvedOptions;
  /** The registry snapshot: it changes when a target registers or leaves. */
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  /** The controlled selection of this render, or `undefined`. */
  selectedIds?: readonly string[];
  /** Who sets the rendered `selectedIds` in this render. */
  selectionOwner: DragSelectableSelectionOwner;
  /** The `selectionScope` of this render. */
  selectionScope?: string | number;
  /** The live registrations, with the current target data. */
  targetsRef: MutableRefObject<Map<string, DragSelectableTargetRegistration>>;
};

/** The selection and the ways a provider changes it. */
export type DragSelectableSelectionState = {
  /**
   * Runs when the last registered target unregisters: at the end of the
   * task, the stored selection clears unless one of its ids registered again.
   */
  clearAfterEmpty: () => void;
  /** Proposes the result of a completed drag with its mode. */
  commitDrag: (hitIds: string[], mode: DragSelectableDragMode) => void;
  selectedIdSet: ReadonlySet<string>;
  selection: DragSelectableSelection;
  /** Proposes a keyboard range. */
  selectRange: (ids: string[]) => void;
  /** Proposes toggling one target from the keyboard. */
  toggle: (id: string) => void;
};

type Proposal = Omit<DragSelectableSelectionChange, "previousIds">;

const afterTask: (run: () => void) => void =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (run) => {
        void Promise.resolve().then(run);
      };

/**
 * Keeps or follows the provider's selection. Every change arrives as a
 * proposal; the provider skips a proposal that equals the rendered
 * selection as a set, stores the rest unless the app controls the
 * selection, sends each to `onSelectedIdsChange`, reports each change of the
 * rendered selection once, and announces a change that a proposal made. The
 * stored selection belongs to the `selectionScope` it was made in.
 */
export function useDragSelectableSelectionState(
  config: DragSelectableSelectionConfig,
): DragSelectableSelectionState {
  const configRef = useRef(config);
  configRef.current = config;
  const scope = config.selectionScope;
  const [stored, setStored] = useState<DragSelectableStoredSelection>(() => ({
    ids: dragSelectableUniqueIds(config.defaultSelectedIds ?? []),
    scope,
  }));
  const nextRenderedIds = dragSelectableUniqueIds(
    config.selectedIds ?? dragSelectableStoredIdsIn(stored, scope),
  );
  const renderedIdsRef = useRef(nextRenderedIds);
  if (!dragSelectableIdsEqual(renderedIdsRef.current, nextRenderedIds)) {
    renderedIdsRef.current = nextRenderedIds;
  }
  const renderedIds = renderedIdsRef.current;
  const reportRef = useRef(dragSelectableInitialReport(renderedIds));

  const { registeredTargets, targetsRef } = config;
  const selection = useMemo<DragSelectableSelection>(
    () => ({
      selectedCount: renderedIds.length,
      selectedIds: [...renderedIds],
      selectedTargets: dragSelectableSnapshotsForIds(
        renderedIds,
        targetsRef.current,
      ),
    }),
    // A target that registers or leaves changes `registeredTargets`; that is
    // when the snapshot reads the live registrations again.
    [registeredTargets, renderedIds, targetsRef],
  );

  useDragSelectableSelectionReport({
    owner: config.selectionOwner,
    readOptions: config.readOptions,
    reportRef,
    selection,
  });

  useEffect(() => {
    setStored((current) => dragSelectableStoredForScope(current, scope));
  }, [scope]);

  const propose = useCallback((ids: string[], proposal: Proposal) => {
    const options = configRef.current.readOptions();
    const previousIds = renderedIdsRef.current;
    if (options.disabled || dragSelectableIdSetsEqual(previousIds, ids)) {
      return;
    }
    reportRef.current = dragSelectableRecordProposal(reportRef.current, ids);
    if (options.selectedIds === undefined) {
      setStored({ ids, scope: options.selectionScope });
    }
    options.onSelectedIdsChange?.(ids, {
      ...proposal,
      previousIds: [...previousIds],
    });
  }, []);

  const commitDrag = useCallback(
    (hitIds: string[], mode: DragSelectableDragMode) => {
      propose(
        dragSelectableNextSelection(renderedIdsRef.current, hitIds, mode),
        { hitIds, mode, source: "drag" },
      );
    },
    [propose],
  );

  const toggle = useCallback(
    (id: string) => {
      if (configRef.current.targetsRef.current.get(id)?.disabled) {
        return;
      }
      propose(
        dragSelectableNextSelection(renderedIdsRef.current, [id], "toggle"),
        { hitIds: [id], mode: "toggle", source: "keyboard" },
      );
    },
    [propose],
  );

  const selectRange = useCallback(
    (ids: string[]) => {
      propose([...ids], {
        hitIds: [...ids],
        mode: "replace",
        source: "keyboard",
      });
    },
    [propose],
  );

  const clearAfterEmpty = useCallback(() => {
    afterTask(() => {
      const targets = configRef.current.targetsRef.current;
      setStored((current) => {
        const ids = dragSelectableStoredAfterEmpty(current.ids, (id) =>
          targets.has(id),
        );
        return ids === current.ids ? current : { ...current, ids };
      });
    });
  }, []);

  const selectedIdSet = useMemo(() => new Set(renderedIds), [renderedIds]);

  return useMemo(
    () => ({
      clearAfterEmpty,
      commitDrag,
      selectRange,
      selectedIdSet,
      selection,
      toggle,
    }),
    [
      clearAfterEmpty,
      commitDrag,
      selectRange,
      selectedIdSet,
      selection,
      toggle,
    ],
  );
}
