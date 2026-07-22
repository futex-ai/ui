/** Web RichTextEditor implementation backed by a contentEditable root. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useFocusRing } from "../focusRing";
import { useDocumentKeyCapture } from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";
import { Label } from "../typography";

import { SlashMenu } from "./SlashMenu.web";
import { renderRichTextDocument } from "./domRender.web";
import { serializeRichTextDom } from "./domSerialize.web";
import {
  docPositionFromDom,
  docRangeFromDomSelection,
  domRangeFromDocSelection,
  domRangeFromDocPosition,
  isAfterEditorCaretBoundary,
  isAtBlockEnd,
  isAtBlockStart,
} from "./domSelection.web";
import {
  applyInlineInputRule,
  matchInlineInputRule,
  matchPrefixInputRule,
} from "./inputRules";
import { parseMarkdown } from "./markdownParse";
import { serializeMarkdown } from "./markdownSerialize";
import {
  RichTextHistorySnapshot,
  collapsedHistoryCaret,
  createRichTextHistoryState,
  recordRichTextHistory,
  redoRichTextHistory,
  undoRichTextHistory,
} from "./richTextHistory";
import {
  DocSelection,
  DocPosition,
  InlineMark,
  RichTextBlock,
  RichTextDocument,
  RichTextTurnIntoType,
  blockTextLength,
  deleteForward,
  deleteRange,
  insertBlocks,
  insertSoftBreak,
  insertText,
  isEmptyDocument,
  mergeBackward,
  normalizeDocument,
  spansText,
  splitBlock,
  toggleMarkInRange,
  turnInto,
} from "./richTextModel";
import { createRichTextDomTheme, createRichTextStyles } from "./richTextStyles";
import type { RichTextEditorProps } from "./richTextTypes";
import { useEditorCommands } from "./useEditorCommands.web";
import { useSlashMenu } from "./useSlashMenu.web";

type CommitSelection = DocPosition | DocSelection | null;

type CommitDocument = (
  document: readonly RichTextBlock[],
  selection: CommitSelection,
  historySnapshot?: RichTextHistorySnapshot,
) => void;

type LastRule =
  | {
      block: number;
      literal: string;
      type: "prefix";
    }
  | {
      block: number;
      from: number;
      literal: string;
      to: number;
      type: "inline";
    };

/**
 * ContentEditable rich text editor for React Native Web. The document DOM is
 * managed imperatively; React renders only the labelled frame and placeholder.
 */
