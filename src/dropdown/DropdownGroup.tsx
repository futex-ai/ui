/** A labelled group of dropdown rows under one section heading (web). */
import type { ReactNode } from "react";
import { Text, View } from "../primitives/reactNative";

import type { DropdownListSectionEntry } from "./dropdownListModel";
import type { DropdownListStyles } from "./dropdownListStyles";

/**
 * A section heading and its rows as one web `role="group"`, named by the
 * visible heading (WCAG 1.3.1 / 4.1.2), so a screen reader announces the group
 * as the active option moves into it. The heading keeps the plain section
 * style, so a grouped list looks the same as an ungrouped one.
 */
export function DropdownGroup({
  children,
  heading,
  listId,
  styles,
}: {
  children: ReactNode;
  heading: DropdownListSectionEntry;
  listId?: string;
  styles: DropdownListStyles;
}) {
  const headingId = listId ? `${listId}-section-${heading.id}` : undefined;
  // `group` and the literal `aria-*` names are web ARIA; RN's bundled types
  // omit them, so they travel in a cast object (the web backend forwards them).
  const groupA11y = {
    "aria-label": headingId ? undefined : heading.label,
    "aria-labelledby": headingId,
    role: "group",
  } as unknown as object;
  return (
    <View {...groupA11y}>
      <Text nativeID={headingId} style={styles.section}>
        {heading.label}
      </Text>
      {children}
    </View>
  );
}
