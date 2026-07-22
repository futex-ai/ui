/** Keyboard-adjacent block and inline controls for the native editor. */
import {
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Redo2,
  SquareTerminal,
  Strikethrough,
  TextQuote,
  Undo2,
} from "lucide-react-native";
import type { ComponentType } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import type { SharedUiTheme } from "../theme";

import type { NativeRichTextStyles } from "./nativeRichTextStyles";
import type {
  InlineMark,
  RichTextBlock,
  RichTextTurnIntoType,
} from "./richTextModel";

type ToolbarIcon = ComponentType<{
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
}>;

export type NativeRichTextToolbarProps = {
  activeMarks: readonly InlineMark[];
  blockType: RichTextBlock["type"];
  canRedo: boolean;
  canUndo: boolean;
  inputAccessoryViewID: string;
  onInsertBlock: () => void;
  onInsertDivider: () => void;
  onRedo: () => void;
  onToggleMark: (mark: InlineMark) => void;
  onTurnInto: (type: RichTextTurnIntoType) => void;
  onUndo: () => void;
  styles: NativeRichTextStyles;
  testID?: string;
  theme: SharedUiTheme;
  visible: boolean;
};

/** Render an iOS accessory host or the focused Android toolbar. */
export function NativeRichTextToolbar(props: NativeRichTextToolbarProps) {
  if (Platform.OS !== "ios" && !props.visible) return null;
  const bar = props.visible ? (
    <ToolbarBar {...props} />
  ) : (
    <View accessibilityElementsHidden style={props.styles.toolbar} />
  );
  return Platform.OS === "ios" ? (
    <InputAccessoryView
      backgroundColor={props.theme.colors.surface}
      nativeID={props.inputAccessoryViewID}
    >
      {bar}
    </InputAccessoryView>
  ) : (
    bar
  );
}

function ToolbarBar({
  activeMarks,
  blockType,
  canRedo,
  canUndo,
  onInsertBlock,
  onInsertDivider,
  onRedo,
  onToggleMark,
  onTurnInto,
  onUndo,
  styles,
  testID,
  theme,
}: NativeRichTextToolbarProps) {
  const inlineDisabled = blockType === "codeBlock" || blockType === "divider";
  return (
    <View
      accessibilityLabel="Rich text formatting"
      accessibilityRole="toolbar"
      style={styles.toolbar}
      testID={testID ? `${testID}-toolbar` : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.toolbarContent}
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
      >
        <ToolbarButton
          icon={Plus}
          label="Insert paragraph"
          onPress={onInsertBlock}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          disabled={!canUndo}
          icon={Undo2}
          label="Undo"
          onPress={onUndo}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          disabled={!canRedo}
          icon={Redo2}
          label="Redo"
          onPress={onRedo}
          styles={styles}
          theme={theme}
        />
        <ToolbarDivider styles={styles} />
        <ToolbarButton
          active={blockType === "paragraph"}
          icon={Pilcrow}
          label="Paragraph"
          onPress={() => onTurnInto("paragraph")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "heading1"}
          icon={Heading1}
          label="Heading 1"
          onPress={() => onTurnInto("heading1")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "heading2"}
          icon={Heading2}
          label="Heading 2"
          onPress={() => onTurnInto("heading2")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "heading3"}
          icon={Heading3}
          label="Heading 3"
          onPress={() => onTurnInto("heading3")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "bullet"}
          icon={List}
          label="Bulleted list"
          onPress={() => onTurnInto("bullet")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "numbered"}
          icon={ListOrdered}
          label="Numbered list"
          onPress={() => onTurnInto("numbered")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "check"}
          icon={ListChecks}
          label="Checklist"
          onPress={() => onTurnInto("check")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "quote"}
          icon={TextQuote}
          label="Quote"
          onPress={() => onTurnInto("quote")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={blockType === "codeBlock"}
          icon={SquareTerminal}
          label="Code block"
          onPress={() => onTurnInto("codeBlock")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          icon={Minus}
          label="Insert divider"
          onPress={onInsertDivider}
          styles={styles}
          theme={theme}
        />
        <ToolbarDivider styles={styles} />
        <ToolbarButton
          active={activeMarks.includes("bold")}
          disabled={inlineDisabled}
          icon={Bold}
          label="Bold"
          onPress={() => onToggleMark("bold")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={activeMarks.includes("italic")}
          disabled={inlineDisabled}
          icon={Italic}
          label="Italic"
          onPress={() => onToggleMark("italic")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={activeMarks.includes("strike")}
          disabled={inlineDisabled}
          icon={Strikethrough}
          label="Strikethrough"
          onPress={() => onToggleMark("strike")}
          styles={styles}
          theme={theme}
        />
        <ToolbarButton
          active={activeMarks.includes("code")}
          disabled={inlineDisabled}
          icon={Code}
          label="Inline code"
          onPress={() => onToggleMark("code")}
          styles={styles}
          theme={theme}
        />
        <ToolbarDivider styles={styles} />
        <ToolbarButton
          icon={ChevronDown}
          label="Dismiss keyboard"
          onPress={Keyboard.dismiss}
          styles={styles}
          theme={theme}
        />
      </ScrollView>
    </View>
  );
}

function ToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onPress,
  styles,
  theme,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: ToolbarIcon;
  label: string;
  onPress: () => void;
  styles: NativeRichTextStyles;
  theme: SharedUiTheme;
}) {
  const color = active ? theme.colors.primaryDeep : theme.colors.ink2;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      hitSlop={2}
      onPress={onPress}
      style={[
        styles.toolbarButton,
        active ? styles.toolbarButtonActive : null,
        disabled ? styles.toolbarButtonDisabled : null,
      ]}
    >
      <Icon color={color} size={20} strokeWidth={2} />
    </Pressable>
  );
}

function ToolbarDivider({ styles }: { styles: NativeRichTextStyles }) {
  return <View accessibilityElementsHidden style={styles.toolbarDivider} />;
}
