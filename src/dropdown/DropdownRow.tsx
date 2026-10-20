/** One dropdown list row: an option or menu item, a section line, or a divider. */
import { Check } from "../primitives/icons";
import { Pressable, Text, View } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";

import type { DropdownListEntry } from "./DropdownList";
import type { DropdownHighlightVariant } from "./dropdownHighlightVariant";
import { renderDropdownSlot } from "./dropdownListModel";
import { dropdownRowHighlight } from "./dropdownListStyles";
import type { DropdownListStyles } from "./dropdownListStyles";
import { dropdownRowA11y } from "./dropdownRowA11y";

/**
 * Renders one entry of `DropdownList`. A selectable row paints the highlight
 * for its state and variant, its leading and trailing slots, its secondary
 * line, and the selection check, and takes its accessibility props from
 * `dropdownRowA11y`.
 */
export function DropdownRow({
  active,
  entry,
  highlightVariant,
  inputKeepsFocus,
  isWeb,
  itemRole,
  onHover,
  onRowRef,
  rowDomId,
  styles,
  theme,
}: {
  active: boolean;
  entry: DropdownListEntry;
  highlightVariant: DropdownHighlightVariant;
  /** A combobox input controls the list, so a press keeps focus there. */
  inputKeepsFocus: boolean;
  isWeb: boolean;
  itemRole: "menuitem" | "option";
  onHover: () => void;
  onRowRef?: (node: View | null) => void;
  rowDomId?: string;
  styles: DropdownListStyles;
  theme: SharedUiTheme;
}) {
  if (entry.type === "section") {
    return <Text style={styles.section}>{entry.label}</Text>;
  }
  if (entry.type === "divider") {
    return <View style={styles.divider} />;
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
      <Check color={highlight.checkColor} size={16} strokeWidth={2.5} />
    ) : null;
  // The name, state, role, and description per platform (WCAG 1.3.1, 4.1.2).
  const a11y = dropdownRowA11y({
    entry,
    inputKeepsFocus,
    isWeb,
    itemRole,
    rowDomId,
  });
  return (
    <Pressable
      disabled={entry.disabled}
      onHoverIn={entry.disabled ? undefined : onHover}
      onPress={entry.onPress}
      ref={onRowRef}
      testID={entry.testID}
      {...a11y.props}
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
          {renderDropdownSlot(entry.leading, highlight.contentColor)}
        </View>
      ) : null}
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, highlight.labelStyle, toneLabel]}>
          {entry.label}
        </Text>
        {entry.secondary ? (
          <Text
            nativeID={a11y.secondaryId}
            style={[
              [styles.secondary, highlight.secondaryStyle],
              highlight.secondaryLineStyle,
            ]}
          >
            {entry.secondary}
          </Text>
        ) : null}
      </View>
      {entry.right ? (
        <View style={styles.right}>
          {renderDropdownSlot(entry.right, highlight.contentColor)}
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
    </Pressable>
  );
}
