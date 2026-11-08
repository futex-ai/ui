/**
 * Examples of the menus drawn open in place and of the phone menu sheet. Each
 * interactive example counts the actions that ran and the times its menu
 * closed, so a journey can tell one activation or close from two.
 */
import { useState } from "react";
import {
  Archive,
  ArrowDownAZ,
  Copy,
  MoreHorizontal,
  Pencil,
  Pin,
} from "../primitives/icons";
import type { IconComponentProps } from "../primitives/icons";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Button, InlineMenu } from "../index";
import type { DropdownListEntry } from "../index";

type MenuLog = {
  actions: number;
  closes: number;
  last: string;
};

const EMPTY_LOG: MenuLog = { actions: 0, closes: 0, last: "None" };

/**
 * An icon of the caller's own that ignores `aria-hidden` and names its image,
 * as an icon made to stand alone can. The menu row still hides it, because a
 * row icon is decorative.
 */
function NamedPencil({ color, size }: IconComponentProps) {
  return (
    <View aria-label="Pencil" role="img">
      <Pencil color={color} size={size} />
    </View>
  );
}

/** The actions of a project: icons, a disabled row, a divider, and a danger row. */
export function projectActions(
  run: (label: string) => void,
): DropdownListEntry[] {
  return [
    {
      icon: NamedPencil,
      id: "rename",
      label: "Rename",
      onPress: () => run("Rename"),
      type: "item",
    },
    {
      icon: Copy,
      id: "duplicate",
      label: "Duplicate",
      onPress: () => run("Duplicate"),
      type: "item",
    },
    {
      disabled: true,
      icon: Pin,
      id: "pin",
      label: "Pin",
      onPress: () => run("Pin"),
      type: "item",
    },
    { id: "divider", label: "", type: "divider" },
    {
      icon: Archive,
      id: "archive",
      label: "Archive project",
      onPress: () => run("Archive project"),
      tone: "danger",
      type: "item",
    },
  ];
}

const SORTS = [
  { detail: undefined, id: "recent", label: "Recent activity" },
  { detail: undefined, id: "name", label: "Name" },
  { detail: "Failed first", id: "status", label: "Status" },
];

/** One choice in a group: a label, choice rows with a detail, and a note. */
export function sortChoices(
  current: string,
  choose: (label: string) => void,
): DropdownListEntry[] {
  return [
    { id: "sort-by", label: "Sort by", type: "section" },
    ...SORTS.map(
      (sort): DropdownListEntry => ({
        checked: sort.label === current,
        id: sort.id,
        label: sort.label,
        onPress: () => choose(sort.label),
        rightText: sort.detail,
        type: "item",
      }),
    ),
    { id: "divider", label: "", type: "divider" },
    { id: "note", label: "Pinned projects stay at the top.", type: "note" },
  ];
}

/** Opens, logs, and closes one menu of an example. */
export function useMenuLog() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState(EMPTY_LOG);
  return {
    log,
    onClose: () => {
      setOpen(false);
      setLog((current) => ({ ...current, closes: current.closes + 1 }));
    },
    open,
    run: (label: string) =>
      setLog((current) => ({
        ...current,
        actions: current.actions + 1,
        last: label,
      })),
    toggle: () => setOpen((current) => !current),
  };
}

export function MenuLogText({ log }: { log: MenuLog }) {
  return (
    <Text style={styles.status}>
      {`Last action: ${log.last} · Actions: ${log.actions} · Closed: ${log.closes}`}
    </Text>
  );
}

/**
 * Dense desktop menus drawn in place beside their triggers: project actions
 * at the end edge, and the sort order of the project list at the start edge.
 */
export function InlineMenuExample() {
  const actions = useMenuLog();
  const sort = useMenuLog();
  const [order, setOrder] = useState("Recent activity");
  return (
    <View style={styles.column}>
      <View style={styles.toolbar}>
        <InlineMenu
          entries={sortChoices(order, (label) => {
            setOrder(label);
            sort.run(label);
          })}
          label="Sort projects"
          onClose={sort.onClose}
          open={sort.open}
          size="xs"
        >
          <Button
            accessibilityLabel="Sort projects"
            expanded={sort.open}
            hasPopup="menu"
            icon={ArrowDownAZ}
            onPress={sort.toggle}
            shape="square"
            size="xs"
            tone="ghost"
          />
        </InlineMenu>
        <View style={styles.spacer} />
        <InlineMenu
          align="end"
          entries={projectActions(actions.run)}
          label="Project actions"
          onClose={actions.onClose}
          open={actions.open}
          size="xs"
        >
          <Button
            accessibilityLabel="Project actions"
            expanded={actions.open}
            hasPopup="menu"
            icon={MoreHorizontal}
            onPress={actions.toggle}
            shape="square"
            size="xs"
            tone="ghost"
          />
        </InlineMenu>
      </View>
      <MenuLogText log={actions.log} />
      <Text style={styles.status}>{`Sort: ${order}`}</Text>
      <MenuLogText log={sort.log} />
    </View>
  );
}

const noop = () => undefined;

/**
 * The same menus drawn open, as static HTML shows them: one below its
 * trigger at the end edge with its first row active, and one above its trigger
 * at the start edge with a chosen active row.
 */
export function InlineMenuOpenExample() {
  return (
    <View style={styles.drawn}>
      <View style={styles.toolbar}>
        <View style={styles.spacer} />
        <InlineMenu
          align="end"
          entries={projectActions(noop)}
          label="Project actions"
          onClose={noop}
          open
          size="xs"
          width={200}
        >
          <Button
            accessibilityLabel="Project actions"
            expanded
            hasPopup="menu"
            icon={MoreHorizontal}
            onPress={noop}
            shape="square"
            size="xs"
            tone="ghost"
          />
        </InlineMenu>
      </View>
      <View style={styles.spacer} />
      <InlineMenu
        activeId="name"
        entries={sortChoices("Recent activity", noop)}
        label="Sort projects"
        onClose={noop}
        open
        side="above"
        size="xs"
        width={220}
      >
        <Button
          accessibilityLabel="Sort projects"
          expanded
          hasPopup="menu"
          icon={ArrowDownAZ}
          onPress={noop}
          shape="square"
          size="xs"
          tone="ghost"
        />
      </InlineMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 12, width: 420 },
  drawn: { height: 420, padding: 8, width: 420 },
  spacer: { flexGrow: 1 },
  status: { color: "#4b5450", fontSize: 13, lineHeight: 18 },
  toolbar: { alignItems: "center", flexDirection: "row", gap: 8 },
});