export function RichTextEditor({
  autoFocus = false,
  disableFocusRing = false,
  label,
  maxHeight,
  minHeight = 120,
  onChangeMarkdown,
  placeholder,
  readOnly = false,
  slashExtraItems = [],
  testID,
  value = "",
}: RichTextEditorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRichTextStyles(theme), [theme]);
  const domTheme = useMemo(() => createRichTextDomTheme(theme), [theme]);
  const focus = useFocusRing({ disabled: disableFocusRing });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<RichTextDocument>(parseMarkdown(value));
  const composingRef = useRef(false);
  const hasRenderedRef = useRef(false);
  const historyRef = useRef(createRichTextHistoryState());
  const lastEmittedRef = useRef(value);
  const lastRuleRef = useRef<LastRule | null>(null);
  const onChangeRef = useRef(onChangeMarkdown);
  const readOnlyRef = useRef(readOnly);
  const [empty, setEmpty] = useState(() => isEmptyDocument(docRef.current));

  useEffect(() => {
    onChangeRef.current = onChangeMarkdown;
    readOnlyRef.current = readOnly;
  }, [onChangeMarkdown, readOnly]);

  const restoreSelection = useCallback(
    (target: Exclude<CommitSelection, null>) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const range = isDocSelection(target)
        ? domRangeFromDocSelection(root, target)
        : domRangeFromDocPosition(root, target);
      if (!range) {
        return;
      }
      const domSelection = window.getSelection();
      domSelection?.removeAllRanges();
      domSelection?.addRange(range);
    },
    [],
  );

  const emitMarkdown = useCallback((document: readonly RichTextBlock[]) => {
    const markdown = serializeMarkdown(document);
    if (markdown !== lastEmittedRef.current) {
      lastEmittedRef.current = markdown;
      onChangeRef.current?.(markdown);
    }
  }, []);

  const commitDocument = useCallback(
    (document: readonly RichTextBlock[], selection: CommitSelection) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const normalized = renderRichTextDocument(root, document, domTheme);
      docRef.current = normalized;
      setEmpty(isEmptyDocument(normalized));
      if (selection) {
        restoreSelection(clampSelection(normalized, selection));
      }
      emitMarkdown(normalized);
    },
    [domTheme, emitMarkdown, restoreSelection],
  );

  const recordHistory = useCallback(
    (
      kind: "model" | "typing",
      snapshot: RichTextHistorySnapshot | null = null,
    ) => {
      const root = rootRef.current;
      if (!root && !snapshot) {
        return;
      }
      const nextSnapshot = snapshot ?? (root ? snapshotFromDom(root) : null);
      if (!nextSnapshot) {
        return;
      }
      historyRef.current = recordRichTextHistory(
        historyRef.current,
        nextSnapshot,
        kind,
        Date.now(),
      );
    },
    [],
  );

  const applyDocument = useCallback<CommitDocument>(
    (document, selection, historySnapshot) => {
      recordHistory("model", historySnapshot ?? null);
      commitDocument(document, selection);
    },
    [commitDocument, recordHistory],
  );

  const editorCommands = useEditorCommands({
    commitDocument: applyDocument,
    rootRef,
  });

  const slashMenu = useSlashMenu({
    commands: editorCommands,
    commitDocument: applyDocument,
    extraItems: slashExtraItems,
    readOnlyRef,
    rootRef,
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    if (!hasRenderedRef.current || value !== lastEmittedRef.current) {
      const next = parseMarkdown(value);
      renderRichTextDocument(root, next, domTheme);
      docRef.current = next;
      setEmpty(isEmptyDocument(next));
      lastEmittedRef.current = value;
      hasRenderedRef.current = true;
      if (document.activeElement === root) {
        restoreSelection(documentEnd(next));
      }
    }
  }, [restoreSelection, value]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !hasRenderedRef.current) {
      return;
    }
    const focused = document.activeElement === root;
    const selection = focused
      ? docRangeFromDomSelection(root, window.getSelection())
      : null;
    const next = renderRichTextDocument(root, docRef.current, domTheme);
    docRef.current = next;
    setEmpty(isEmptyDocument(next));
    if (focused && selection) {
      restoreSelection(selection);
    }
  }, [domTheme, restoreSelection]);

  useEffect(() => {
    if (autoFocus) {
      rootRef.current?.focus();
    }
  }, [autoFocus]);

  const applyPrefixRule = useCallback(
    (
      event: InputEvent,
      root: HTMLElement,
      position: DocPosition,
      commit: CommitDocument,
    ) => {
      const doc = serializeRichTextDom(root);
      const block = doc[position.block];
      if (!block || block.type === "codeBlock" || block.type === "divider") {
        return false;
      }
      const text = spansText(block.spans);
      const before = text.slice(0, position.offset);
      const after = text.slice(position.offset);
      const rule = matchPrefixInputRule({
        insertedText: event.data ?? "",
        textAfterCaret: after,
        textBeforeCaret: before,
      });
      if (!rule) {
        return false;
      }
      event.preventDefault();
      const inserted = event.data ?? "";
      const literalDoc = insertText(doc, position, inserted);
      const literalCaret = {
        block: position.block,
        offset: position.offset + inserted.length,
      };
      const cleared = deleteRange(
        doc,
        {
          block: position.block,
          offset: position.offset - rule.deleteTriggerLength,
        },
        position,
      );
      if (rule.type === "divider") {
        commit(
          insertBlocks(cleared, { block: position.block, offset: 0 }, [
            { type: "divider" },
            { spans: [], type: "paragraph" },
          ]),
          { block: position.block + 1, offset: 0 },
          {
            caret: collapsedHistoryCaret(literalCaret),
            doc: literalDoc,
          },
        );
        lastRuleRef.current = null;
        return true;
      }
      commit(
        turnInto(cleared, position.block, rule.value),
        {
          block: position.block,
          offset: 0,
        },
        {
          caret: collapsedHistoryCaret(literalCaret),
          doc: literalDoc,
        },
      );
      lastRuleRef.current = {
        block: position.block,
        literal: rule.literal,
        type: "prefix",
      };
      return true;
    },
    [],
  );

  const applyInlineRule = useCallback(
    (
      event: InputEvent,
      root: HTMLElement,
      position: DocPosition,
      commit: CommitDocument,
    ) => {
      const inserted = event.data ?? "";
      if (inserted.length === 0) {
        return false;
      }
      const doc = serializeRichTextDom(root);
      const block = doc[position.block];
      if (!block || block.type === "codeBlock" || block.type === "divider") {
        return false;
      }
      const text = spansText(block.spans);
      const rule = matchInlineInputRule({
        insertedText: inserted,
        textBeforeCaret: text.slice(0, position.offset),
      });
      if (!rule) {
        return false;
      }
      event.preventDefault();
      const literalDoc = insertText(doc, position, inserted);
      const formatted = applyInlineInputRule(literalDoc, position.block, rule);
      commit(
        formatted.document,
        { block: position.block, offset: formatted.contentTo },
        {
          caret: collapsedHistoryCaret({
            block: position.block,
            offset: rule.triggerTo,
          }),
          doc: literalDoc,
        },
      );
      lastRuleRef.current = {
        block: position.block,
        from: formatted.contentFrom,
        literal: rule.literal,
        to: formatted.contentTo,
        type: "inline",
      };
      return true;
    },
    [],
  );

  const tryRevertLastRule = useCallback(
    (
      event: InputEvent,
      root: HTMLElement,
      position: DocPosition,
      commit: CommitDocument,
    ) => {
      const lastRule = lastRuleRef.current;
      if (!lastRule || lastRule.block !== position.block) {
        return false;
      }
      const doc = serializeRichTextDom(root);
      if (lastRule.type === "prefix") {
        if (position.offset !== 0) {
          return false;
        }
        event.preventDefault();
        const next = [
          ...doc.slice(0, position.block),
          {
            spans: [{ marks: [], text: lastRule.literal }],
            type: "paragraph",
          } as RichTextBlock,
          ...doc.slice(position.block + 1),
        ];
        commit(next, {
          block: position.block,
          offset: lastRule.literal.length,
        });
        lastRuleRef.current = null;
        return true;
      }
      if (position.offset !== lastRule.to) {
        return false;
      }
      event.preventDefault();
      const base = deleteRange(
        doc,
        { block: lastRule.block, offset: lastRule.from },
        { block: lastRule.block, offset: lastRule.to },
      );
      commit(
        insertText(
          base,
          { block: lastRule.block, offset: lastRule.from },
          lastRule.literal,
        ),
        {
          block: lastRule.block,
          offset: lastRule.from + lastRule.literal.length,
        },
      );
      lastRuleRef.current = null;
      return true;
    },
    [],
  );

  const applyHistory = useCallback(
    (direction: "redo" | "undo") => {
      const root = rootRef.current;
      if (!root) {
        return false;
      }
      const current = snapshotFromDom(root);
      if (!current) {
        return false;
      }
      const transition =
        direction === "undo"
          ? undoRichTextHistory(historyRef.current, current)
          : redoRichTextHistory(historyRef.current, current);
      if (!transition) {
        return false;
      }
      historyRef.current = transition.history;
      commitDocument(transition.snapshot.doc, transition.snapshot.caret);
      lastRuleRef.current = null;
      slashMenu.close();
      return true;
    },
    [commitDocument, slashMenu],
  );

  const handleBeforeInput = useCallback(
    (event: InputEvent, root: HTMLElement, commit: CommitDocument) => {
      if (readOnlyRef.current || composingRef.current) {
        return;
      }
      const historyDirection = historyBeforeInputDirection(event);
      if (historyDirection) {
        event.preventDefault();
        applyHistory(historyDirection);
        return;
      }
      if (shouldRecordNativeModelInput(event)) {
        recordHistory("model");
        lastRuleRef.current = null;
        slashMenu.close();
        return;
      }
      const selection = window.getSelection();
      const range = docRangeFromDomSelection(root, selection);
      if (!range) {
        return;
      }
      const collapsed = samePosition(range.from, range.to);
      const formatMark = formatBeforeInputMark(event);
      if (formatMark) {
        event.preventDefault();
        editorCommands.toggleMark(formatMark);
        lastRuleRef.current = null;
        slashMenu.close();
        return;
      }
      if (!collapsed && range.from.block !== range.to.block) {
        handleCrossBlockBeforeInput(event, root, range.from, range.to, commit);
        slashMenu.close();
        return;
      }
      if (collapsed) {
        slashMenu.handleBeforeInput(event, range.from);
      }
      if (
        event.inputType === "deleteContentBackward" &&
        collapsed &&
        tryRevertLastRule(event, root, range.from, commit)
      ) {
        return;
      }
      if (
        event.inputType === "deleteContentBackward" &&
        collapsed &&
        range.from.offset > 0 &&
        isAfterEditorCaretBoundary(selection)
      ) {
        event.preventDefault();
        const doc = serializeRichTextDom(root);
        const from = {
          block: range.from.block,
          offset: range.from.offset - 1,
        };
        commit(deleteRange(doc, from, range.from), from);
        lastRuleRef.current = null;
        slashMenu.close();
        return;
      }
      if (
        event.inputType === "insertText" &&
        event.data &&
        applyPrefixRule(event, root, range.from, commit)
      ) {
        return;
      }
      if (
        collapsed &&
        event.inputType === "insertText" &&
        event.data &&
        applyInlineRule(event, root, range.from, commit)
      ) {
        slashMenu.close();
        return;
      }
      if (event.inputType === "insertParagraph") {
        event.preventDefault();
        const doc = serializeRichTextDom(root);
        const base = collapsed ? doc : deleteRange(doc, range.from, range.to);
        commit(splitBlock(base, range.from), caretAfterSplit(base, range.from));
        lastRuleRef.current = null;
        return;
      }
      if (event.inputType === "insertLineBreak") {
        event.preventDefault();
        const doc = serializeRichTextDom(root);
        const base = collapsed ? doc : deleteRange(doc, range.from, range.to);
        commit(insertSoftBreak(base, range.from), {
          block: range.from.block,
          offset: range.from.offset + 1,
        });
        lastRuleRef.current = null;
        return;
      }
      if (
        event.inputType === "deleteContentBackward" &&
        collapsed &&
        isAtBlockStart(root, selection)
      ) {
        event.preventDefault();
        const doc = serializeRichTextDom(root);
        commit(
          mergeBackward(doc, range.from),
          caretAfterMergeBackward(doc, range.from),
        );
        lastRuleRef.current = null;
        return;
      }
      if (
        event.inputType === "deleteContentForward" &&
        collapsed &&
        isAtBlockEnd(root, selection)
      ) {
        event.preventDefault();
        const doc = serializeRichTextDom(root);
        commit(deleteForward(doc, range.from), range.from);
        lastRuleRef.current = null;
        return;
      }
      if (shouldRecordNativeInput(event)) {
        recordHistory("typing");
      }
    },
    [
      applyHistory,
      applyInlineRule,
      applyPrefixRule,
      editorCommands,
      recordHistory,
      slashMenu,
      tryRevertLastRule,
    ],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent, root: HTMLElement, commit: CommitDocument) => {
      if (readOnlyRef.current) {
        return;
      }
      const markdown = event.clipboardData?.getData("text/plain") ?? "";
      if (markdown.length === 0) {
        return;
      }
      event.preventDefault();
      const selection = docRangeFromDomSelection(root, window.getSelection());
      const doc = serializeRichTextDom(root);
      const insertAt = selection?.from ?? documentEnd(doc);
      const base =
        selection && !samePosition(selection.from, selection.to)
          ? deleteRange(doc, selection.from, selection.to)
          : doc;
      const blocks = parseMarkdown(markdown);
      commit(
        insertBlocks(base, insertAt, blocks),
        caretAfterInsertBlocks(base, insertAt, blocks),
      );
      lastRuleRef.current = null;
      slashMenu.close();
    },
    [slashMenu],
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent, root: HTMLElement, commit: CommitDocument) => {
      if (readOnlyRef.current || !(event.target instanceof HTMLElement)) {
        return;
      }
      const checkbox = event.target.closest<HTMLElement>(
        '[data-rt="checkbox"]',
      );
      if (!checkbox) {
        return;
      }
      event.preventDefault();
      const item = checkbox.closest<HTMLElement>("[data-rt-index]");
      const index =
        item?.dataset.rtIndex === undefined
          ? null
          : Number(item.dataset.rtIndex);
      if (index === null) {
        return;
      }
      const doc = serializeRichTextDom(root);
      const block = doc[index];
      if (block?.type !== "check") {
        return;
      }
      const caret = docPositionFromDom(root, window.getSelection()) ?? {
        block: index,
        offset: blockTextLength(block),
      };
      commit(
        [
          ...doc.slice(0, index),
          { ...block, checked: !block.checked },
          ...doc.slice(index + 1),
        ],
        caret,
      );
      lastRuleRef.current = null;
      slashMenu.close();
    },
    [slashMenu],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }
    const beforeInput = (event: InputEvent) => {
      handleBeforeInput(event, root, applyDocument);
    };
    const input = () => {
      if (composingRef.current) {
        return;
      }
      lastRuleRef.current = null;
      const next = serializeRichTextDom(root);
      docRef.current = next;
      setEmpty(isEmptyDocument(next));
      emitMarkdown(next);
      slashMenu.handleInput();
    };
    const paste = (event: ClipboardEvent) => {
      handlePaste(event, root, applyDocument);
    };
    const compositionStart = () => {
      if (readOnlyRef.current) {
        return;
      }
      recordHistory("model");
      composingRef.current = true;
      lastRuleRef.current = null;
      slashMenu.close();
    };
    const compositionEnd = () => {
      composingRef.current = false;
      lastRuleRef.current = null;
      const next = serializeRichTextDom(root);
      docRef.current = next;
      setEmpty(isEmptyDocument(next));
      emitMarkdown(next);
      slashMenu.handleInput();
    };
    const mouseDown = (event: MouseEvent) => {
      handleMouseDown(event, root, applyDocument);
    };
    const selectionChange = () => {
      slashMenu.handleSelectionChange();
      const lastRule = lastRuleRef.current;
      if (!lastRule) {
        return;
      }
      // Stay armed only while the caret still sits exactly where the rule
      // left it; focus moving out of the editor is a movement too.
      if (root.contains(document.activeElement)) {
        const position = docPositionFromDom(root, window.getSelection());
        if (position && isLastRuleCaret(lastRule, position)) {
          return;
        }
      }
      lastRuleRef.current = null;
    };
    const focusOut = () => {
      lastRuleRef.current = null;
      slashMenu.close();
    };
    root.addEventListener("beforeinput", beforeInput);
    root.addEventListener("input", input);
    root.addEventListener("paste", paste);
    root.addEventListener("compositionstart", compositionStart);
    root.addEventListener("compositionend", compositionEnd);
    root.addEventListener("mousedown", mouseDown);
    root.addEventListener("focusout", focusOut);
    document.addEventListener("selectionchange", selectionChange);
    return () => {
      root.removeEventListener("beforeinput", beforeInput);
      root.removeEventListener("input", input);
      root.removeEventListener("paste", paste);
      root.removeEventListener("compositionstart", compositionStart);
      root.removeEventListener("compositionend", compositionEnd);
      root.removeEventListener("mousedown", mouseDown);
      root.removeEventListener("focusout", focusOut);
      document.removeEventListener("selectionchange", selectionChange);
    };
  }, [
    applyDocument,
    emitMarkdown,
    handleBeforeInput,
    handleMouseDown,
    handlePaste,
    recordHistory,
    slashMenu,
  ]);

  const handleDocumentKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const root = rootRef.current;
      if (
        !root ||
        readOnlyRef.current ||
        !root.contains(document.activeElement)
      ) {
        return;
      }
      if (slashMenu.handleKeyDown(event)) {
        return;
      }
      const historyDirection = historyKeyDirection(event);
      if (historyDirection) {
        swallowKey(event);
        applyHistory(historyDirection);
        return;
      }
      const mark = inlineShortcutMark(event);
      if (mark) {
        swallowKey(event);
        editorCommands.toggleMark(mark);
        lastRuleRef.current = null;
        slashMenu.close();
        return;
      }
      if (handleBlockShortcut(event, root, applyDocument)) {
        slashMenu.close();
      }
    },
    [applyDocument, applyHistory, editorCommands, slashMenu],
  );

  useDocumentKeyCapture(!readOnly, handleDocumentKeyDown);

  const frameStyle = useMemo(
    () => [
      styles.frame,
      minHeight === undefined ? null : { minHeight },
      maxHeight === undefined ? null : { maxHeight },
      focus.focused ? focus.focusRingStyle : null,
    ],
    [focus.focusRingStyle, focus.focused, maxHeight, minHeight, styles.frame],
  );
  const scrollFrameStyle = useMemo(
    () => [
      styles.scrollFrame,
      minHeight === undefined ? null : { minHeight },
      maxHeight === undefined ? null : { maxHeight },
    ],
    [maxHeight, minHeight, styles.scrollFrame],
  );
  const editorStyle = useMemo<CSSProperties>(
    () =>
      ({
        ...(StyleSheet.flatten(styles.editor) as CSSProperties),
        minHeight,
        // Suppress the UA outline on the contentEditable focus target while the
        // frame glow is the affordance; with the ring disabled, let the UA
        // outline return so keyboard focus stays visible (WCAG 2.1 — 2.4.7).
        outlineStyle: focus.ringEnabled ? "none" : undefined,
      }) as CSSProperties,
    [focus.ringEnabled, minHeight, styles.editor],
  );

  return (
    <View style={styles.field}>
      {label === undefined ? null : <Label>{label}</Label>}
      <View style={frameStyle}>
        <View style={scrollFrameStyle}>
          {placeholder && empty ? (
            <Text pointerEvents="none" style={styles.placeholder}>
              {placeholder}
            </Text>
          ) : null}
          <div
            aria-label={label ?? "Rich text editor"}
            aria-activedescendant={slashMenu.activeRowId}
            aria-controls={slashMenu.open ? slashMenu.listId : undefined}
            aria-multiline="true"
            contentEditable={!readOnly}
            data-testid={testID}
            onBlur={focus.onBlur}
            onFocus={focus.onFocus}
            ref={rootRef}
            role="textbox"
            style={editorStyle}
            suppressContentEditableWarning
            tabIndex={readOnly ? -1 : 0}
          />
          <SlashMenu
            activeId={slashMenu.activeId}
            listId={slashMenu.listId}
            onActiveIdChange={slashMenu.setActiveId}
            onClose={slashMenu.close}
            onSelect={slashMenu.selectItem}
            open={slashMenu.open}
            rootRef={rootRef}
            sections={slashMenu.sections}
            surfaceRef={slashMenu.surfaceRef}
          />
        </View>
      </View>
    </View>
  );
}

