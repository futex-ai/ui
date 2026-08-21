/** One styled, independently editable block in the native rich-text editor. */
import { Check } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

import type { SharedUiTheme } from "../theme";

import { nativeBlockText } from "./nativeRichTextEditing";
import type { NativeInlineDecoration } from "./nativeRichTextInline";
import {
  NativeRichTextPresence,
  nativeInlineContent,
} from "./nativeRichTextInline";
import type { NativeTextSelection } from "./nativeTextEdit";
import type { NativeRichTextStyles } from "./nativeRichTextStyles";
import type { RichTextBlock } from "./richTextModel";

export type NativeRichTextBlockProps = {
  accessibilityLabel: string;
  active: boolean;
  block: RichTextBlock;
  /** Collaboration overlay for this block, or `null` when there is none. */
  decoration: NativeInlineDecoration | null;
  index: number;
  inputAccessoryViewID?: string;
  inputRef: (input: TextInput | null) => void;
  listNumber?: number;
  onBlur: (index: number) => void;
  onChangeText: (index: number, text: string) => void;
  onFocus: (index: number) => void;
  onKeyPress: (index: number, key: string) => void;
  onPressDivider: (index: number) => void;
  onSelectionChange: (index: number, selection: NativeTextSelection) => void;
  onSubmitEditing: (index: number) => void;
  onToggleCheck: (index: number) => void;
  placeholder?: string;
  readOnly: boolean;
  selection?: NativeTextSelection;
  styles: NativeRichTextStyles;
  testID?: string;
  theme: SharedUiTheme;
};

/** Render native chrome, marker, and attributed input for a rich-text block. */
export function NativeRichTextBlock({
  accessibilityLabel,
  active,
  block,
  decoration,
  index,
  inputAccessoryViewID,
  inputRef,
  listNumber,
  onBlur,
  onChangeText,
  onFocus,
  onKeyPress,
  onPressDivider,
  onSelectionChange,
  onSubmitEditing,
  onToggleCheck,
  placeholder,
  readOnly,
  selection,
  styles,
  testID,
  theme,
}: NativeRichTextBlockProps) {
  if (block.type === "divider") {
    return (
      <Pressable
        accessibilityLabel={`${accessibilityLabel}, divider`}
        accessibilityRole="button"
        disabled={readOnly}
        onPress={() => onPressDivider(index)}
        style={styles.dividerTarget}
        testID={testID}
      >
        <View style={styles.divider} />
      </Pressable>
    );
  }

  const content = nativeInlineContent(block, styles, decoration);
  const textStyle = blockTextStyle(block, styles);
  const rowStyle = [
    styles.block,
    block.type === "quote" ? styles.quoteBlock : null,
    block.type === "codeBlock" ? styles.codeBlock : null,
  ];
  return (
    <View style={rowStyle} testID={readOnly ? testID : undefined}>
      {block.type === "check" ? (
        <Pressable
          accessibilityLabel={`${accessibilityLabel}, ${block.checked ? "completed" : "not completed"}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: block.checked, disabled: readOnly }}
          disabled={readOnly}
          hitSlop={4}
          onPress={() => onToggleCheck(index)}
          style={styles.checkTarget}
        >
          <View
            style={[
              styles.checkBox,
              block.checked ? styles.checkBoxChecked : null,
            ]}
          >
            {block.checked ? (
              <Check color={theme.colors.surface} size={13} strokeWidth={3} />
            ) : null}
          </View>
        </Pressable>
      ) : (
        <BlockMarker block={block} listNumber={listNumber} styles={styles} />
      )}
      <View style={styles.blockContent}>
        {readOnly ? (
          <Text
            accessibilityRole={isHeading(block) ? "header" : undefined}
            style={[styles.readOnlyText, textStyle]}
          >
            {content}
          </Text>
        ) : (
          <TextInput
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: false }}
            editable
            inputAccessoryViewID={inputAccessoryViewID}
            multiline
            onBlur={() => onBlur(index)}
            onChangeText={(text) => onChangeText(index, text)}
            onFocus={() => onFocus(index)}
            onKeyPress={(event) => onKeyPress(index, event.nativeEvent.key)}
            onSelectionChange={(event) =>
              onSelectionChange(index, event.nativeEvent.selection)
            }
            onSubmitEditing={() => onSubmitEditing(index)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholder}
            ref={inputRef}
            scrollEnabled={false}
            selection={active ? selection : undefined}
            selectionColor={theme.colors.primary}
            spellCheck
            style={[styles.input, textStyle]}
            submitBehavior={block.type === "codeBlock" ? "newline" : "submit"}
            testID={testID}
            underlineColorAndroid="transparent"
          >
            {content}
          </TextInput>
        )}
      </View>
      {decoration ? (
        <NativeRichTextPresence
          annotations={decoration.annotations}
          palette={decoration.palette}
          styles={styles}
          theme={decoration.theme}
        />
      ) : null}
    </View>
  );
}

function BlockMarker({
  block,
  listNumber,
  styles,
}: {
  block: RichTextBlock;
  listNumber?: number;
  styles: NativeRichTextStyles;
}) {
  const marker =
    block.type === "bullet"
      ? "•"
      : block.type === "numbered"
        ? `${listNumber ?? 1}.`
        : null;
  return marker ? <Text style={styles.listMarker}>{marker}</Text> : null;
}

function blockTextStyle(
  block: Exclude<RichTextBlock, { type: "divider" }>,
  styles: NativeRichTextStyles,
): StyleProp<TextStyle> {
  switch (block.type) {
    case "heading1":
      return styles.heading1;
    case "heading2":
      return styles.heading2;
    case "heading3":
      return styles.heading3;
    case "quote":
      return styles.quoteText;
    case "codeBlock":
      return styles.codeText;
    case "check":
      return block.checked
        ? [styles.paragraph, styles.checkedText]
        : styles.paragraph;
    default:
      return styles.paragraph;
  }
}

function isHeading(block: RichTextBlock): boolean {
  return (
    block.type === "heading1" ||
    block.type === "heading2" ||
    block.type === "heading3"
  );
}

/** Return the spoken semantic kind for a native editor block. */
export function nativeBlockKind(block: RichTextBlock): string {
  switch (block.type) {
    case "heading1":
      return "heading 1";
    case "heading2":
      return "heading 2";
    case "heading3":
      return "heading 3";
    case "bullet":
      return "bulleted list item";
    case "numbered":
      return "numbered list item";
    case "check":
      return "checklist item";
    case "quote":
      return "quote";
    case "codeBlock":
      return "code block";
    case "divider":
      return "divider";
    default:
      return nativeBlockText(block).length === 0
        ? "empty paragraph"
        : "paragraph";
  }
}
