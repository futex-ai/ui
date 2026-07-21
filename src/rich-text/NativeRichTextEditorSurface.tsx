/** Presentational native rich-text frame, blocks, and mobile toolbar. */
import { ScrollView, TextInput, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { SharedUiTheme } from "../theme";
import { Label } from "../typography";

import { NativeRichTextBlock, nativeBlockKind } from "./NativeRichTextBlock";
import { NativeRichTextToolbar } from "./NativeRichTextToolbar";
import type { NativeRichTextTarget } from "./nativeRichTextEditing";
import type { NativeTextSelection } from "./nativeTextEdit";
import type { NativeRichTextStyles } from "./nativeRichTextStyles";
import type {
  InlineMark,
  RichTextDocument,
  RichTextTurnIntoType,
} from "./richTextModel";

export type NativeRichTextEditorSurfaceProps = {
  accessoryId: string;
  activeBlock: number;
  activeMarks: readonly InlineMark[];
  canRedo: boolean;
  canUndo: boolean;
  document: RichTextDocument;
  editorFocused: boolean;
  focusRingStyle: StyleProp<ViewStyle>;
  focusVisible: boolean;
  label?: string;
  maxHeight?: number;
  minHeight: number;
  onBlur: () => void;
  onChangeText: (block: number, text: string) => void;
  onFocus: (block: number) => void;
  onInputRef: (block: number, input: TextInput | null) => void;
  onInsertBlock: () => void;
  onInsertDivider: () => void;
  onKeyPress: (block: number, key: string) => void;
  onRedo: () => void;
  onRequestFocus: (target: NativeRichTextTarget) => void;
  onSelectionChange: (block: number, selection: NativeTextSelection) => void;
  onToggleCheck: (block: number) => void;
  onToggleMark: (mark: InlineMark) => void;
  onTurnInto: (type: RichTextTurnIntoType) => void;
  onUndo: () => void;
  placeholder?: string;
  readOnly: boolean;
  styles: NativeRichTextStyles;
  testID?: string;
  theme: SharedUiTheme;
};

/** Render the controlled native editor surface without owning edit state. */
export function NativeRichTextEditorSurface({
  accessoryId,
  activeBlock,
  activeMarks,
  canRedo,
  canUndo,
  document,
  editorFocused,
  focusRingStyle,
  focusVisible,
  label,
  maxHeight,
  minHeight,
  onBlur,
  onChangeText,
  onFocus,
  onInputRef,
  onInsertBlock,
  onInsertDivider,
  onKeyPress,
  onRedo,
  onRequestFocus,
  onSelectionChange,
  onToggleCheck,
  onToggleMark,
  onTurnInto,
  onUndo,
  placeholder,
  readOnly,
  styles,
  testID,
  theme,
}: NativeRichTextEditorSurfaceProps) {
  const frameStyle = [
    styles.frame,
    { maxHeight, minHeight },
    editorFocused ? styles.frameFocused : null,
    focusVisible ? focusRingStyle : null,
  ];
  const activeType = document[activeBlock]?.type ?? "paragraph";
  return (
    <View style={styles.field} testID={testID}>
      {label === undefined ? null : <Label>{label}</Label>}
      <View style={frameStyle}>
        <ScrollView
          contentContainerStyle={styles.editorBody}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {document.map((block, index) => (
            <NativeRichTextBlock
              accessibilityLabel={`${label ?? "Rich text editor"}, ${nativeBlockKind(block)}, block ${index + 1} of ${document.length}`}
              active={activeBlock === index}
              block={block}
              index={index}
              inputAccessoryViewID={accessoryId}
              inputRef={(input) => onInputRef(index, input)}
              key={index}
              listNumber={numberedListPosition(document, index)}
              onBlur={onBlur}
              onChangeText={onChangeText}
              onFocus={onFocus}
              onKeyPress={onKeyPress}
              onPressDivider={(divider) => {
                const targetBlock = Math.min(divider + 1, document.length - 1);
                onRequestFocus({
                  block: targetBlock,
                  selection: { end: 0, start: 0 },
                });
              }}
              onSelectionChange={onSelectionChange}
              onToggleCheck={onToggleCheck}
              placeholder={
                document.length === 1 && index === 0 ? placeholder : undefined
              }
              readOnly={readOnly}
              styles={styles}
              testID={testID ? `${testID}-block-${index}` : undefined}
              theme={theme}
            />
          ))}
        </ScrollView>
        {readOnly ? null : (
          <NativeRichTextToolbar
            activeMarks={activeMarks}
            blockType={activeType}
            canRedo={canRedo}
            canUndo={canUndo}
            inputAccessoryViewID={accessoryId}
            onInsertBlock={onInsertBlock}
            onInsertDivider={onInsertDivider}
            onRedo={onRedo}
            onToggleMark={onToggleMark}
            onTurnInto={onTurnInto}
            onUndo={onUndo}
            styles={styles}
            testID={testID}
            theme={theme}
            visible={editorFocused}
          />
        )}
      </View>
    </View>
  );
}

function numberedListPosition(document: RichTextDocument, index: number) {
  if (document[index]?.type !== "numbered") return undefined;
  let first = index;
  while (first > 0 && document[first - 1]?.type === "numbered") first -= 1;
  return index - first + 1;
}
