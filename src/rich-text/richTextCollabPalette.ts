/**
 * Collaborator colour assignment. Every colour a caret, highlight, avatar, or
 * rail card uses comes from the theme's accent families, so a session recolours
 * with the theme instead of shipping its own palette.
 */
import type { SharedUiTheme } from "../theme";

import type {
  RichTextCollabTone,
  RichTextCollaborator,
} from "./richTextCollabTypes";

/** Resolved colours for one collaborator. */
export type RichTextCollaboratorStyle = {
  /** Solid accent: carets, name flags, underlines, avatar fills. */
  accent: string;
  /**
   * Readable accent text on `surface`. Held to WCAG 2.1 — 1.4.3 (AA) by the
   * theme's `*Deep` tokens, so suggested text stays legible as body copy.
   */
  deep: string;
  /** Initials shown on the avatar disc. */
  initials: string;
  name: string;
  /** Text colour on top of `accent`. */
  onAccent: string;
  /** Translucent accent used to tint a live selection. */
  selection: string;
  /** Soft tint: comment anchors and card fills. */
  soft: string;
  tone: RichTextCollabTone;
};

/** Collaborator id to resolved colours. */
export type RichTextCollabPalette = ReadonlyMap<
  string,
  RichTextCollaboratorStyle
>;

/**
 * Amber is last on purpose: it is the highlighter tone comment anchors are
 * drawn in, so leaving it unclaimed keeps a two-person session's carets
 * (primary, then rose) clearly distinct from "there is a discussion here".
 */
const TONE_ORDER: readonly RichTextCollabTone[] = ["primary", "rose", "amber"];

/**
 * Assign every collaborator a palette slot. Pinned tones are honoured first,
 * then the remaining collaborators take the unused slots in array order, so a
 * two-person session is stable and distinct with no configuration. Sessions
 * larger than the accent families wrap around.
 */
export function richTextCollabPalette(
  theme: SharedUiTheme,
  collaborators: readonly RichTextCollaborator[],
): RichTextCollabPalette {
  const claimed = new Set(
    collaborators.map((collaborator) => collaborator.tone).filter(Boolean),
  );
  const free = TONE_ORDER.filter((tone) => !claimed.has(tone));
  let next = 0;
  const palette = new Map<string, RichTextCollaboratorStyle>();
  for (const collaborator of collaborators) {
    const tone =
      collaborator.tone ??
      free[next++ % Math.max(free.length, 1)] ??
      TONE_ORDER[palette.size % TONE_ORDER.length];
    palette.set(collaborator.id, {
      ...toneColors(theme, tone),
      initials:
        collaborator.initials ??
        richTextCollaboratorInitials(collaborator.name),
      name: collaborator.name,
      tone,
    });
  }
  return palette;
}

/**
 * Colours for a collaborator that is not in the roster. Neutral ink rather
 * than a borrowed accent, so an unknown author never impersonates a known one.
 */
export function richTextNeutralStyle(
  theme: SharedUiTheme,
): RichTextCollaboratorStyle {
  return {
    accent: theme.colors.muted,
    deep: theme.colors.ink2,
    initials: "?",
    name: "Unknown",
    onAccent: theme.colors.onSolid,
    selection: withAlpha(theme.colors.muted, 0.18, theme.colors.soft),
    soft: theme.colors.soft,
    tone: "primary",
  };
}

/** Look a collaborator up, falling back to the neutral style. */
export function richTextCollabStyle(
  palette: RichTextCollabPalette,
  theme: SharedUiTheme,
  collaboratorId: string | undefined,
): RichTextCollaboratorStyle {
  const style = collaboratorId ? palette.get(collaboratorId) : undefined;
  return style ?? richTextNeutralStyle(theme);
}

/** First letter of the first and last name parts, upper-cased. */
export function richTextCollaboratorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Blend a hex colour to `alpha`. Themes may also hold `rgb()`/`rgba()` strings,
 * which cannot be reduced without a colour parser, so those fall back to the
 * opaque token the caller nominates.
 */
export function withAlpha(
  color: string,
  alpha: number,
  fallback: string,
): string {
  const hex = color.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!short && !long) return fallback;
  const channels = short
    ? [short[1], short[2], short[3]].map((part) => parseInt(part + part, 16))
    : [long![1], long![2], long![3]].map((part) => parseInt(part, 16));
  const clamped = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${clamped})`;
}

function toneColors(
  theme: SharedUiTheme,
  tone: RichTextCollabTone,
): Pick<
  RichTextCollaboratorStyle,
  "accent" | "deep" | "onAccent" | "selection" | "soft"
> {
  const { colors } = theme;
  const accent =
    tone === "amber"
      ? colors.amber
      : tone === "rose"
        ? colors.rose
        : colors.primary;
  const deep =
    tone === "amber"
      ? colors.amberDeep
      : tone === "rose"
        ? colors.roseDeep
        : colors.primaryDeep;
  const soft =
    tone === "amber"
      ? colors.amberSoft
      : tone === "rose"
        ? colors.roseSoft
        : colors.primarySoft;
  return {
    accent,
    deep,
    onAccent: colors.onSolid,
    selection: withAlpha(accent, 0.22, soft),
    soft,
  };
}
