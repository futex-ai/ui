/** Presentational native rich-text frame, blocks, and mobile toolbar. */
import { Platform, ScrollView, TextInput, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { SharedUiTheme } from "../theme";
import { Label } from "../typography";

import { NativeRichTextBlock, nativeBlockKind } from "./NativeRichTextBlock";
import { NativeRichTextToolbar } from "./NativeRichTextToolbar";
import type { RichTextAnnotationInput } from "./richTextCollabModel";
import {
  annotateRichTextDocument,
  hasRichTextAnnotations,
} from "./richTextCollabModel";
import type { RichTextCollabPalette } from "./richTextCollabPalette";
import type { NativeRichTextTarget } from "./nativeRichTextEditing";
import {
  nativeRichTextAccessoryID,
  nativeRichTextAccessoryTargets,
} from "./nativeRichTextFocus";
import type { NativeTextSelection } from "./nativeTextEdit";
import type { NativeRichTextStyles } from "./nativeRichTextStyles";
import { buildNativeRichTextTestIDs } from "./nativeRichTextTestIDs";
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
  /** Collaboration overlay to project onto the document, or `null` for none. */
  collabState: RichTextAnnotationInput | null;
  collaboratorPalette: RichTextCollabPalette;
  document: RichTextDocument;
  editorFocused: boolean;
  focusRingStyle: StyleProp<ViewStyle>;
  focusVisible: boolean;
  label?: string;
  maxHeight?: number;
  minHeight: number;
  onBlur: (block: number) => void;
  onChangeText: (block: number, text: string) => void;
  onFocus: (block: number) => void;
  onInputRef: (block: number, input: TextInput | null) => void;
  onInsertBlock: () => void;
  onInsertDivider: () => void;
  onKeyPress: (block: number, key: string) => void;
  onRedo: () => void;
  onRequestFocus: (target: NativeRichTextTarget) => void;
  onSelectionChange: (block: number, selection: NativeTextSelection) => void;
  onSelectCommentThread?: (threadId: string | null) => void;
  onSubmitEditing: (block: number) => void;
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
  collabState,
  collaboratorPalette,
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
  onSelectCommentThread,
  onSubmitEditing,
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
  const testIDs = buildNativeRichTextTestIDs(document, testID);
  const annotations =
    collabState && hasRichTextAnnotations(collabState)
      ? annotateRichTextDocument(document, collabState)
      : null;
  const iosToolbarTargets = nativeRichTextAccessoryTargets(
    accessoryId,
    document.map((block) => block.type),
    activeBlock,
  );
  const toolbarTargets =
    Platform.OS === "ios"
      ? iosToolbarTargets
      : [{ block: activeBlock, id: accessoryId, visible: editorFocused }];
  return (
    <View style={styles.field} testID={testIDs.field}>
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
              decoration={
                annotations
                  ? {
                      annotations: annotations[index],
                      onSelectCommentThread,
                      palette: collaboratorPalette,
                      theme,
                    }
                  : null
              }
              index={index}
              inputAccessoryViewID={nativeRichTextAccessoryID(
                accessoryId,
                index,
              )}
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
              onSubmitEditing={onSubmitEditing}
              onToggleCheck={onToggleCheck}
              placeholder={
                document.length === 1 && index === 0 ? placeholder : undefined
              }
              readOnly={readOnly}
              styles={styles}
              testID={testIDs.blocks[index]}
              theme={theme}
            />
          ))}
        </ScrollView>
        {readOnly
          ? null
          : toolbarTargets.map((target) => (
              <NativeRichTextToolbar
                activeMarks={activeMarks}
                blockType={activeType}
                canRedo={canRedo}
                canUndo={canUndo}
                inputAccessoryViewID={target.id}
                key={target.id}
                onInsertBlock={onInsertBlock}
                onInsertDivider={onInsertDivider}
                onRedo={onRedo}
                onToggleMark={onToggleMark}
                onTurnInto={onTurnInto}
                onUndo={onUndo}
                styles={styles}
                testID={testID}
                theme={theme}
                visible={target.visible}
              />
            ))}
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
