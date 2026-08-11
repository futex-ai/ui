/**
 * The DOM elements that carry the collaboration overlay: a live-selection tint,
 * a comment anchor, a tracked change, and a remote caret. Each one is a
 * presentation wrapper around document text rather than document structure, so
 * every element is tagged `data-rt-deco` for the serializer to see through, and
 * the caret — which has no text of its own — is `contenteditable="false"` so the
 * serializer and the offset walker skip it entirely.
 */
import type { SharedUiTheme } from "../theme";

import type {
  RichTextAnnotatedRun,
  RichTextCaretMark,
} from "./richTextCollabModel";
import { richTextCollabStyle } from "./richTextCollabPalette";
import type { RichTextInlineDecoration } from "./domInline.web";

/** Tint behind a run covered by a collaborator's live selection. */
export function selectionElement(
  collaboratorId: string,
  decoration: RichTextInlineDecoration,
): HTMLElement {
  const style = richTextCollabStyle(
    decoration.palette,
    decoration.theme,
    collaboratorId,
  );
  const element = document.createElement("span");
  element.dataset.rtDeco = "selection";
  element.dataset.rtCollaborator = collaboratorId;
  element.style.backgroundColor = style.selection;
  element.style.borderRadius = "2px";
  return element;
}

/**
 * A comment anchor. Unlike carets and tracked changes, the anchor is drawn in
 * one fixed highlighter tone rather than the commenter's colour: several people
 * can comment on the same words, and a run can only carry one tint, so the
 * colour marks "there is a discussion here" and the rail card carries who.
 */
export function commentElement(
  threadId: string,
  active: boolean,
  theme: SharedUiTheme,
): HTMLElement {
  const element = document.createElement("mark");
  element.dataset.rtDeco = "comment";
  element.dataset.rtThread = threadId;
  element.style.backgroundColor = theme.colors.amberSoft;
  element.style.borderRadius = "3px";
  // <mark> has a UA foreground/background pair; the anchor is a tint over the
  // author's own body text, so both are taken back.
  element.style.color = "inherit";
  element.style.cursor = "pointer";
  element.style.textDecorationColor = active
    ? theme.colors.amberDeep
    : theme.colors.amber;
  element.style.textDecorationLine = "underline";
  element.style.textDecorationThickness = "2px";
  element.style.textUnderlineOffset = "2px";
  if (active) {
    element.style.boxShadow = `inset 0 0 0 1px ${theme.colors.amberDeep}`;
  }
  return element;
}

/** An `ins` or `del` carrying one pending tracked change. */
export function suggestionElement(
  suggestion: NonNullable<RichTextAnnotatedRun["suggestion"]>,
  decoration: RichTextInlineDecoration,
): HTMLElement {
  const style = richTextCollabStyle(
    decoration.palette,
    decoration.theme,
    suggestion.authorId,
  );
  const insert = suggestion.kind === "insert";
  const element = document.createElement(insert ? "ins" : "del");
  element.dataset.rtDeco = insert ? "insert" : "delete";
  element.dataset.rtSuggestion = suggestion.id;
  element.setAttribute(
    "title",
    `${insert ? "Insertion" : "Deletion"} suggested by ${style.name}`,
  );
  element.style.color = insert ? style.deep : decoration.theme.colors.muted;
  element.style.textDecorationColor = style.accent;
  element.style.textDecorationLine = insert ? "underline" : "line-through";
  element.style.textDecorationThickness = "2px";
  element.style.textUnderlineOffset = "2px";
  return element;
}

/**
 * A remote caret: a zero-width, non-editable marker carrying a 2px bar and a
 * name flag. It sits in the text flow so it tracks reflow for free, and it is
 * hidden from assistive tech — the presence bar names who is in the document,
 * so a screen reader is not interrupted mid-sentence.
 */
export function caretElement(
  caret: RichTextCaretMark,
  decoration: RichTextInlineDecoration,
): HTMLElement {
  const style = richTextCollabStyle(
    decoration.palette,
    decoration.theme,
    caret.collaboratorId,
  );
  const element = document.createElement("span");
  element.contentEditable = "false";
  element.dataset.rtDeco = "caret";
  element.dataset.rtCollaborator = caret.collaboratorId;
  element.setAttribute("aria-hidden", "true");
  element.style.display = "inline-block";
  element.style.height = "1em";
  element.style.pointerEvents = "none";
  element.style.position = "relative";
  element.style.userSelect = "none";
  element.style.verticalAlign = "-0.15em";
  element.style.width = "0";

  const bar = document.createElement("span");
  bar.style.backgroundColor = style.accent;
  bar.style.borderRadius = "1px";
  bar.style.bottom = "0";
  bar.style.position = "absolute";
  bar.style.top = "0";
  bar.style.width = "2px";

  // The flag sits above the caret and overlaps its top by 3px, so a caret on
  // the document's first line still fits inside the editor body's 10px top
  // padding instead of being sheared by the frame's rounded clip.
  const flag = document.createElement("span");
  flag.dataset.rtDeco = "caret-flag";
  flag.style.backgroundColor = style.accent;
  flag.style.borderRadius = `${decoration.theme.radii.sm}px ${decoration.theme.radii.sm}px ${decoration.theme.radii.sm}px 0`;
  flag.style.bottom = "100%";
  flag.style.color = style.onAccent;
  flag.style.fontFamily = decoration.theme.fonts.sans;
  flag.style.fontSize = "10px";
  flag.style.fontWeight = "700";
  flag.style.lineHeight = "13px";
  flag.style.marginBottom = "-3px";
  flag.style.padding = "0 5px";
  flag.style.position = "absolute";
  flag.style.whiteSpace = "nowrap";
  flag.textContent = style.name;

  element.append(bar, flag);
  return element;
}
