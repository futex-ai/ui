/** The selection that a drag-select provider keeps or follows, and reports. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { announce } from "../announcer";

import { dragSelectableIdsEqual } from "./dragSelectableModel";
import type {
  DragSelectableDragMode,
  DragSelectableSelectionChange,
} from "./dragSelectableOptionTypes";
import {
  dragSelectableIdSetsEqual,
  dragSelectableInitialReport,
  dragSelectableNextSelection,
  dragSelectableRecordProposal,
  dragSelectableReportRender,
  dragSelectableStoredAfterEmpty,
} from "./dragSelectableSelectionModel";
import type {
  DragSelectableSelection,
  DragSelectableSelectionAnnouncement,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";

/** What the selection state needs from its provider. */
export type DragSelectableSelectionConfig = {
  /** The starting stored selection, read once on mount. */
  defaultSelectedIds?: readonly string[];
  disabled: boolean;
  onSelectedIdsChange?: (
    ids: string[],
    change: DragSelectableSelectionChange,
  ) => void;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  /** The controlled selection, or `undefined` for an uncontrolled provider. */
  selectedIds?: readonly string[];
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
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

function defaultSelectionAnnouncement(count: number): string {
  return count === 0
    ? "Selection cleared"
    : `${count} item${count === 1 ? "" : "s"} selected`;
}

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
 * rendered selection once, and announces a change that a proposal made.
 */
export function useDragSelectableSelectionState(
  config: DragSelectableSelectionConfig,
): DragSelectableSelectionState {
  const configRef = useRef(config);
  configRef.current = config;
  const [storedIds, setStoredIds] = useState<readonly string[]>(() => [
    ...(config.defaultSelectedIds ?? []),
  ]);
  const renderedIdsRef = useRef(config.selectedIds ?? storedIds);
  const nextRenderedIds = config.selectedIds ?? storedIds;
  if (!dragSelectableIdsEqual(renderedIdsRef.current, nextRenderedIds)) {
    renderedIdsRef.current = nextRenderedIds;
  }
  const renderedIds = renderedIdsRef.current;
  const reportRef = useRef(dragSelectableInitialReport(renderedIds));

  const { registeredTargets } = config;
  const selection = useMemo<DragSelectableSelection>(
    () => ({
      selectedCount: renderedIds.length,
      selectedIds: [...renderedIds],
      selectedTargets: renderedIds.map((id) => ({
        data: registeredTargets.get(id)?.data,
        id,
      })),
    }),
    [registeredTargets, renderedIds],
  );

  useEffect(() => {
    const report = dragSelectableReportRender(
      reportRef.current,
      selection.selectedIds,
    );
    reportRef.current = report.state;
    const current = configRef.current;
    if (report.notify) {
      current.onSelectionChange?.(selection);
    }
    if (report.announce) {
      announce(
        (current.selectionAnnouncement ?? defaultSelectionAnnouncement)(
          selection.selectedCount,
          selection,
        ),
      );
    }
  }, [selection]);

  const propose = useCallback((ids: string[], proposal: Proposal) => {
    const current = configRef.current;
    const previousIds = renderedIdsRef.current;
    if (current.disabled || dragSelectableIdSetsEqual(previousIds, ids)) {
      return;
    }
    reportRef.current = dragSelectableRecordProposal(reportRef.current, ids);
    if (current.selectedIds === undefined) {
      setStoredIds(ids);
    }
    current.onSelectedIdsChange?.(ids, {
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
      setStoredIds((stored) =>
        dragSelectableStoredAfterEmpty(stored, (id) => targets.has(id)),
      );
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
