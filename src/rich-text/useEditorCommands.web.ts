/** Editor command bindings shared by shortcuts and slash-menu extra items. */
import { useMemo } from "react";
import type { RefObject } from "react";

import { docRangeFromDomSelection } from "./domSelection.web";
import { serializeRichTextDom } from "./domSerialize.web";
import {
  DocPosition,
  DocSelection,
  RichTextBlock,
  RichTextDocument,
  RichTextTurnIntoType,
  blockTextLength,
  deleteRange,
  insertBlocks as insertModelBlocks,
  normalizeDocument,
  toggleMarkInRange,
  turnInto as turnModelInto,
} from "./richTextModel";
import type { RichTextEditorCommands } from "./richTextTypes";

type CommitSelection = DocPosition | DocSelection | null;

type CommitDocument = (
  document: readonly RichTextBlock[],
  selection: CommitSelection,
) => void;

type UseEditorCommandsOptions = {
  commitDocument: CommitDocument;
  rootRef: RefObject<HTMLElement | null>;
};

/** Build imperative editor commands against the current DOM selection. */
export function useEditorCommands({
  commitDocument,
  rootRef,
}: UseEditorCommandsOptions): RichTextEditorCommands {
  return useMemo(
    () => ({
      getSelection: () => {
        const root = rootRef.current;
        return root
          ? docRangeFromDomSelection(root, window.getSelection())
          : null;
      },
      insertBlocks: (blocks) => {
        const root = rootRef.current;
        if (!root) {
          return;
        }
        const selection = docRangeFromDomSelection(root, window.getSelection());
        const doc = serializeRichTextDom(root);
        const insertAt = selection?.from ?? documentEnd(doc);
        const base =
          selection && !samePosition(selection.from, selection.to)
            ? deleteRange(doc, selection.from, selection.to)
            : doc;
        commitDocument(
          insertModelBlocks(base, insertAt, blocks),
          caretAfterInsertBlocks(base, insertAt, blocks),
        );
      },
      toggleMark: (mark) => {
        const root = rootRef.current;
        if (!root) {
          return;
        }
        const selection = docRangeFromDomSelection(root, window.getSelection());
        if (!selection || samePosition(selection.from, selection.to)) {
          return;
        }
        const doc = serializeRichTextDom(root);
        commitDocument(
          toggleMarkInRange(doc, selection.from, selection.to, mark),
          selection,
        );
      },
      turnInto: (type) => {
        const root = rootRef.current;
        if (!root) {
          return;
        }
        const selection = docRangeFromDomSelection(root, window.getSelection());
        if (!selection) {
          return;
        }
        const doc = serializeRichTextDom(root);
        commitDocument(
          turnSelectedBlocksInto(doc, selection, type),
          selection.from,
        );
      },
    }),
    [commitDocument, rootRef],
  );
}

function turnSelectedBlocksInto(
  document: readonly RichTextBlock[],
  selection: DocSelection,
  type: RichTextTurnIntoType,
): RichTextDocument {
  let next = normalizeDocument(document);
  for (
    let index = selection.from.block;
    index <= selection.to.block;
    index += 1
  ) {
    next = turnModelInto(next, index, type);
  }
  return next;
}

function caretAfterInsertBlocks(
  document: readonly RichTextBlock[],
  position: DocPosition,
  blocks: readonly RichTextBlock[],
): DocPosition {
  const doc = normalizeDocument(document);
  const inserted = normalizeDocument(blocks);
  const start =
    blockTextLength(doc[position.block]) === 0
      ? position.block
      : position.block + 1;
  const block = start + inserted.length - 1;
  return { block, offset: blockTextLength(inserted[inserted.length - 1]) };
}

function documentEnd(document: readonly RichTextBlock[]): DocPosition {
  const doc = normalizeDocument(document);
  const block = doc.length - 1;
  return { block, offset: blockTextLength(doc[block]) };
}

function samePosition(left: DocPosition, right: DocPosition): boolean {
  return left.block === right.block && left.offset === right.offset;
}
