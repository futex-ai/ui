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
import { useSharedUiTheme } from "../theme";
import { Label } from "../typography";

import { renderRichTextDocument } from "./domRender.web";
import { serializeRichTextDom } from "./domSerialize.web";
import {
  docPositionFromDom,
  docRangeFromDomSelection,
  domRangeFromDocPosition,
  isAtBlockEnd,
  isAtBlockStart,
} from "./domSelection.web";
import { matchPrefixInputRule } from "./inputRules";
import { parseMarkdown } from "./markdownParse";
import { serializeMarkdown } from "./markdownSerialize";
import {
  DocPosition,
  RichTextBlock,
  RichTextDocument,
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
  turnInto,
} from "./richTextModel";
import { createRichTextDomTheme, createRichTextStyles } from "./richTextStyles";
import type { RichTextEditorProps } from "./richTextTypes";

type LastRule = {
  block: number;
  literal: string;
};

/**
 * ContentEditable rich text editor for React Native Web. The document DOM is
 * managed imperatively; React renders only the labelled frame and placeholder.
 */
export function RichTextEditor({
  autoFocus = false,
  label,
  maxHeight,
  minHeight = 120,
  onChangeMarkdown,
  placeholder,
  readOnly = false,
  testID,
  value = "",
}: RichTextEditorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRichTextStyles(theme), [theme]);
  const domTheme = useMemo(() => createRichTextDomTheme(theme), [theme]);
  const focus = useFocusRing();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<RichTextDocument>(parseMarkdown(value));
  const composingRef = useRef(false);
  const hasRenderedRef = useRef(false);
  const lastEmittedRef = useRef(value);
  const lastRuleRef = useRef<LastRule | null>(null);
  const onChangeRef = useRef(onChangeMarkdown);
  const readOnlyRef = useRef(readOnly);
  const [empty, setEmpty] = useState(() => isEmptyDocument(docRef.current));

  useEffect(() => {
    onChangeRef.current = onChangeMarkdown;
    readOnlyRef.current = readOnly;
  }, [onChangeMarkdown, readOnly]);

  const restoreCaret = useCallback((position: DocPosition) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const range = domRangeFromDocPosition(root, position);
    if (!range) {
      return;
    }
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  const emitMarkdown = useCallback((document: readonly RichTextBlock[]) => {
    const markdown = serializeMarkdown(document);
    if (markdown !== lastEmittedRef.current) {
      lastEmittedRef.current = markdown;
      onChangeRef.current?.(markdown);
    }
  }, []);

  const commitDocument = useCallback(
    (document: readonly RichTextBlock[], caret: DocPosition | null) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const normalized = renderRichTextDocument(root, document, domTheme);
      docRef.current = normalized;
      setEmpty(isEmptyDocument(normalized));
      if (caret) {
        restoreCaret(clampPosition(normalized, caret));
      }
      emitMarkdown(normalized);
    },
    [domTheme, emitMarkdown, restoreCaret],
  );

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
        restoreCaret(documentEnd(next));
      }
    }
  }, [restoreCaret, value]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !hasRenderedRef.current) {
      return;
    }
    const focused = document.activeElement === root;
    const caret = focused
      ? docPositionFromDom(root, window.getSelection())
      : null;
    const next = renderRichTextDocument(root, docRef.current, domTheme);
    docRef.current = next;
    setEmpty(isEmptyDocument(next));
    if (focused && caret) {
      restoreCaret(caret);
    }
  }, [domTheme, restoreCaret]);

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
      commit: (
        document: readonly RichTextBlock[],
        caret: DocPosition | null,
      ) => void,
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
        );
        lastRuleRef.current = null;
        return true;
      }
      commit(turnInto(cleared, position.block, rule.value), {
        block: position.block,
        offset: 0,
      });
      lastRuleRef.current = { block: position.block, literal: rule.literal };
      return true;
    },
    [],
  );

  const tryRevertLastRule = useCallback(
    (
      event: InputEvent,
      root: HTMLElement,
      position: DocPosition,
      commit: (
        document: readonly RichTextBlock[],
        caret: DocPosition | null,
      ) => void,
    ) => {
      const lastRule = lastRuleRef.current;
      if (
        !lastRule ||
        lastRule.block !== position.block ||
        position.offset !== 0
      ) {
        return false;
      }
      event.preventDefault();
      const doc = serializeRichTextDom(root);
      const next = [
        ...doc.slice(0, position.block),
        {
          spans: [{ marks: [], text: lastRule.literal }],
          type: "paragraph",
        } as RichTextBlock,
        ...doc.slice(position.block + 1),
      ];
      commit(next, { block: position.block, offset: lastRule.literal.length });
      lastRuleRef.current = null;
      return true;
    },
    [],
  );

  const handleBeforeInput = useCallback(
    (
      event: InputEvent,
      root: HTMLElement,
      commit: (
        document: readonly RichTextBlock[],
        caret: DocPosition | null,
      ) => void,
    ) => {
      if (readOnlyRef.current || composingRef.current) {
        return;
      }
      const selection = window.getSelection();
      const range = docRangeFromDomSelection(root, selection);
      if (!range) {
        return;
      }
      const collapsed = samePosition(range.from, range.to);
      if (!collapsed && range.from.block !== range.to.block) {
        handleCrossBlockBeforeInput(event, root, range.from, range.to, commit);
        return;
      }
      if (
        event.inputType === "deleteContentBackward" &&
        collapsed &&
        tryRevertLastRule(event, root, range.from, commit)
      ) {
        return;
      }
      if (
        event.inputType === "insertText" &&
        event.data &&
        applyPrefixRule(event, root, range.from, commit)
      ) {
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
      }
    },
    [applyPrefixRule, tryRevertLastRule],
  );

  const handlePaste = useCallback(
    (
      event: ClipboardEvent,
      root: HTMLElement,
      commit: (
        document: readonly RichTextBlock[],
        caret: DocPosition | null,
      ) => void,
    ) => {
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
    },
    [],
  );

  const handleMouseDown = useCallback(
    (
      event: MouseEvent,
      root: HTMLElement,
      commit: (
        document: readonly RichTextBlock[],
        caret: DocPosition | null,
      ) => void,
    ) => {
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
    },
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }
    const beforeInput = (event: InputEvent) => {
      handleBeforeInput(event, root, commitDocument);
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
    };
    const paste = (event: ClipboardEvent) => {
      handlePaste(event, root, commitDocument);
    };
    const compositionStart = () => {
      composingRef.current = true;
    };
    const compositionEnd = () => {
      composingRef.current = false;
      lastRuleRef.current = null;
      const next = serializeRichTextDom(root);
      docRef.current = next;
      setEmpty(isEmptyDocument(next));
      emitMarkdown(next);
    };
    const mouseDown = (event: MouseEvent) => {
      handleMouseDown(event, root, commitDocument);
    };
    const selectionChange = () => {
      if (!root.contains(document.activeElement)) {
        return;
      }
      const lastRule = lastRuleRef.current;
      if (!lastRule) {
        return;
      }
      const position = docPositionFromDom(root, window.getSelection());
      if (
        position &&
        position.block === lastRule.block &&
        position.offset === 0
      ) {
        return;
      }
      lastRuleRef.current = null;
    };
    root.addEventListener("beforeinput", beforeInput);
    root.addEventListener("input", input);
    root.addEventListener("paste", paste);
    root.addEventListener("compositionstart", compositionStart);
    root.addEventListener("compositionend", compositionEnd);
    root.addEventListener("mousedown", mouseDown);
    document.addEventListener("selectionchange", selectionChange);
    return () => {
      root.removeEventListener("beforeinput", beforeInput);
      root.removeEventListener("input", input);
      root.removeEventListener("paste", paste);
      root.removeEventListener("compositionstart", compositionStart);
      root.removeEventListener("compositionend", compositionEnd);
      root.removeEventListener("mousedown", mouseDown);
      document.removeEventListener("selectionchange", selectionChange);
    };
  }, [
    commitDocument,
    emitMarkdown,
    handleBeforeInput,
    handleMouseDown,
    handlePaste,
  ]);

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
        outlineStyle: "none",
      }) as CSSProperties,
    [minHeight, styles.editor],
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
  commit: (
    document: readonly RichTextBlock[],
    caret: DocPosition | null,
  ) => void,
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