function handleCrossBlockBeforeInput(
  event: InputEvent,
  root: HTMLElement,
  from: DocPosition,
  to: DocPosition,
  commit: CommitDocument,
): void {
  event.preventDefault();
  const doc = serializeRichTextDom(root);
  const base = deleteRange(doc, from, to);
  if (event.inputType === "insertText" && event.data) {
    commit(insertText(base, from, event.data), {
      block: from.block,
      offset: from.offset + event.data.length,
    });
    return;
  }
  if (event.inputType === "insertParagraph") {
    commit(splitBlock(base, from), caretAfterSplit(base, from));
    return;
  }
  if (event.inputType === "insertLineBreak") {
    commit(insertSoftBreak(base, from), {
      block: from.block,
      offset: from.offset + 1,
    });
    return;
  }
  commit(base, from);
}

function handleBlockShortcut(
  event: KeyboardEvent,
  root: HTMLElement,
  commit: CommitDocument,
): boolean {
  const type = blockShortcutType(event);
  if (!type) {
    return false;
  }
  const selection = docRangeFromDomSelection(root, window.getSelection());
  if (!selection) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  const doc = serializeRichTextDom(root);
  let next = normalizeDocument(doc);
  for (
    let index = selection.from.block;
    index <= selection.to.block;
    index += 1
  ) {
    next = turnInto(next, index, shortcutTargetType(next[index], type));
  }
  commit(next, selection.from);
  return true;
}

