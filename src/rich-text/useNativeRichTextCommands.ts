/** Native editor event handlers that translate input and toolbar actions. */
import { useCallback, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import {
  insertNativeBlockAfter,
  mergeNativeBlockBackward,
  restoreNativePrefix,
  toggleNativeChecklist,
  turnNativeBlockInto,
} from "./nativeRichTextActions";
import {
  applyNativeTextChange,
  marksForNativeSelection,
  nativeBlockText,
} from "./nativeRichTextEditing";
import type {
  NativePrefixRule,
  NativeRichTextTarget,
  NativeTypingMarksOverride,
} from "./nativeRichTextEditing";
import type { NativeTextSelection } from "./nativeTextEdit";
import type {
  RichTextHistoryEditKind,
  RichTextHistorySnapshot,
} from "./richTextHistory";
import { blockTextLength, toggleMarkInRange } from "./richTextModel";
import type {
  InlineMark,
  RichTextBlock,
  RichTextDocument,
  RichTextTurnIntoType,
} from "./richTextModel";

type CommitDocument = (
  document: readonly RichTextBlock[],
  target: NativeRichTextTarget,
  kind: RichTextHistoryEditKind,
  forceFocus?: boolean,
  historySnapshot?: RichTextHistorySnapshot,
  typingMarks?: readonly InlineMark[],
) => void;

/** Build stable native input, selection, Backspace, and toolbar handlers. */
export function useNativeRichTextCommands({
  activeBlockRef,
  activeMarksRef,
  commitDocument,
  documentRef,
  onActiveBlockChange,
  onActiveMarksChange,
  onEditorFocus,
  readOnly,
  scheduleFocus,
  selectionRef,
  typingMarksOverrideRef,
}: {
  activeBlockRef: RefObject<number>;
  activeMarksRef: RefObject<InlineMark[]>;
  commitDocument: CommitDocument;
  documentRef: RefObject<RichTextDocument>;
  onActiveBlockChange: Dispatch<SetStateAction<number>>;
  onActiveMarksChange: Dispatch<SetStateAction<InlineMark[]>>;
  onEditorFocus: () => void;
  readOnly: boolean;
  scheduleFocus: (target: NativeRichTextTarget) => void;
  selectionRef: RefObject<NativeRichTextTarget>;
  typingMarksOverrideRef: RefObject<NativeTypingMarksOverride | null>;
}) {
  const prefixRuleRef = useRef<NativePrefixRule | null>(null);

  const handleTextChange = useCallback(
    (block: number, nextText: string) => {
      if (readOnly) return;
      const selection =
        selectionRef.current.block === block
          ? selectionRef.current.selection
          : endSelection(documentRef.current[block]);
      const result = applyNativeTextChange({
        block,
        document: documentRef.current,
        marks: activeMarksRef.current,
        nextText,
        selection,
      });
      const transformed =
        result.prefixRule !== undefined ||
        result.target.block !== block ||
        nativeBlockText(result.document[result.target.block]) !== nextText;
      prefixRuleRef.current = result.prefixRule ?? null;
      commitDocument(
        result.document,
        result.target,
        transformed ? "model" : "typing",
        transformed,
        result.historySnapshot,
        result.typingMarks,
      );
    },
    [activeMarksRef, commitDocument, documentRef, readOnly, selectionRef],
  );

  const handleFocus = useCallback(
    (block: number) => {
      activeBlockRef.current = block;
      onActiveBlockChange(block);
      onEditorFocus();
    },
    [activeBlockRef, onActiveBlockChange, onEditorFocus],
  );

  const handleSelectionChange = useCallback(
    (block: number, selection: NativeTextSelection) => {
      selectionRef.current = { block, selection };
      activeBlockRef.current = block;
      onActiveBlockChange(block);
      const target = { block, selection };
      const override = typingMarksOverrideRef.current;
      const keepOverride = override && targetsEqual(override.target, target);
      const marks = keepOverride
        ? override.marks
        : marksForNativeSelection(documentRef.current, block, selection);
      if (!keepOverride) typingMarksOverrideRef.current = null;
      activeMarksRef.current = marks;
      onActiveMarksChange(marks);
      const rule = prefixRuleRef.current;
      if (
        rule &&
        (rule.block !== block || selection.start !== 0 || selection.end !== 0)
      ) {
        prefixRuleRef.current = null;
      }
    },
    [
      activeBlockRef,
      activeMarksRef,
      documentRef,
      onActiveBlockChange,
      onActiveMarksChange,
      selectionRef,
      typingMarksOverrideRef,
    ],
  );

  const handleKeyPress = useCallback(
    (block: number, key: string) => {
      if (readOnly) return;
      if (key !== "Backspace") {
        prefixRuleRef.current = null;
        return;
      }
      const target = selectionRef.current;
      if (
        target.block !== block ||
        target.selection.start !== 0 ||
        target.selection.end !== 0
      ) {
        return;
      }
      const prefix = prefixRuleRef.current;
      const result =
        prefix?.block === block
          ? restoreNativePrefix(documentRef.current, prefix)
          : mergeNativeBlockBackward(documentRef.current, block);
      prefixRuleRef.current = null;
      commitDocument(result.document, result.target, "model");
    },
    [commitDocument, documentRef, readOnly, selectionRef],
  );

  const handleToggleMark = useCallback(
    (mark: InlineMark) => {
      const target = selectionRef.current;
      const { selection } = target;
      if (selection.start === selection.end) {
        const marks = activeMarksRef.current.includes(mark)
          ? activeMarksRef.current.filter((entry) => entry !== mark)
          : canonicalMarks([...activeMarksRef.current, mark]);
        activeMarksRef.current = marks;
        onActiveMarksChange(marks);
        typingMarksOverrideRef.current = { marks, target };
        scheduleFocus(target);
        return;
      }
      const next = toggleMarkInRange(
        documentRef.current,
        { block: target.block, offset: selection.start },
        { block: target.block, offset: selection.end },
        mark,
      );
      commitDocument(next, target, "model");
    },
    [
      activeMarksRef,
      commitDocument,
      documentRef,
      onActiveMarksChange,
      scheduleFocus,
      selectionRef,
      typingMarksOverrideRef,
    ],
  );

  const handleTurnInto = useCallback(
    (type: RichTextTurnIntoType) => {
      const target = selectionRef.current;
      const current = documentRef.current[target.block];
      const nextType =
        current.type === type && type !== "paragraph" ? "paragraph" : type;
      const result = turnNativeBlockInto(
        documentRef.current,
        target.block,
        nextType,
        target.selection,
      );
      commitDocument(result.document, result.target, "model");
    },
    [commitDocument, documentRef, selectionRef],
  );

  const handleInsertBlock = useCallback(
    (type: RichTextTurnIntoType | "divider" = "paragraph") => {
      const result = insertNativeBlockAfter(
        documentRef.current,
        activeBlockRef.current,
        type,
      );
      commitDocument(result.document, result.target, "model");
    },
    [activeBlockRef, commitDocument, documentRef],
  );

  const handleToggleCheck = useCallback(
    (block: number) => {
      const next = toggleNativeChecklist(documentRef.current, block);
      commitDocument(next, selectionRef.current, "model", false);
    },
    [commitDocument, documentRef, selectionRef],
  );

  const resetTransientState = useCallback(() => {
    prefixRuleRef.current = null;
    typingMarksOverrideRef.current = null;
  }, [typingMarksOverrideRef]);

  return {
    handleFocus,
    handleInsertBlock,
    handleKeyPress,
    handleSelectionChange,
    handleTextChange,
    handleToggleCheck,
    handleToggleMark,
    handleTurnInto,
    resetTransientState,
  };
}

function endSelection(block: RichTextBlock): NativeTextSelection {
  const offset = blockTextLength(block);
  return { end: offset, start: offset };
}

function canonicalMarks(marks: readonly InlineMark[]): InlineMark[] {
  const selected = new Set(marks);
  return (["bold", "italic", "strike", "code"] as const).filter((mark) =>
    selected.has(mark),
  );
}

function targetsEqual(
  left: NativeRichTextTarget,
  right: NativeRichTextTarget,
): boolean {
  return (
    left.block === right.block &&
    left.selection.start === right.selection.start &&
    left.selection.end === right.selection.end
  );
}
