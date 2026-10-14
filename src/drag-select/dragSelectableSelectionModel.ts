/**
 * Pure selection rules: ids form a set, a drag mode turns hits into a
 * proposal, and a provider reports a change of the rendered selection once,
 * announcing it only when it is the proposal that the provider made.
 */
import type { DragSelectableDragMode } from "./dragSelectableOptionTypes";

/** Whether two id lists hold the same ids, in any order. */
export function dragSelectableIdSetsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size !== rightSet.size) {
    return false;
  }
  for (const id of leftSet) {
    if (!rightSet.has(id)) {
      return false;
    }
  }
  return true;
}

/**
 * The selection that a drag or a key proposes. `replace` returns the hits.
 * `add` returns the current ids, then the hits that are not current.
 * `toggle` returns the current ids without the hits, then the hits that were
 * not current. Duplicate ids appear once.
 */
export function dragSelectableNextSelection(
  currentIds: readonly string[],
  hitIds: readonly string[],
  mode: DragSelectableDragMode,
): string[] {
  const hits = [...new Set(hitIds)];
  if (mode === "replace") {
    return hits;
  }
  const current = [...new Set(currentIds)];
  const currentSet = new Set(current);
  const fresh = hits.filter((id) => !currentSet.has(id));
  if (mode === "add") {
    return [...current, ...fresh];
  }
  const hitSet = new Set(hits);
  return [...current.filter((id) => !hitSet.has(id)), ...fresh];
}

/** What a provider has reported so far. */
export type DragSelectableReportState = {
  /** The proposal that waits for the rendered selection, if any. */
  pending: readonly string[] | null;
  /** The rendered ids of the last report. */
  reportedIds: readonly string[];
};

/** What one render of the selection reports. */
export type DragSelectableReport = {
  /** Announce the change through the live region. */
  announce: boolean;
  /** Call `onSelectionChange`. */
  notify: boolean;
  state: DragSelectableReportState;
};

/** The report state of a provider that rendered `ids` first. */
export function dragSelectableInitialReport(
  ids: readonly string[],
): DragSelectableReportState {
  return { pending: null, reportedIds: [...ids] };
}

/** Records a proposal; it replaces a proposal that still waits. */
export function dragSelectableRecordProposal(
  state: DragSelectableReportState,
  proposal: readonly string[],
): DragSelectableReportState {
  return { ...state, pending: [...proposal] };
}

/**
 * Reports a render of the selection. A render whose ids equal the reported
 * ids as a set reports nothing, so a registry-only update or a new array
 * with the same ids stays silent. A change notifies, and it announces only
 * when it makes the rendered selection equal to the waiting proposal. Either
 * way the change drops the waiting proposal.
 */
export function dragSelectableReportRender(
  state: DragSelectableReportState,
  renderedIds: readonly string[],
): DragSelectableReport {
  if (dragSelectableIdSetsEqual(state.reportedIds, renderedIds)) {
    return { announce: false, notify: false, state };
  }
  return {
    announce:
      state.pending !== null &&
      dragSelectableIdSetsEqual(state.pending, renderedIds),
    notify: true,
    state: { pending: null, reportedIds: [...renderedIds] },
  };
}