function blockShortcutType(event: KeyboardEvent): RichTextTurnIntoType | null {
  if (!(event.metaKey || event.ctrlKey)) {
    return null;
  }
  if (event.altKey && !event.shiftKey) {
    if (isDigit(event, "1")) return "heading1";
    if (isDigit(event, "2")) return "heading2";
    if (isDigit(event, "3")) return "heading3";
  }
  if (event.shiftKey && !event.altKey) {
    if (isDigit(event, "7")) return "check";
    if (isDigit(event, "8")) return "bullet";
    if (isDigit(event, "9")) return "numbered";
  }
  return null;
}

function inlineShortcutMark(event: KeyboardEvent): InlineMark | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return null;
  }
  const key = event.key.toLowerCase();
  if (!event.shiftKey && key === "b") {
    return "bold";
  }
  if (!event.shiftKey && key === "i") {
    return "italic";
  }
  if (!event.shiftKey && key === "e") {
    return "code";
  }
  return event.shiftKey && key === "s" ? "strike" : null;
}

function historyKeyDirection(event: KeyboardEvent): "redo" | "undo" | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return null;
  }
  return event.key.toLowerCase() === "z"
    ? event.shiftKey
      ? "redo"
      : "undo"
    : null;
}

function historyBeforeInputDirection(
  event: InputEvent,
): "redo" | "undo" | null {
  if (event.inputType === "historyUndo") {
    return "undo";
  }
  return event.inputType === "historyRedo" ? "redo" : null;
}

