/**
 * The sample people of the list stories, their default row, and the bordered
 * card the lists sit in.
 */
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Avatar, ListItem, useSharedUiTheme } from "../index";

export type Person = {
  badge?: string;
  detail: string;
  id: string;
  initials: string;
  name: string;
};

export const people: Person[] = [
  {
    detail: "Salary · monthly · £1,000.00",
    id: "p1",
    initials: "CM",
    name: "Calum Moore",
  },
  {
    badge: "First full month",
    detail: "Salary · monthly · gross pay needed",
    id: "p2",
    initials: "PP",
    name: "Peter Parker",
  },
  {
    detail: "Salary · monthly · £3,750.00",
    id: "p3",
    initials: "AW",
    name: "Aisha Webb",
  },
];

export function personItem(person: Person) {
  return (
    <ListItem
      description={person.detail}
      leading={
        <Avatar decorative label={person.initials} size={42} tone="solid" />
      }
      title={person.name}
      trailing={person.badge ? <Badge label={person.badge} /> : undefined}
    />
  );
}

/** A soft sage pill, matching the mockup's "First full month" tag. */
function Badge({ label }: { label: string }) {
  // The chip rides the same soft/deep pair it used to hardcode, so it inverts
  // with the theme instead of staying a light-green chip on a dark panel.
  const theme = useSharedUiTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
      <Text style={[styles.badgeText, { color: theme.colors.primaryDeep }]}>
        {label}
      </Text>
    </View>
  );
}

/** The bordered frame the list sits in, drawn with the theme's own border. */
export function ListCard({ children }: { children: ReactNode }) {
  const theme = useSharedUiTheme();
  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 520,
  },
});
