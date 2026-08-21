/**
 * The read-only body of a review-rail card: who wrote it, the words it is
 * anchored to, and what it says. Split out of `RichTextCollabCard` so the card
 * file stays about layout, selection, and the review actions.
 */
import { Text, View } from "react-native";

import { Avatar } from "../avatar";

import type { RichTextCollaboratorStyle } from "./richTextCollabPalette";
import { richTextCollabStyle } from "./richTextCollabPalette";
import type {
  RichTextCollabRailItem,
  RichTextCommentItem,
  RichTextSuggestionItem,
} from "./richTextCollabRailModel";
import {
  richTextPreviewLine,
  richTextSuggestionSummary,
} from "./richTextCollabRailModel";
import type { RichTextComment } from "./richTextCollabTypes";

import type { RichTextCollabCardContext } from "./RichTextCollabCard";

/**
 * A tracked change. The affected words are shown the way the document shows
 * them — underlined in the author's colour for an addition, struck through for
 * a deletion — so the card and the text read as the same thing, with a sentence
 * above that says which it is without relying on the styling (1.4.1).
 */
export function SuggestionSummary({
  context,
  item,
}: {
  context: RichTextCollabCardContext;
  item: RichTextSuggestionItem;
}) {
  const { styles } = context;
  const author = authorStyle(context, item.suggestion.authorId);
  const insert = item.suggestion.kind === "insert";
  const preview = richTextPreviewLine(item.preview);
  return (
    <>
      <AuthorRow
        author={author}
        authorId={item.suggestion.authorId}
        context={context}
        timestamp={item.suggestion.timestamp}
      />
      <Text style={styles.summary}>
        {richTextSuggestionSummary(
          item.suggestion,
          displayName(author, item.suggestion.authorId, context),
        )}
      </Text>
      {preview ? (
        <Text
          numberOfLines={3}
          style={[
            styles.preview,
            insert
              ? [styles.insertedPreview, { color: author.deep }]
              : styles.deletedPreview,
          ]}
        >
          {preview}
        </Text>
      ) : null}
    </>
  );
}

/** A thread: who opened it, the words it hangs off, and the opening message. */
export function CommentSummary({
  context,
  item,
}: {
  context: RichTextCollabCardContext;
  item: RichTextCommentItem;
}) {
  const { styles } = context;
  const opener = item.thread.comments[0];
  const author = authorStyle(context, opener?.authorId);
  const preview = richTextPreviewLine(item.preview);
  return (
    <>
      <AuthorRow
        author={author}
        authorId={opener?.authorId}
        context={context}
        timestamp={opener?.timestamp}
      />
      {preview ? (
        <Text numberOfLines={2} style={styles.quote}>
          {preview}
        </Text>
      ) : null}
      {opener ? <Text style={styles.body}>{opener.body}</Text> : null}
    </>
  );
}

export function CommentRow({
  comment,
  context,
}: {
  comment: RichTextComment;
  context: RichTextCollabCardContext;
}) {
  const author = authorStyle(context, comment.authorId);
  return (
    <View style={context.styles.reply}>
      <AuthorRow
        author={author}
        authorId={comment.authorId}
        context={context}
        timestamp={comment.timestamp}
      />
      <Text style={context.styles.body}>{comment.body}</Text>
    </View>
  );
}

function AuthorRow({
  author,
  authorId,
  context,
  timestamp,
}: {
  author: RichTextCollaboratorStyle;
  authorId: string | undefined;
  context: RichTextCollabCardContext;
  timestamp?: string;
}) {
  const { styles } = context;
  return (
    <View style={styles.header}>
      <Avatar
        // The name sits right beside the disc, so announcing it twice would
        // only add noise.
        decorative
        label={author.initials}
        size={22}
        style={{ backgroundColor: author.accent }}
        textColor={author.onAccent}
      />
      <Text numberOfLines={1} style={styles.author}>
        {displayName(author, authorId, context)}
      </Text>
      {timestamp ? (
        <Text
          style={[
            styles.timestamp,
            context.tinted ? styles.timestampOnTint : null,
          ]}
        >
          {timestamp}
        </Text>
      ) : null}
    </View>
  );
}

/** Accessible name for a card's select-in-document control. */
export function cardLabel(
  item: RichTextCollabRailItem,
  context: RichTextCollabCardContext,
): string {
  const preview = richTextPreviewLine(item.preview);
  const anchored = preview ? ` on “${preview}”` : "";
  if (item.kind === "suggestion") {
    const author = authorStyle(context, item.suggestion.authorId);
    const summary = richTextSuggestionSummary(
      item.suggestion,
      displayName(author, item.suggestion.authorId, context),
    );
    return `${summary}${anchored}. Show in document`;
  }
  const opener = item.thread.comments[0];
  const author = authorStyle(context, opener?.authorId);
  const count = item.thread.comments.length;
  const replies = count > 1 ? `, ${count - 1} more in thread` : "";
  return `Comment by ${displayName(author, opener?.authorId, context)}${anchored}${replies}. Show in document`;
}

function authorStyle(
  context: RichTextCollabCardContext,
  authorId: string | undefined,
): RichTextCollaboratorStyle {
  return richTextCollabStyle(context.palette, context.theme, authorId);
}

function displayName(
  author: RichTextCollaboratorStyle,
  authorId: string | undefined,
  context: RichTextCollabCardContext,
): string {
  return authorId !== undefined && authorId === context.localCollaboratorId
    ? "You"
    : author.name;
}
