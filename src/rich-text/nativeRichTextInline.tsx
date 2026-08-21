/**
 * Attributed inline content for native rich-text blocks, plain and decorated.
 * With a collaboration overlay the block's spans are sliced along the overlay's
 * runs and each slice gets the tracked-change, comment, and live-selection
 * styling on top of its own marks — all of it plain `Text` styling, because a
 * native `TextInput` can only host text nodes.
 */
import { Text, View } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

import type { SharedUiTheme } from "../theme";

import type {
  RichTextAnnotatedRun,
  RichTextBlockAnnotations,
} from "./richTextCollabModel";
import type { RichTextCollabPalette } from "./richTextCollabPalette";
import { richTextCollabStyle } from "./richTextCollabPalette";
import type { NativeRichTextStyles } from "./nativeRichTextStyles";
import type { InlineMark, InlineSpan, RichTextBlock } from "./richTextModel";
import { sliceSpans } from "./richTextModel";

/** Everything the native inline renderer needs beyond the block itself. */
export type NativeInlineDecoration = {
  annotations: RichTextBlockAnnotations;
  onSelectCommentThread?: (threadId: string | null) => void;
  palette: RichTextCollabPalette;
  theme: SharedUiTheme;
};

/** Render a block's text, decorated when an overlay is supplied. */
export function nativeInlineContent(
  block: Exclude<RichTextBlock, { type: "divider" }>,
  styles: NativeRichTextStyles,
  decoration: NativeInlineDecoration | null,
) {
  if (block.type === "codeBlock") {
    if (block.code.length === 0) return null;
    if (!decoration || decoration.annotations.runs.length === 0) {
      return <Text>{block.code}</Text>;
    }
    return decoration.annotations.runs.map((run) => (
      <Text
        key={`${run.from}:${run.to}`}
        {...runTextProps(run, styles, decoration)}
      >
        {block.code.slice(run.from, run.to)}
      </Text>
    ));
  }
  if (!decoration || decoration.annotations.runs.length === 0) {
    return markedSpans(block.spans, styles, "");
  }
  return decoration.annotations.runs.map((run) => (
    <Text
      key={`${run.from}:${run.to}`}
      {...runTextProps(run, styles, decoration)}
    >
      {markedSpans(
        sliceSpans(block.spans, run.from, run.to),
        styles,
        `${run.from}:`,
      )}
    </Text>
  ));
}

/**
 * Remote carets in this block, as initials discs beside the text. A native text
 * input owns its own contents, so the caret cannot be drawn inside the line the
 * way it is on web; the disc names who is here and where, and the presence bar
 * carries the same names for anyone not reading colour.
 */
export function NativeRichTextPresence({
  annotations,
  palette,
  styles,
  theme,
}: {
  annotations: RichTextBlockAnnotations | null;
  palette: RichTextCollabPalette;
  styles: NativeRichTextStyles;
  theme: SharedUiTheme;
}) {
  if (!annotations || annotations.carets.length === 0) return null;
  return (
    <View style={styles.presenceChip}>
      {annotations.carets.map((caret) => {
        const style = richTextCollabStyle(palette, theme, caret.collaboratorId);
        return (
          <View
            accessibilityLabel={`${style.name} is editing here`}
            accessibilityRole="text"
            key={caret.collaboratorId}
            style={[styles.presenceDisc, { backgroundColor: style.accent }]}
          >
            <Text style={[styles.presenceInitials, { color: style.onAccent }]}>
              {style.initials}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function runTextProps(
  run: RichTextAnnotatedRun,
  styles: NativeRichTextStyles,
  decoration: NativeInlineDecoration,
): {
  accessibilityLabel?: string;
  onPress?: () => void;
  style: StyleProp<TextStyle>;
} {
  const { onSelectCommentThread, palette, theme } = decoration;
  const author = run.suggestion
    ? richTextCollabStyle(palette, theme, run.suggestion.authorId)
    : null;
  const [presenceId] = run.presenceIds;
  const presence = presenceId
    ? richTextCollabStyle(palette, theme, presenceId)
    : null;
  const threadId = run.commentThreadIds[run.commentThreadIds.length - 1];
  return {
    accessibilityLabel: run.suggestion
      ? `${run.suggestion.kind === "insert" ? "Insertion" : "Deletion"} suggested by ${author?.name}`
      : undefined,
    onPress:
      threadId && onSelectCommentThread
        ? () => onSelectCommentThread(threadId)
        : undefined,
    style: [
      presence ? { backgroundColor: presence.selection } : null,
      threadId
        ? run.activeCommentThreadId
          ? styles.inlineCommentActive
          : styles.inlineComment
        : null,
      run.suggestion?.kind === "insert"
        ? [styles.inlineInserted, { color: author?.deep }]
        : null,
      run.suggestion?.kind === "delete" ? styles.inlineDeleted : null,
    ],
  };
}

function markedSpans(
  spans: readonly InlineSpan[],
  styles: NativeRichTextStyles,
  keyPrefix: string,
) {
  return spans.map((span, index) => (
    <Text
      key={`${keyPrefix}${index}:${span.marks.join("-")}`}
      style={inlineMarkStyle(span.marks, styles)}
    >
      {span.text}
    </Text>
  ));
}

function inlineMarkStyle(
  marks: readonly InlineMark[],
  styles: NativeRichTextStyles,
): StyleProp<TextStyle> {
  return [
    marks.includes("bold") ? styles.inlineBold : null,
    marks.includes("italic") ? styles.inlineItalic : null,
    marks.includes("strike") ? styles.inlineStrike : null,
    marks.includes("code") ? styles.inlineCode : null,
  ];
}
