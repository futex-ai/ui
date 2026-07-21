/** Native block rich-text editor with a keyboard-adjacent formatting toolbar. */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TextInput } from "react-native";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { NativeRichTextEditorSurface } from "./NativeRichTextEditorSurface";
import { parseMarkdown } from "./markdownParse";
import { serializeMarkdown } from "./markdownSerialize";
import { marksForNativeSelection } from "./nativeRichTextEditing";
import type {
  NativeRichTextTarget,
  NativeTypingMarksOverride,
} from "./nativeRichTextEditing";
import { createNativeRichTextStyles } from "./nativeRichTextStyles";
import type {
  RichTextHistoryEditKind,
  RichTextHistorySnapshot,
} from "./richTextHistory";
import {
  blockTextLength,
  normalizeDocument,
  richTextDocumentsEqual,
} from "./richTextModel";
import type { InlineMark, RichTextDocument } from "./richTextModel";
import type { RichTextEditorProps } from "./richTextTypes";
import { useNativeRichTextCommands } from "./useNativeRichTextCommands";
import { useNativeRichTextHistory } from "./useNativeRichTextHistory";

/** Rich text editor for native iOS and Android using the shared block model. */
export function RichTextEditor({
  autoFocus = false,
  disableFocusRing = false,
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
  const styles = useMemo(() => createNativeRichTextStyles(theme), [theme]);
  const focus = useFocusRing({ disabled: disableFocusRing });
  const accessoryId = `rich-text-${useId().replace(/:/g, "")}`;
  const initialDocument = useMemo(() => parseMarkdown(value), []);
  const documentRef = useRef<RichTextDocument>(initialDocument);
  const [document, setDocument] = useState(initialDocument);
  const [activeBlock, setActiveBlock] = useState(0);
  const activeBlockRef = useRef(0);
  const initialSelection = { end: 0, start: 0 };
  const selectionRef = useRef<NativeRichTextTarget>({
    block: 0,
    selection: initialSelection,
  });
  const [activeMarks, setActiveMarks] = useState<InlineMark[]>([]);
  const activeMarksRef = useRef<InlineMark[]>([]);
  const typingMarksOverrideRef = useRef<NativeTypingMarksOverride | null>(null);
  const [editorFocused, setEditorFocused] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const pendingFocusRef = useRef<NativeRichTextTarget | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const lastEmittedRef = useRef(value);
  const onChangeRef = useRef(onChangeMarkdown);

  useEffect(() => {
    onChangeRef.current = onChangeMarkdown;
  }, [onChangeMarkdown]);

  const emitMarkdown = useCallback(
    (next: readonly RichTextDocument[number][]) => {
      const markdown = serializeMarkdown(next);
      if (markdown === lastEmittedRef.current) return;
      lastEmittedRef.current = markdown;
      onChangeRef.current?.(markdown);
    },
    [],
  );

  const scheduleFocus = useCallback((target: NativeRichTextTarget) => {
    pendingFocusRef.current = target;
    setFocusRequest((request) => request + 1);
  }, []);

  const applyDocument = useCallback(
    (
      nextDocument: readonly RichTextDocument[number][],
      target: NativeRichTextTarget,
      forceFocus: boolean,
      typingMarks?: readonly InlineMark[],
    ) => {
      const next = normalizeDocument(nextDocument);
      documentRef.current = next;
      setDocument(next);
      activeBlockRef.current = target.block;
      selectionRef.current = target;
      setActiveBlock(target.block);
      const marks =
        typingMarks === undefined
          ? marksForNativeSelection(next, target.block, target.selection)
          : [...typingMarks];
      typingMarksOverrideRef.current =
        typingMarks === undefined ? null : { marks, target };
      activeMarksRef.current = marks;
      setActiveMarks(marks);
      if (forceFocus) scheduleFocus(target);
      emitMarkdown(next);
    },
    [emitMarkdown, scheduleFocus],
  );

  const {
    availability: historyAvailability,
    recordEdit,
    reset: resetHistory,
    traverse: traverseHistory,
  } = useNativeRichTextHistory({
    applyDocument,
    documentRef,
    selectionRef,
  });

  const commitDocument = useCallback(
    (
      nextDocument: readonly RichTextDocument[number][],
      target: NativeRichTextTarget,
      kind: RichTextHistoryEditKind,
      forceFocus = true,
      historySnapshot?: RichTextHistorySnapshot,
      typingMarks?: readonly InlineMark[],
    ) => {
      if (richTextDocumentsEqual(documentRef.current, nextDocument)) return;
      recordEdit(kind, historySnapshot);
      applyDocument(nextDocument, target, forceFocus, typingMarks);
    },
    [applyDocument, recordEdit],
  );

  const {
    handleFocus,
    handleInsertBlock,
    handleKeyPress,
    handleSelectionChange,
    handleTextChange,
    handleToggleCheck,
    handleToggleMark,
    handleTurnInto,
    resetTransientState,
  } = useNativeRichTextCommands({
    activeBlockRef,
    activeMarksRef,
    commitDocument,
    documentRef,
    onActiveBlockChange: setActiveBlock,
    onActiveMarksChange: setActiveMarks,
    onEditorFocus: () => {
      setEditorFocused(true);
      focus.onFocus();
    },
    readOnly,
    scheduleFocus,
    selectionRef,
    typingMarksOverrideRef,
  });

  useLayoutEffect(() => {
    const target = pendingFocusRef.current;
    if (!target || readOnly) return;
    pendingFocusRef.current = null;
    const input = inputRefs.current[target.block];
    input?.focus();
    input?.setNativeProps({ selection: target.selection });
  }, [document, focusRequest, readOnly]);

  useEffect(() => {
    if (!autoFocus || readOnly) return;
    scheduleFocus({ block: 0, selection: { end: 0, start: 0 } });
  }, [autoFocus, readOnly, scheduleFocus]);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const next = parseMarkdown(value);
    lastEmittedRef.current = value;
    documentRef.current = next;
    setDocument(next);
    resetHistory();
    resetTransientState();
    if (editorFocused && !readOnly) {
      const block = next.length - 1;
      const offset = blockTextLength(next[block]);
      scheduleFocus({ block, selection: { end: offset, start: offset } });
    }
  }, [
    editorFocused,
    readOnly,
    resetHistory,
    resetTransientState,
    scheduleFocus,
    value,
  ]);

  return (
    <NativeRichTextEditorSurface
      accessoryId={accessoryId}
      activeBlock={activeBlock}
      activeMarks={activeMarks}
      canRedo={historyAvailability.canRedo}
      canUndo={historyAvailability.canUndo}
      document={document}
      editorFocused={editorFocused}
      focusRingStyle={focus.focusRingStyle}
      focusVisible={focus.focused}
      label={label}
      maxHeight={maxHeight}
      minHeight={minHeight}
      onBlur={() => {
        setEditorFocused(false);
        focus.onBlur();
      }}
      onChangeText={handleTextChange}
      onFocus={handleFocus}
      onInputRef={(block, input) => {
        inputRefs.current[block] = input;
      }}
      onInsertBlock={() => handleInsertBlock()}
      onInsertDivider={() => handleInsertBlock("divider")}
      onKeyPress={handleKeyPress}
      onRedo={() => traverseHistory("redo")}
      onRequestFocus={scheduleFocus}
      onSelectionChange={handleSelectionChange}
      onToggleCheck={handleToggleCheck}
      onToggleMark={handleToggleMark}
      onTurnInto={handleTurnInto}
      onUndo={() => traverseHistory("undo")}
      placeholder={placeholder}
      readOnly={readOnly}
      styles={styles}
      testID={testID}
      theme={theme}
    />
  );
}
