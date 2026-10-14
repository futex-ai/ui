/** The selection that a drag-select provider keeps and reports. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { announce } from "../announcer";

import type { DragSelectableDragMode } from "./dragSelectableOptionTypes";
import {
  dragSelectableIdSetsEqual,
  dragSelectableInitialReport,
  dragSelectableNextSelection,
  dragSelectableRecordProposal,
  dragSelectableReportRender,
} from "./dragSelectableSelectionModel";
import type {
  DragSelectableSelection,
  DragSelectableSelectionAnnouncement,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";

/** What the selection state needs from its provider. */
export type DragSelectableSelectionConfig = {
  disabled: boolean;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
  targetsRef: MutableRefObject<Map<string, DragSelectableTargetRegistration>>;
};

/** The selection and the ways a provider changes it. */
export type DragSelectableSelectionState = {
  /** Proposes the result of a completed drag with its mode. */
  commitDrag: (hitIds: string[], mode: DragSelectableDragMode) => void;
  selectedIdSet: ReadonlySet<string>;
  selection: DragSelectableSelection;
  /** Proposes a keyboard range. */
  selectRange: (ids: string[]) => void;
  /** Proposes toggling one target from the keyboard. */
  toggle: (id: string) => void;
};

function defaultSelectionAnnouncement(count: number): string {
  return count === 0
    ? "Selection cleared"
    : `${count} item${count === 1 ? "" : "s"} selected`;
}

/**
 * Keeps the provider's selection. Every change arrives as a proposal; the
 * provider skips a proposal that equals the current selection as a set,
 * applies the rest, reports each change of the rendered selection once, and
 * announces a change that a proposal made.
 */
export function useDragSelectableSelectionState(
  config: DragSelectableSelectionConfig,
): DragSelectableSelectionState {
  const configRef = useRef(config);
  configRef.current = config;
  const [storedIds, setStoredIds] = useState<readonly string[]>([]);
  const renderedIds = storedIds;
  const renderedIdsRef = useRef(renderedIds);
  renderedIdsRef.current = renderedIds;
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

  const propose = useCallback((proposal: string[]) => {
    if (
      configRef.current.disabled ||
      dragSelectableIdSetsEqual(renderedIdsRef.current, proposal)
    ) {
      return;
    }
    reportRef.current = dragSelectableRecordProposal(
      reportRef.current,
      proposal,
    );
    setStoredIds(proposal);
  }, []);

  const commitDrag = useCallback(
    (hitIds: string[], mode: DragSelectableDragMode) => {
      propose(
        dragSelectableNextSelection(renderedIdsRef.current, hitIds, mode),
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
      );
    },
    [propose],
  );

  const selectedIdSet = useMemo(() => new Set(renderedIds), [renderedIds]);

  return useMemo(
    () => ({
      commitDrag,
      selectRange: propose,
      selectedIdSet,
      selection,
      toggle,
    }),
    [commitDrag, propose, selectedIdSet, selection, toggle],
  );
}
