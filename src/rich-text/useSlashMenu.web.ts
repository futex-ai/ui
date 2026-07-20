/** Slash-menu state machine and editor command bindings for web. */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { View } from "react-native";

import { dropdownRowDomId, nextSelectableId } from "../dropdown";
import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { devWarn } from "../devWarn";

import { docRangeFromDomSelection } from "./domSelection.web";
import { serializeRichTextDom } from "./domSerialize.web";
import {
  DocPosition,
  InlineMark,
  RichTextBlock,
  RichTextDocument,
  RichTextTurnIntoType,
  blockTextLength,
  deleteRange,
  insertBlocks as insertModelBlocks,
  normalizeDocument,
  spansText,
  turnInto as turnModelInto,
} from "./richTextModel";
import type { RichTextEditorCommands, SlashMenuItem } from "./richTextTypes";
import {
  SlashMenuModelItem,
  SlashMenuSection,
  filterSlashMenuSections,
  slashMenuItemsFromSections,
} from "./slashMenuModel";

type SlashMenuSession = {
  blockIndex: number;
  query: string;
  slashOffset: number;
};

type CommitDocument = (
  document: readonly RichTextBlock[],
  caret: DocPosition | null,
) => void;

type UseSlashMenuOptions = {
  commitDocument: CommitDocument;
  extraItems?: readonly SlashMenuItem[];
  readOnlyRef: RefObject<boolean>;
  rootRef: RefObject<HTMLElement | null>;
};

export type SlashMenuController = {
  activeId: string | null;
  activeRowId?: string;
  close: () => void;
  handleBeforeInput: (event: InputEvent, position: DocPosition) => void;
  handleInput: () => void;
  handleKeyDown: (event: KeyboardEvent) => boolean;
  handleSelectionChange: () => void;
  listId: string;
  open: boolean;
  query: string;
  sections: readonly SlashMenuSection[];
  selectItem: (item: SlashMenuModelItem) => void;
  setActiveId: (id: string | null) => void;
  surfaceRef: RefObject<View | null>;
};

/** Manage slash-command menu state against the live contentEditable DOM. */
export function useSlashMenu({
  commitDocument,
  extraItems = [],
  readOnlyRef,
  rootRef,
}: UseSlashMenuOptions): SlashMenuController {
  const listId = useId();
  const surfaceRef = useRef<View | null>(null);
  const [session, setSession] = useState<SlashMenuSession | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sessionRef = useRef(session);
  const itemsRef = useRef<SlashMenuModelItem[]>([]);
  const previousQueryRef = useRef<string | null>(null);
  const close = useCallback(() => {
    setSession(null);
    setActiveId(null);
  }, []);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const sections = useMemo(
    () => (session ? filterSlashMenuSections(session.query, extraItems) : []),
    [extraItems, session],
  );
  const items = useMemo(() => slashMenuItemsFromSections(sections), [sections]);

  useEffect(() => {
    itemsRef.current = items;
    if (!session) {
      previousQueryRef.current = null;
      setActiveId(null);
      return;
    }
    const queryChanged = previousQueryRef.current !== session.query;
    previousQueryRef.current = session.query;
    setActiveId((current) =>
      !queryChanged && current && items.some((item) => item.id === current)
        ? current
        : (items[0]?.id ?? null),
    );
  }, [items, session]);

  const refresh = useCallback(() => {
    const root = rootRef.current;
    const current = sessionRef.current;
    if (!root || !current) {
      return;
    }
    const next = readSlashSession(root, current);
    if (!next) {
      close();
      return;
    }
    setSession(next);
  }, [close, rootRef]);

  const commands = useMemo(
    () => createCommands(rootRef, commitDocument),
    [commitDocument, rootRef],
  );

  const selectItem = useCallback(
    (item: SlashMenuModelItem) => {
      if (readOnlyRef.current) {
        return;
      }
      const root = rootRef.current;
      const current = sessionRef.current;
      if (!root || !current) {
        close();
        return;
      }
      const live =
        readSlashSession(root, current) ??
        readStoredSlashSession(root, current);
      if (!live) {
        close();
        return;
      }
      const doc = serializeRichTextDom(root);
      const caret = {
        block: live.blockIndex,
        offset: live.slashOffset,
      };
      const base = deleteRange(doc, caret, {
        block: live.blockIndex,
        offset: live.slashOffset + live.query.length + 1,
      });

      if (item.source === "extra") {
        commitDocument(base, caret);
        close();
        item.extra.execute?.(commands);
        return;
      }

      if (item.action.type === "divider") {
        const { caret: dividerCaret, document } = insertDivider(base, live);
        commitDocument(document, dividerCaret);
        close();
        return;
      }

      commitDocument(
        turnModelInto(base, live.blockIndex, item.action.blockType),
        caret,
      );
      close();
    },
    [close, commands, commitDocument, readOnlyRef, rootRef],
  );

  const handleBeforeInput = useCallback(
    (event: InputEvent, position: DocPosition) => {
      if (
        readOnlyRef.current ||
        event.inputType !== "insertText" ||
        event.data !== "/"
      ) {
        return;
      }
      const root = rootRef.current;
      if (!root || !canOpenSlashMenu(root, position)) {
        close();
        return;
      }
      setSession({
        blockIndex: position.block,
        query: "",
        slashOffset: position.offset,
      });
    },
    [close, readOnlyRef, rootRef],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!sessionRef.current) {
        return false;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        swallowKey(event);
        setActiveId((current) =>
          nextSelectableId(
            itemsRef.current.map((item) => ({ id: item.id })),
            current,
            event.key === "ArrowDown" ? 1 : -1,
          ),
        );
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        swallowKey(event);
        const item = itemsRef.current.find((entry) => entry.id === activeId);
        if (item) {
          selectItem(item);
        }
        return true;
      }
      return false;
    },
    [activeId, selectItem],
  );

  useEffect(() => {
    if (!session || typeof document === "undefined") {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      const surface = surfaceRef.current as unknown as HTMLElement | null;
      const target = event.target;
      if (
        eventTargetElement(target)?.closest(
          '[data-testid="rich-text-slash-menu"]',
        )
      ) {
        return;
      }
      if (
        root?.contains(target as Node | null) ||
        surface?.contains(target as Node | null)
      ) {
        return;
      }
      closeRef.current();
    };
    const layer = { onEscape: () => closeRef.current() };
    document.addEventListener("pointerdown", handlePointerDown, true);
    pushEscapeLayer(layer);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      removeEscapeLayer(layer);
    };
  }, [rootRef, session]);

  return {
    activeId,
    activeRowId: session ? dropdownRowDomId(listId, activeId) : undefined,
    close,
    handleBeforeInput,
    handleInput: refresh,
    handleKeyDown,
    handleSelectionChange: refresh,
    listId,
    open: Boolean(session),
    query: session?.query ?? "",
    sections,
    selectItem,
    setActiveId,
    surfaceRef,
  };
}

