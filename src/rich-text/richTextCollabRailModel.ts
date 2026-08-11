/**
 * Pure ordering and summarising for the collaboration rail. Suggestions and
 * comment threads share one list so a reviewer reads the document top to
 * bottom instead of switching between two panels.
 */
import {
  comparePositions,
  orderRange,
  richTextRangeText,
} from "./richTextCollabModel";
import type {
  RichTextCommentThread,
  RichTextSuggestion,
} from "./richTextCollabTypes";
import type { DocPosition, RichTextBlock } from "./richTextModel";

/** A tracked change awaiting review, positioned for the rail. */
export type RichTextSuggestionItem = {
  id: string;
  kind: "suggestion";
  position: DocPosition;
  /** Text the change covers, ready to render. */
  preview: string;
  suggestion: RichTextSuggestion;
};

/** A comment thread, positioned for the rail. */
export type RichTextCommentItem = {
  id: string;
  kind: "comment";
  position: DocPosition;
  /** Text the thread is anchored to, ready to render. */
  preview: string;
  thread: RichTextCommentThread;
};

/** One rail entry. */
export type RichTextCollabRailItem =
  | RichTextCommentItem
  | RichTextSuggestionItem;

/** Inputs the rail projects into an ordered list. */
export type RichTextCollabRailInput = {
  commentThreads?: readonly RichTextCommentThread[];
  /** Keep resolved threads and reviewed suggestions in the list. */
  includeResolved?: boolean;
  /** Document the ranges point into, used to derive previews. */
  document?: readonly RichTextBlock[];
  suggestions?: readonly RichTextSuggestion[];
};

/**
 * Order every open suggestion and thread by where it sits in the document.
 * Ties break on kind then id, so the list is stable across renders even when
 * two entries share an anchor.
 */
export function richTextCollabRailItems(
  input: RichTextCollabRailInput,
): RichTextCollabRailItem[] {
  const document = input.document;
  const suggestions = (input.suggestions ?? [])
    .filter(
      (suggestion) =>
        input.includeResolved || (suggestion.status ?? "pending") === "pending",
    )
    .map<RichTextSuggestionItem>((suggestion) => ({
      id: suggestion.id,
      kind: "suggestion",
      position: orderRange(suggestion.range).from,
      preview:
        suggestion.preview ??
        (document ? richTextRangeText(document, suggestion.range) : ""),
      suggestion,
    }));
  const comments = (input.commentThreads ?? [])
    .filter((thread) => input.includeResolved || !thread.resolved)
    .map<RichTextCommentItem>((thread) => ({
      id: thread.id,
      kind: "comment",
      position: orderRange(thread.range).from,
      preview: document ? richTextRangeText(document, thread.range) : "",
      thread,
    }));
  return [...suggestions, ...comments].sort(compareRailItems);
}

function compareRailItems(
  left: RichTextCollabRailItem,
  right: RichTextCollabRailItem,
): number {
  const byPosition = comparePositions(left.position, right.position);
  if (byPosition !== 0) return byPosition;
  if (left.kind !== right.kind) return left.kind === "suggestion" ? -1 : 1;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

/**
 * Sentence describing a tracked change, used as the card heading and as the
 * accessible name of its accept/reject buttons so neither depends on colour or
 * strike styling to be understood.
 */
export function richTextSuggestionSummary(
  suggestion: RichTextSuggestion,
  authorName: string,
): string {
  return suggestion.kind === "insert"
    ? `${authorName} suggested adding text`
    : `${authorName} suggested deleting text`;
}

/**
 * Live-presence sentence for the presence bar, e.g. `Cal and Robin are
 * editing`. Reads as prose rather than a count so the bar carries meaning
 * without relying on the avatar colours.
 */
export function richTextPresenceSummary(names: readonly string[]): string {
  if (names.length === 0) return "Only you are editing";
  if (names.length === 1) return `${names[0]} is editing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are editing`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} are editing`;
}

/** Truncate a preview to a single readable line for a rail card. */
export function richTextPreviewLine(preview: string, max = 90): string {
  const flat = preview.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