function formatBeforeInputMark(event: InputEvent): InlineMark | null {
  if (event.inputType === "formatBold") {
    return "bold";
  }
  return event.inputType === "formatItalic" ? "italic" : null;
}

function shouldRecordNativeInput(event: InputEvent): boolean {
  return (
    event.inputType === "insertText" ||
    event.inputType === "deleteContentBackward" ||
    event.inputType === "deleteContentForward" ||
    event.inputType === "deleteWordBackward" ||
    event.inputType === "deleteWordForward"
  );
}

function shouldRecordNativeModelInput(event: InputEvent): boolean {
  return (
    event.inputType === "deleteByCut" ||
    event.inputType === "deleteByDrag" ||
    event.inputType === "insertFromDrop" ||
    event.inputType === "insertReplacementText"
  );
}

function swallowKey(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function shortcutTargetType(
  block: RichTextBlock | undefined,
  type: RichTextTurnIntoType,
): RichTextTurnIntoType {
  if (
    block?.type === type &&
    (type === "heading1" || type === "heading2" || type === "heading3")
  ) {
    return "paragraph";
  }
  return type;
}

function isDigit(event: KeyboardEvent, digit: string): boolean {
  return event.key === digit || event.code === `Digit${digit}`;
}

function caretAfterSplit(
  document: readonly RichTextBlock[],
  position: DocPosition,
): DocPosition {
  const doc = normalizeDocument(document);
  const block = doc[position.block];
  if (!block) {
    return documentEnd(doc);
  }
  if (block.type === "codeBlock") {
    return position.offset === block.code.length && block.code.endsWith("\n")
      ? { block: position.block + 1, offset: 0 }
      : { block: position.block, offset: position.offset + 1 };
  }
  if (
    (block.type === "bullet" ||
      block.type === "numbered" ||
      block.type === "check" ||
      block.type === "quote") &&
    blockTextLength(block) === 0
  ) {
    return { block: position.block, offset: 0 };
  }
  return { block: position.block + 1, offset: 0 };
}

function caretAfterMergeBackward(
  document: readonly RichTextBlock[],
  position: DocPosition,
): DocPosition {
  const doc = normalizeDocument(document);
  const block = doc[position.block];
  if (!block || block.type === "divider") {
    return position;
  }
  if (
    block.type === "bullet" ||
    block.type === "numbered" ||
    block.type === "check" ||
    block.type === "quote" ||
    block.type === "codeBlock"
  ) {
    return { block: position.block, offset: 0 };
  }
  if (position.block === 0) {
    return { block: 0, offset: 0 };
  }
  const previous = doc[position.block - 1];
  return {
    block: position.block - 1,
    offset: previous.type === "divider" ? 0 : blockTextLength(previous),
  };
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

function snapshotFromDom(root: HTMLElement): RichTextHistorySnapshot | null {
  const doc = serializeRichTextDom(root);
  return {
    caret:
      docRangeFromDomSelection(root, window.getSelection()) ??
      collapsedHistoryCaret(documentEnd(doc)),
    doc,
  };
}

function isLastRuleCaret(rule: LastRule, position: DocPosition): boolean {
  if (rule.block !== position.block) {
    return false;
  }
  return rule.type === "prefix"
    ? position.offset === 0
    : position.offset === rule.to;
}

function isDocSelection(target: CommitSelection): target is DocSelection {
  return Boolean(target && "from" in target && "to" in target);
}

function clampSelection(
  document: readonly RichTextBlock[],
  target: Exclude<CommitSelection, null>,
): Exclude<CommitSelection, null> {
  if (!isDocSelection(target)) {
    return clampPosition(document, target);
  }
  return {
    from: clampPosition(document, target.from),
    to: clampPosition(document, target.to),
  };
}

function clampPosition(
  document: readonly RichTextBlock[],
  position: DocPosition,
): DocPosition {
  const doc = normalizeDocument(document);
  const block = Math.min(Math.max(position.block, 0), doc.length - 1);
  return {
    block,
    offset: Math.min(Math.max(position.offset, 0), blockTextLength(doc[block])),
  };
}

function samePosition(left: DocPosition, right: DocPosition): boolean {
  return left.block === right.block && left.offset === right.offset;
}
