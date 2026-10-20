/** Reports the changes of the rendered selection and announces proposals. */
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

import { announce } from "../announcer";

import type {
  DragSelectableResolvedOptions,
  DragSelectableSelectionOwner,
} from "./dragSelectableOptions";
import {
  dragSelectableInitialReport,
  dragSelectableReportRender,
  dragSelectableStartsSelection,
  type DragSelectableReportState,
} from "./dragSelectableSelectionModel";
import type { DragSelectableSelection } from "./dragSelectableTypes";

/** What the report needs from the selection state. */
export type DragSelectableSelectionReportConfig = {
  /** Who sets the rendered `selectedIds` in this render. */
  owner: DragSelectableSelectionOwner;
  /** The options at call time, so a new callback identity is heard. */
  readOptions: () => DragSelectableResolvedOptions;
  /** The report state, which a proposal also writes. */
  reportRef: MutableRefObject<DragSelectableReportState>;
  /** The rendered selection of this render. */
  selection: DragSelectableSelection;
};

function defaultSelectionAnnouncement(count: number): string {
  return count === 0
    ? "Selection cleared"
    : `${count} item${count === 1 ? "" : "s"} selected`;
}

/**
 * After each render, reports a change of the rendered selection once through
 * `onSelectionChange`, and announces the change when a proposal made it.
 * When a page hook starts to set `selectedIds`, its selection is the page's
 * starting selection: the report starts again from it and says nothing.
 */
export function useDragSelectableSelectionReport({
  owner,
  readOptions,
  reportRef,
  selection,
}: DragSelectableSelectionReportConfig): void {
  const reportedOwnerRef = useRef(owner);

  useEffect(() => {
    const previousOwner = reportedOwnerRef.current;
    reportedOwnerRef.current = owner;
    if (dragSelectableStartsSelection(previousOwner, owner)) {
      reportRef.current = dragSelectableInitialReport(selection.selectedIds);
      return;
    }
    const report = dragSelectableReportRender(
      reportRef.current,
      selection.selectedIds,
    );
    reportRef.current = report.state;
    if (!report.notify && !report.announce) {
      return;
    }
    const options = readOptions();
    if (report.notify) {
      options.onSelectionChange?.(selection);
    }
    if (report.announce) {
      announce(
        (options.selectionAnnouncement ?? defaultSelectionAnnouncement)(
          selection.selectedCount,
          selection,
        ),
      );
    }
  }, [owner, readOptions, reportRef, selection]);
}
