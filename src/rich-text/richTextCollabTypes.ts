/**
 * Public types for the rich-text collaboration layer: who is in the document,
 * what they have suggested, what they have commented on, and where their
 * carets are. Everything here is presentation input — the editor draws it and
 * reports intent back, it never syncs, merges, or resolves anything itself.
 */
import type { DocPosition } from "./richTextModel";

/**
 * Ordered document range. `from` is inclusive and `to` exclusive at the
 * text-offset level, matching {@link DocSelection}. A collapsed range (equal
 * endpoints) marks a caret rather than a span of text.
 */
export type RichTextRange = { from: DocPosition; to: DocPosition };

/**
 * Palette slot a collaborator's caret, highlight, and cards are drawn in. The
 * three slots are the theme's accent families, so every collaborator colour
 * moves with the theme instead of being hardcoded per app.
 */
export type RichTextCollabTone = "amber" | "primary" | "rose";

/** A person taking part in the document. */
export type RichTextCollaborator = {
  /** Stable identity referenced by suggestions, comments, and presence. */
  id: string;
  /** Avatar initials. Derived from `name` when omitted. */
  initials?: string;
  /** Display name shown on caret flags, avatars, and rail cards. */
  name: string;
  /**
   * Pin this collaborator to a palette slot. Unpinned collaborators take the
   * remaining slots in array order, so a two-person session is deterministic
   * without any caller configuration.
   */
  tone?: RichTextCollabTone;
};

/** Whether a tracked change adds text or removes it. */
export type RichTextSuggestionKind = "delete" | "insert";

/**
 * Review state of a tracked change. Only `pending` suggestions are decorated
 * in the document and listed in the rail; the other two are kept so a caller
 * can hold history without filtering the array itself.
 */
export type RichTextSuggestionStatus = "accepted" | "pending" | "rejected";

/**
 * One tracked change. The text it covers always exists in the document: an
 * `insert` is text that is proposed to stay, a `delete` is text that is
 * proposed to go. Accepting or rejecting is the caller's edit to make — the
 * editor only draws the proposal and reports the button press.
 */
export type RichTextSuggestion = {
  /** Collaborator who proposed the change. */
  authorId: string;
  id: string;
  kind: RichTextSuggestionKind;
  /**
   * Text shown on the rail card. Derived from the document range when omitted,
   * so callers only set it when the range no longer matches (for example a
   * delete recorded against text already removed locally).
   */
  preview?: string;
  range: RichTextRange;
  /** Defaults to `pending`. */
  status?: RichTextSuggestionStatus;
  /** Display-ready time label, e.g. `2m ago`. Never parsed or reformatted. */
  timestamp?: string;
};

/** A single message inside a comment thread. */
export type RichTextComment = {
  authorId: string;
  /** Plain-text message body. Rendered as text, never as markdown or HTML. */
  body: string;
  id: string;
  /** Display-ready time label, e.g. `2m ago`. Never parsed or reformatted. */
  timestamp?: string;
};

/** A comment thread anchored to a range of the document. */
export type RichTextCommentThread = {
  /** Ordered messages, oldest first. The first is the thread's opener. */
  comments: readonly RichTextComment[];
  id: string;
  range: RichTextRange;
  /** Resolved threads keep their anchor highlight off and leave the rail. */
  resolved?: boolean;
};

/** Where a collaborator's caret and selection currently sit. */
export type RichTextPresence = {
  collaboratorId: string;
  /**
   * Live selection. Collapsed endpoints draw a caret only; a non-collapsed
   * range also tints the covered text. The caret is drawn at `to`, the moving
   * end of the selection.
   */
  selection: RichTextRange;
};

/** The collaboration overlay the editor draws over a document. */
export type RichTextCollabState = {
  /** Thread whose anchor is highlighted as selected. */
  activeCommentThreadId?: string | null;
  commentThreads?: readonly RichTextCommentThread[];
  presence?: readonly RichTextPresence[];
  suggestions?: readonly RichTextSuggestion[];
};

/** Collaboration props accepted by `RichTextEditor` on web and native. */
export type RichTextCollabProps = RichTextCollabState & {
  /**
   * Everyone who can appear in the document. A collaborator missing from this
   * list gets no colour, so their marks fall back to neutral ink.
   */
  collaborators?: readonly RichTextCollaborator[];
  /**
   * The viewer. Their own presence entry is never drawn as a remote caret, and
   * the rail names them "You".
   */
  localCollaboratorId?: string;
  /** Fired when a comment anchor in the document is pressed. */
  onSelectCommentThread?: (threadId: string | null) => void;
};
