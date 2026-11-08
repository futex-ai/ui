/** The entry and slot types of a dropdown list. */
import type { ReactNode } from "react";
import type { IconComponent } from "../primitives/icons";

/** How the option list and its rows are exposed to assistive tech. */
export type DropdownListRole = "listbox" | "menu";

/**
 * Content for a row's `leading`/`right` slot: either a plain node the caller
 * owns outright, or a render function handed the row's resolved content color.
 *
 * A plain node is opaque to the library — it cannot be recolored — so an icon
 * hard-coded to `ink` stays near-black on the solid active fill while the label
 * beside it inverts to white. Pass a function instead to tint your own glyph
 * with the row's color, whichever icon set it comes from:
 *
 * ```tsx
 * leading: ({ color }) => <Ionicons color={color} name="settings-outline" size={18} />
 * ```
 */
export type DropdownRowSlot =
  | ReactNode
  | ((state: { color: string }) => ReactNode);

export type DropdownListEntry =
  | { id: string; label: string; type: "divider" }
  | { id: string; label: string; type: "section" }
  /** Muted text that explains the rows near it. It is never active. */
  | { id: string; label: string; type: "note" }
  | {
      /**
       * Overridable accessible name for the row. Defaults to `label`, so the
       * on-screen text stays the test/automation handle. Set it to disambiguate
       * duplicate labels or pin a locale-stable name without changing the
       * visible copy.
       */
      accessibilityLabel?: string;
      /**
       * Makes the row a choice of a menu (`listRole="menu"`): a menu radio
       * item whose checked row shows a check mark. A listbox ignores it and
       * uses `selected`.
       */
      checked?: boolean;
      disabled?: boolean;
      /**
       * A decorative icon before the label, drawn at the size of the row. It
       * is muted at rest and takes the label color on a highlighted or toned
       * row. A `leading` slot replaces it.
       */
      icon?: IconComponent;
      id: string;
      label: string;
      /** Leading slot (usually an icon). See {@link DropdownRowSlot}. */
      leading?: DropdownRowSlot;
      onPress?: () => void;
      /** Trailing slot. See {@link DropdownRowSlot}. */
      right?: DropdownRowSlot;
      /**
       * Trailing text (e.g. an account code) rendered in the right slot — the
       * string companion to `right`. Library-styled, so it inverts to white on
       * the solid active fill instead of vanishing as muted grey. Prefer this
       * over a hand-colored `right` node for trailing text; `right` takes
       * precedence and suppresses the selection check when both are set.
       */
      rightText?: string;
      secondary?: string;
      selected?: boolean;
      /** Test identifier forwarded to this row's pressable (`data-testid` on web). */
      testID?: string;
      tone?: "amber" | "danger" | "default" | "muted";
      type: "footer" | "item";
    };
