/**
 * The menu examples of the native popover stories. Native `InlineMenu`
 * always opens the phone menu sheet. `InlineMenuSheet` draws that sheet in
 * place, and `ResponsiveMenu` opens it on a touch surface.
 */
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Archive,
  ArrowDownUp,
  Copy,
  Ellipsis,
  Link2,
  Pencil,
} from "lucide-react-native";

import { Button } from "@firna/ui/button";
import type { DropdownListEntry } from "@firna/ui/dropdown";
import { InlineMenu, InlineMenuSheet, ResponsiveMenu } from "@firna/ui/popover";
import { useSharedUiTheme } from "@firna/ui/theme";
import { TouchSurface } from "@firna/ui/touch-surface";

import { StoryLog, StoryRow, StoryScreen, useStoryLog } from "./storyParts";

/** The actions of a project, with an icon on each row and one danger row. */
function projectActions(run: (label: string) => void): DropdownListEntry[] {
  return [
    {
      icon: Pencil,
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
      icon: Link2,
      id: "copy-link",
      label: "Copy link",
      onPress: () => run("Copy link"),
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

/** One sort order in a group, with a detail and a note under the choices. */
function sortChoices(
  order: string,
  choose: (order: string) => void,
): DropdownListEntry[] {
  const choice = (id: string, label: string, rightText?: string) => ({
    checked: order === id,
    id,
    label,
    onPress: () => choose(id),
    rightText,
    type: "item" as const,
  });
  return [
    { id: "sort-by", label: "Sort by", type: "section" },
    choice("recent", "Recent activity"),
    choice("name", "Name"),
    choice("status", "Status", "Failed first"),
    { id: "divider", label: "", type: "divider" },
    { id: "note", label: "Pinned projects stay at the top.", type: "note" },
  ];
}

/** Two triggers whose menus open as the phone menu sheet. */
export function InlineMenuExample() {
  const [open, setOpen] = useState<"actions" | "sort" | null>(null);
  const [order, setOrder] = useState("recent");
  const log = useStoryLog();
  const close = () => setOpen(null);
  return (
    <StoryScreen>
      <StoryRow>
        <InlineMenu
          entries={projectActions(log.add)}
          label="Project actions"
          onClose={close}
          open={open === "actions"}
          size="xs"
          title="Billing portal"
        >
          <Button
            accessibilityLabel="Project actions"
            expanded={open === "actions"}
            hasPopup="menu"
            icon={Ellipsis}
            onPress={() => setOpen("actions")}
            shape="square"
            size="xs"
            tone="plain"
          />
        </InlineMenu>
        <InlineMenu
          entries={sortChoices(order, setOrder)}
          label="Sort projects"
          onClose={close}
          open={open === "sort"}
          size="xs"
        >
          <Button
            expanded={open === "sort"}
            hasPopup="menu"
            icon={ArrowDownUp}
            onPress={() => setOpen("sort")}
            size="xs"
          >
            Sort
          </Button>
        </InlineMenu>
      </StoryRow>
      <StoryLog label="Last action" text={log.text} />
      <StoryLog label="Sort order" text={order} />
    </StoryScreen>
  );
}

/** The phone menu sheet drawn in place, inside a phone-sized frame. */
export function DrawnSheetExample() {
  const theme = useSharedUiTheme();
  const log = useStoryLog();
  return (
    <StoryScreen>
      <View style={[styles.frame, { borderColor: theme.colors.border }]}>
        <InlineMenuSheet
          entries={projectActions(log.add)}
          label="Project actions"
          onClose={() => log.add("Close")}
          size="xs"
          title="Billing portal"
        />
      </View>
      <StoryLog label="Last action" text={log.text} />
    </StoryScreen>
  );
}

/** A responsive menu on a touch surface opens the menu sheet with 44 px rows. */
export function TouchResponsiveMenuExample() {
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const log = useStoryLog();
  return (
    <TouchSurface>
      <StoryScreen>
        <View ref={anchorRef} style={styles.anchor}>
          <Button
            expanded={open}
            hasPopup="menu"
            icon={Ellipsis}
            onPress={() => setOpen(true)}
            size="xs"
          >
            Project actions
          </Button>
        </View>
        <ResponsiveMenu
          anchorRef={anchorRef}
          entries={projectActions(log.add)}
          label="Project actions"
          maxHeight={320}
          onClose={() => setOpen(false)}
          open={open}
          size="xs"
          title="Billing portal"
        />
        <StoryLog label="Last action" text={log.text} />
      </StoryScreen>
    </TouchSurface>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
  frame: { borderRadius: 16, borderWidth: 1, height: 460, overflow: "hidden" },
});
