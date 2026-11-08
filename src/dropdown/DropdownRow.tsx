/** One row of a dropdown list: an item, a footer action, a label, a divider, or a note. */
import type { ReactNode } from "react";
import { Check } from "../primitives/icons";
import { Pressable, Text, View } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";

import type { DropdownListEntry, DropdownRowSlot } from "./dropdownListTypes";
import { dropdownRowHighlight } from "./dropdownListStyles";
import type { DropdownHighlightVariant } from "./dropdownListStyles";
import type { DropdownRowStyles } from "./dropdownRowSizing";

type DropdownRowProps = {
  active: boolean;
  entry: DropdownListEntry;
  highlightVariant: DropdownHighlightVariant;
  isWeb: boolean;
  itemRole: "menuitem" | "option";
  /** The list holds keyboard focus, so the rows leave the tab order. */
  listFocus: boolean;
  /** DOM id of a note, so the list can name it as its description. */
  noteDomId?: string;
  onHover: () => void;
  onRowRef: (node: View | null) => void;
  rowDomId?: string;
  rowStyles: DropdownRowStyles;
  theme: SharedUiTheme;
};

export function DropdownRow({
  active,
  entry,
  highlightVariant,
  isWeb,
  itemRole,
  listFocus,
  noteDomId,
  onHover,
  onRowRef,
  rowDomId,
  rowStyles,
  theme,
}: DropdownRowProps) {
  const { checkSize, iconSize, styles } = rowStyles;
  if (entry.type === "section") {
    return <Text style={styles.section}>{entry.label}</Text>;
  }
  if (entry.type === "divider") {
    return <View style={styles.divider} />;
  }
  if (entry.type === "note") {
    return (
      <Text nativeID={noteDomId} style={styles.note}>
        {entry.label}
      </Text>
    );
  }
  const danger = entry.tone === "danger";
  const amber = entry.tone === "amber";
  const highlight = dropdownRowHighlight(styles, theme, highlightVariant, {
    active,
    disabled: Boolean(entry.disabled),
    selected: Boolean(entry.selected),
    tone: entry.tone,
  });
  // The solid active fill carries the tone (a red/amber fill) under an inverted
  // white label, so the tone accent text yields there — the accent would be
  // unreadable on the fill. Off the inverted row the accent colors the label.
  const toneLabel = highlight.invertText
    ? null
    : danger
      ? styles.dangerText
      : amber
        ? styles.amberText
        : null;
  // Selected options are marked with a trailing checkmark so the choice reads
  // independently of which row is keyboard-focused. Only for `option` rows
  // (a `menuitem` has no selected state), and only when the row's trailing slot
  // is free — a custom `right` node or a `rightText` string occupies it instead
  // (e.g. the combobox supplies its own check).
  const selectedCheck =
    itemRole === "option" &&
    highlight.showCheck &&
    !entry.right &&
    !entry.rightText ? (
      <Check color={highlight.checkColor} size={checkSize} strokeWidth={2.5} />
    ) : null;
  // A choice in a menu is a menu radio item. Its check follows any trailing
  // detail, so the choice and the detail both stay visible.
  const choice = itemRole === "menuitem" && entry.checked !== undefined;
  const choiceCheck =
    choice && entry.checked ? (
      <Check color={highlight.checkColor} size={checkSize} strokeWidth={2.5} />
    ) : null;
  // A resting icon is muted; on a highlighted or toned row it takes the color
  // of the label beside it, so it inverts on the solid fill.
  const Icon = entry.icon;
  const iconColor =
    highlight.labelStyle || danger || amber
      ? highlight.contentColor
      : theme.colors.muted;
  // On web, expose the correct ARIA list-item role (`option`/`menuitem`) via
  // the literal `role` prop, because `option` is missing from the bundled RN
  // `AccessibilityRole` type (RNW forwards `role` at runtime). On native, keep
  // the tappable `button` role so the OS exposes a familiar control, and a
  // menu choice is a radio. `option` carries `aria-selected`; `menuitem` has
  // no selected state (an action menu). WCAG 4.1.2 Name/Role/Value.
  const webRoleProps: object = isWeb
    ? ({
        nativeID: rowDomId,
        role: choice ? "menuitemradio" : itemRole,
        ...(itemRole === "option"
          ? { "aria-selected": Boolean(entry.selected) }
          : {}),
        ...(choice ? { "aria-checked": Boolean(entry.checked) } : {}),
        // The list holds focus and points at the active row, so a row is not
        // a tab stop of its own.
        ...(listFocus ? { tabIndex: -1 } : {}),
      } as unknown as object)
    : { accessibilityRole: choice ? ("radio" as const) : ("button" as const) };
  return (
    <Pressable
      accessibilityLabel={entry.accessibilityLabel ?? entry.label}
      accessibilityState={{
        checked: choice ? Boolean(entry.checked) : undefined,
        disabled: entry.disabled,
        selected: itemRole === "option" ? entry.selected : undefined,
      }}
      disabled={entry.disabled}
      onHoverIn={entry.disabled ? undefined : onHover}
      onPress={entry.onPress}
      ref={onRowRef}
      testID={entry.testID}
      {...webRoleProps}
      style={[
        styles.item,
        entry.type === "footer" ? styles.footer : null,
        highlight.rowStyle,
        entry.disabled ? styles.itemDisabled : null,
      ]}
    >
      {highlight.showDotSlot ? (
        <View style={styles.itemDotSlot}>
          {highlight.showDot ? <View style={styles.itemDot} /> : null}
        </View>
      ) : null}
      {entry.leading ? (
        <View style={styles.leading}>
          {renderRowSlot(entry.leading, highlight.contentColor)}
        </View>
      ) : Icon ? (
        // The icon is decorative, so the row hides its slot itself: a caller's
        // icon may ignore `aria-hidden` or name an image of its own.
        <View aria-hidden pointerEvents="none" style={styles.leading}>
          <Icon aria-hidden color={iconColor} size={iconSize} />
        </View>
      ) : null}
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, highlight.labelStyle, toneLabel]}>
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text style={[styles.secondary, highlight.secondaryStyle]}>
            {entry.secondary}
          </Text>
        ) : null}
      </View>
      {entry.right ? (
        <View style={styles.right}>
          {renderRowSlot(entry.right, highlight.contentColor)}
        </View>
      ) : entry.rightText ? (
        <View style={styles.right}>
          <Text style={[styles.rightText, highlight.secondaryStyle]}>
            {entry.rightText}
          </Text>
        </View>
      ) : selectedCheck ? (
        <View style={styles.right}>{selectedCheck}</View>
      ) : null}
      {choiceCheck ? <View style={styles.right}>{choiceCheck}</View> : null}
    </Pressable>
  );
}

/**
 * Resolves a row slot against the row's content color. A plain node passes
 * through untouched (the caller owns its color); a render function receives the
 * color so its glyph tracks the active row's inversion. `ReactNode` excludes
 * functions, so the `typeof` check discriminates the union safely.
 */
function renderRowSlot(slot: DropdownRowSlot, color: string): ReactNode {
  return typeof slot === "function" ? slot({ color }) : slot;
}