function createCommands(
  rootRef: RefObject<HTMLElement | null>,
  commitDocument: CommitDocument,
): RichTextEditorCommands {
  return {
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
    toggleMark: (_mark: InlineMark) => {
      devWarn(
        "RichTextEditor: `commands.toggleMark` is reserved for M3 inline formatting.",
      );
      throw new Error(
        "RichTextEditor: commands.toggleMark is not implemented until M3.",
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
  };
}

function canOpenSlashMenu(root: HTMLElement, position: DocPosition): boolean {
  const doc = serializeRichTextDom(root);
  const block = doc[position.block];
  const text = textBlockPlainText(block);
  if (text === null) {
    return false;
  }
  const before = text.slice(0, position.offset);
  return before.length === 0 || /\s$/.test(before);
}

function readSlashSession(
  root: HTMLElement,
  current: SlashMenuSession,
): SlashMenuSession | null {
  const range = docRangeFromDomSelection(root, window.getSelection());
  if (!range || !samePosition(range.from, range.to)) {
    return null;
  }
  const position = range.from;
  if (
    position.block !== current.blockIndex ||
    position.offset <= current.slashOffset
  ) {
    return null;
  }
  const doc = serializeRichTextDom(root);
  const block = doc[current.blockIndex];
  const text = textBlockPlainText(block);
  if (text === null || text[current.slashOffset] !== "/") {
    return null;
  }
  const query = text.slice(current.slashOffset + 1, position.offset);
  if (/\s/.test(query)) {
    return null;
  }
  return { ...current, query };
}

function readStoredSlashSession(
  root: HTMLElement,
  current: SlashMenuSession,
): SlashMenuSession | null {
  const doc = serializeRichTextDom(root);
  const block = doc[current.blockIndex];
  const text = textBlockPlainText(block);
  if (
    text === null ||
    text[current.slashOffset] !== "/" ||
    /\s/.test(current.query)
  ) {
    return null;
  }
  const end = current.slashOffset + current.query.length + 1;
  return text.slice(current.slashOffset + 1, end) === current.query
    ? current
    : null;
}

function insertDivider(
  document: readonly RichTextBlock[],
  session: SlashMenuSession,
): { caret: DocPosition; document: RichTextDocument } {
  const doc = normalizeDocument(document);
  const block = doc[session.blockIndex];
  if (!block || blockTextLength(block) === 0) {
    return {
      caret: { block: session.blockIndex + 1, offset: 0 },
      document: normalizeDocument([
        ...doc.slice(0, session.blockIndex),
        { type: "divider" },
        { spans: [], type: "paragraph" },
        ...doc.slice(session.blockIndex + 1),
      ]),
    };
  }
  return {
    caret: { block: session.blockIndex + 2, offset: 0 },
    document: normalizeDocument([
      ...doc.slice(0, session.blockIndex + 1),
      { type: "divider" },
      { spans: [], type: "paragraph" },
      ...doc.slice(session.blockIndex + 1),
    ]),
  };
}

function turnSelectedBlocksInto(
  document: readonly RichTextBlock[],
  selection: { from: DocPosition; to: DocPosition },
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

function textBlockPlainText(block: RichTextBlock | undefined): string | null {
  if (!block || block.type === "divider" || block.type === "codeBlock") {
    return null;
  }
  return spansText(block.spans);
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

function swallowKey(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function eventTargetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) {
    return target;
  }
  return target instanceof Node ? target.parentElement : null;
}
