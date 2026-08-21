/**
 * The review rail beside a rich-text document: every open tracked change and
 * comment thread, in document order, with the controls to act on them.
 */
import { useMemo } from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { Badge } from "../badge";
import { useSharedUiTheme } from "../theme";

import { RichTextCollabCard } from "./RichTextCollabCard";
import { richTextCollabPalette } from "./richTextCollabPalette";
import type { RichTextCollabRailItem } from "./richTextCollabRailModel";
import { richTextCollabRailItems } from "./richTextCollabRailModel";
import { createRichTextCollabStyles } from "./richTextCollabStyles";
import type {
  RichTextCollaborator,
  RichTextCommentThread,
  RichTextSuggestion,
} from "./richTextCollabTypes";
import { parseMarkdown } from "./markdownParse";

export type RichTextCollabRailProps = {
  /** Entry whose card is shown as selected; pair it with the editor's prop. */
  activeCommentThreadId?: string | null;
  /** Everyone who can appear, in the same order the editor is given them. */
  collaborators: readonly RichTextCollaborator[];
  commentThreads?: readonly RichTextCommentThread[];
  /** Message shown when there is nothing to review. */
  emptyLabel?: string;
  /** Also list resolved threads and already-reviewed changes. */
  includeResolved?: boolean;
  /** The viewer, so their own entries read as "You". */
  localCollaboratorId?: string;
  onAcceptSuggestion?: (suggestionId: string) => void;
  onRejectSuggestion?: (suggestionId: string) => void;
  onReplyToThread?: (threadId: string) => void;
  onResolveThread?: (threadId: string) => void;
  /** Fired when a card is picked. Comment cards report their thread id. */
  onSelectItem?: (item: RichTextCollabRailItem) => void;
  style?: StyleProp<ViewStyle>;
  suggestions?: readonly RichTextSuggestion[];
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Heading above the list. */
  title?: string;
  /**
   * The same markdown the editor holds. Card previews are read out of it, so a
   * caller does not have to keep a second copy of the changed text; supply
   * `preview` on a suggestion to override a range that no longer matches.
   */
  value?: string;
};

/**
 * Suggestions and comments share one list ordered by position in the document,
 * so a reviewer works top to bottom instead of switching between two panels.
 * Place it beside the editor on a wide layout and below it on a narrow one —
 * the rail owns its cards, not where it sits.
 */
export function RichTextCollabRail({
  activeCommentThreadId = null,
  collaborators,
  commentThreads = [],
  emptyLabel = "No open comments or changes",
  includeResolved = false,
  localCollaboratorId,
  onAcceptSuggestion,
  onRejectSuggestion,
  onReplyToThread,
  onResolveThread,
  onSelectItem,
  style,
  suggestions = [],
  testID,
  title = "Comments & changes",
  value,
}: RichTextCollabRailProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRichTextCollabStyles(theme), [theme]);
  const palette = useMemo(
    () => richTextCollabPalette(theme, collaborators),
    [collaborators, theme],
  );
  const document = useMemo(
    () => (value === undefined ? undefined : parseMarkdown(value)),
    [value],
  );
  const items = useMemo(
    () =>
      richTextCollabRailItems({
        commentThreads,
        document,
        includeResolved,
        suggestions,
      }),
    [commentThreads, document, includeResolved, suggestions],
  );

  return (
    <View style={[styles.rail, style]} testID={testID}>
      <View style={styles.railHeader}>
        <Text style={styles.railTitle}>{title}</Text>
        {items.length > 0 ? (
          <Badge
            accessibilityLabel={`${items.length} open ${items.length === 1 ? "entry" : "entries"}`}
            tone="neutral"
          >
            {String(items.length)}
          </Badge>
        ) : null}
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <RichTextCollabCard
              active={
                item.kind === "comment" && item.id === activeCommentThreadId
              }
              item={item}
              key={`${item.kind}:${item.id}`}
              localCollaboratorId={localCollaboratorId}
              onAcceptSuggestion={onAcceptSuggestion}
              onRejectSuggestion={onRejectSuggestion}
              onReplyToThread={onReplyToThread}
              onResolveThread={onResolveThread}
              onSelect={onSelectItem}
              palette={palette}
              styles={styles}
              testID={testID ? `${testID}-${item.kind}-${item.id}` : undefined}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
}
