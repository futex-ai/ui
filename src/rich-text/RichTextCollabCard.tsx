/** One review-rail card: a tracked change to accept, or a comment thread. */
import { Check, CornerUpLeft, X } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Button } from "../button";
import type { SharedUiTheme } from "../theme";

import {
  CommentRow,
  CommentSummary,
  SuggestionSummary,
  cardLabel,
} from "./RichTextCollabCardBody";
import type { RichTextCollabPalette } from "./richTextCollabPalette";
import type { RichTextCollabRailItem } from "./richTextCollabRailModel";
import type { RichTextCollabStyles } from "./richTextCollabStyles";

export type RichTextCollabCardProps = {
  active: boolean;
  item: RichTextCollabRailItem;
  /** The viewer, so their own name reads as "You". */
  localCollaboratorId?: string;
  onAcceptSuggestion?: (suggestionId: string) => void;
  onRejectSuggestion?: (suggestionId: string) => void;
  onReplyToThread?: (threadId: string) => void;
  onResolveThread?: (threadId: string) => void;
  onSelect?: (item: RichTextCollabRailItem) => void;
  palette: RichTextCollabPalette;
  styles: RichTextCollabStyles;
  testID?: string;
  theme: SharedUiTheme;
};

/** Everything a card's body needs to name, colour, and contrast its author. */
export type RichTextCollabCardContext = {
  localCollaboratorId?: string;
  palette: RichTextCollabPalette;
  styles: RichTextCollabStyles;
  theme: SharedUiTheme;
  /** The card's fill is a tint rather than `surface`, so quiet text darkens. */
  tinted: boolean;
};

/**
 * A card in the review rail. The summary region — avatar, author, and the words
 * the entry is anchored to — is the one pressable area, so selecting an entry
 * never nests a button inside a button (WCAG 2.1 — 4.1.2); accept, reject,
 * resolve, and reply sit beside it as their own controls.
 */
export function RichTextCollabCard({
  active,
  item,
  localCollaboratorId,
  onAcceptSuggestion,
  onRejectSuggestion,
  onReplyToThread,
  onResolveThread,
  onSelect,
  palette,
  styles,
  testID,
  theme,
}: RichTextCollabCardProps) {
  const reviewed =
    item.kind === "comment"
      ? Boolean(item.thread.resolved)
      : (item.suggestion.status ?? "pending") !== "pending";
  const context: RichTextCollabCardContext = {
    localCollaboratorId,
    palette,
    styles,
    theme,
    tinted: active || reviewed,
  };

  return (
    <View
      style={[
        styles.card,
        active ? styles.cardActive : null,
        reviewed ? styles.cardResolved : null,
      ]}
      testID={testID}
    >
      <Pressable
        accessibilityLabel={cardLabel(item, context)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onSelect ? () => onSelect(item) : undefined}
        style={styles.cardTrigger}
      >
        {item.kind === "suggestion" ? (
          <SuggestionSummary context={context} item={item} />
        ) : (
          <CommentSummary context={context} item={item} />
        )}
      </Pressable>

      {item.kind === "comment" && item.thread.comments.length > 1 ? (
        <View style={styles.replies}>
          {item.thread.comments.slice(1).map((comment) => (
            <CommentRow comment={comment} context={context} key={comment.id} />
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {item.kind === "suggestion" && !reviewed ? (
          <>
            <Button
              icon={Check}
              onPress={
                onAcceptSuggestion
                  ? () => onAcceptSuggestion(item.suggestion.id)
                  : undefined
              }
              size="sm"
              tone="primary"
            >
              Accept
            </Button>
            <Button
              icon={X}
              onPress={
                onRejectSuggestion
                  ? () => onRejectSuggestion(item.suggestion.id)
                  : undefined
              }
              size="sm"
            >
              Reject
            </Button>
          </>
        ) : null}
        {item.kind === "comment" ? (
          <>
            <Button
              icon={CornerUpLeft}
              onPress={
                onReplyToThread
                  ? () => onReplyToThread(item.thread.id)
                  : undefined
              }
              size="sm"
              tone="ghost"
            >
              Reply
            </Button>
            {reviewed ? null : (
              <Button
                icon={Check}
                onPress={
                  onResolveThread
                    ? () => onResolveThread(item.thread.id)
                    : undefined
                }
                size="sm"
              >
                Resolve
              </Button>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}
