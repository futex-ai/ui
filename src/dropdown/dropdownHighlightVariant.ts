/** The highlight vocabulary shared by dropdown rows. */

/**
 * How the focused (active) and selected option rows are highlighted:
 * - `solid` — focused row filled with `primary` under a white label (default).
 * - `ring` — focused row outlined with a `primary` ring, no fill.
 * - `ringFill` — focused row outlined with a `primary` ring over a light fill.
 * - `dot` — focused row gets a soft fill plus a leading `primary` dot.
 *
 * In every variant a selected `option` row is marked with a trailing checkmark
 * (so selection survives independently of which row is focused). The legacy
 * left-accent bar is replaced by these variants.
 */
export type DropdownHighlightVariant = "dot" | "ring" | "ringFill" | "solid";

export const DEFAULT_DROPDOWN_HIGHLIGHT: DropdownHighlightVariant = "solid";

/** Tone accent for a dropdown row, mirroring `DropdownListEntry["tone"]`. */
export type DropdownRowTone = "amber" | "danger" | "default" | "muted";
