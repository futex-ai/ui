/** Native editor adapter around the shared pure rich-text history stack. */
import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

import type { NativeRichTextTarget } from "./nativeRichTextEditing";
import {
  createRichTextHistoryState,
  recordRichTextHistory,
  redoRichTextHistory,
  undoRichTextHistory,
} from "./richTextHistory";
import type {
  RichTextHistoryEditKind,
  RichTextHistorySnapshot,
} from "./richTextHistory";
import type { DocSelection, RichTextDocument } from "./richTextModel";

type ApplyDocument = (
  document: RichTextDocument,
  target: NativeRichTextTarget,
  forceFocus: boolean,
) => void;

/** Own native undo/redo bookkeeping while the editor owns live document refs. */
export function useNativeRichTextHistory({
  applyDocument,
  documentRef,
  selectionRef,
}: {
  applyDocument: ApplyDocument;
  documentRef: RefObject<RichTextDocument>;
  selectionRef: RefObject<NativeRichTextTarget>;
}) {
  const historyRef = useRef(createRichTextHistoryState());
  const [availability, setAvailability] = useState({
    canRedo: false,
    canUndo: false,
  });

  const syncAvailability = useCallback(() => {
    setAvailability({
      canRedo: historyRef.current.redoStack.length > 0,
      canUndo: historyRef.current.undoStack.length > 0,
    });
  }, []);

  const recordEdit = useCallback(
    (kind: RichTextHistoryEditKind, snapshot?: RichTextHistorySnapshot) => {
      historyRef.current = recordRichTextHistory(
        historyRef.current,
        snapshot ?? currentSnapshot(documentRef.current, selectionRef.current),
        kind,
        Date.now(),
      );
      syncAvailability();
    },
    [documentRef, selectionRef, syncAvailability],
  );

  const reset = useCallback(() => {
    historyRef.current = createRichTextHistoryState();
    syncAvailability();
  }, [syncAvailability]);

  const traverse = useCallback(
    (direction: "redo" | "undo") => {
      const current = currentSnapshot(
        documentRef.current,
        selectionRef.current,
      );
      const transition =
        direction === "undo"
          ? undoRichTextHistory(historyRef.current, current)
          : redoRichTextHistory(historyRef.current, current);
      if (!transition) return;
      historyRef.current = transition.history;
      syncAvailability();
      applyDocument(
        transition.snapshot.doc,
        targetFromHistory(transition.snapshot.caret),
        true,
      );
    },
    [applyDocument, documentRef, selectionRef, syncAvailability],
  );

  return { availability, recordEdit, reset, traverse };
}

function currentSnapshot(
  document: RichTextDocument,
  target: NativeRichTextTarget,
): RichTextHistorySnapshot {
  return {
    caret: {
      from: { block: target.block, offset: target.selection.start },
      to: { block: target.block, offset: target.selection.end },
    },
    doc: document,
  };
}

function targetFromHistory(selection: DocSelection): NativeRichTextTarget {
  return {
    block: selection.from.block,
    selection: {
      end:
        selection.to.block === selection.from.block
          ? selection.to.offset
          : selection.from.offset,
      start: selection.from.offset,
    },
  };
}
