import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, ChevronDown, ChevronUp } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { applySortableMove, SortableList } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "SortableList/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type Status = { color: string; id: string; name: string; tag: string };

const initial: Status[] = [
  { color: "#b4b8be", id: "todo", name: "Todo", tag: "TO DO" },
  {
    color: "#6f5bd0",
    id: "in-progress",
    name: "In progress",
    tag: "IN PROGRESS",
  },
  { color: "#c28c3a", id: "in-review", name: "In review", tag: "IN REVIEW" },
  { color: "#3fa66a", id: "complete", name: "Complete", tag: "COMPLETE" },
  { color: "#b85555", id: "cancelled", name: "Cancelled", tag: "CANCELLED" },
];

/** A status card whose own up / down / archive controls stay interactive beside the grab handle. */
function StatusRow({
  item,
  onArchive,
  onMove,
}: {
  item: Status;
  onArchive: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>
      <View style={styles.actions}>
        <IconButton label={`Move ${item.name} up`} onPress={() => onMove(-1)}>
          <ChevronUp color="#69706a" size={16} />
        </IconButton>
        <IconButton label={`Move ${item.name} down`} onPress={() => onMove(1)}>
          <ChevronDown color="#69706a" size={16} />
        </IconButton>
        <IconButton label={`Archive ${item.name}`} onPress={onArchive}>
          <Archive color="#69706a" size={15} />
        </IconButton>
      </View>
    </View>
  );
}

function IconButton({
  children,
  label,
  onPress,
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.iconButton}
    >
      {children}
    </Pressable>
  );
}

export const WithHandle: Story = {
  name: "Grab handle + interactive rows",
  render: () => <HandleExample />,
};

function HandleExample() {
  const [items, setItems] = useState(initial);
  const [last, setLast] = useState<string | null>(null);
  const swap = (index: number, delta: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const to = index + delta;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status}>
          {last ?? "Drag a handle to reorder, or focus one and press Space."}
        </Text>
        <SortableList<Status>
          accessibilityLabel="Workflow statuses"
          gap={10}
          handle="start"
          itemKey={(s) => s.id}
          itemLabel={(s) => s.name}
          items={items}
          onReorder={(move) => {
            setItems((prev) => applySortableMove(prev, move, (s) => s.id));
            setLast(`Moved ${move.key} to position ${move.toIndex + 1}`);
          }}
          renderItem={(item, index) => (
            <StatusRow
              item={item}
              onArchive={() =>
                setItems((prev) => prev.filter((s) => s.id !== item.id))
              }
              onMove={(delta) => swap(index, delta)}
            />
          )}
        />
        <Text style={styles.hint}>
          The handle is the only drag target, so each row&apos;s own up / down /
          archive buttons keep working. Space to grab, arrows to move, Space or
          Enter to drop, Escape to cancel.
        </Text>
      </View>
    </StorySurface>
  );
}

export const HandleInsideCard: Story = {
  name: "Handle inside the card",
  render: () => <InsideExample />,
};

function InsideExample() {
  const [items, setItems] = useState(initial);
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status}>
          The grip is rendered inside the white card, not in the gutter.
        </Text>
        <SortableList<Status>
          accessibilityLabel="Workflow statuses"
          gap={10}
          handle="custom"
          itemKey={(s) => s.id}
          itemLabel={(s) => s.name}
          items={items}
          onReorder={(move) =>
            setItems((prev) => applySortableMove(prev, move, (s) => s.id))
          }
          renderItem={(item, index, handle) => (
            <View style={styles.card}>
              {handle}
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.title}>{item.name}</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </StorySurface>
  );
}

export const WholeRow: Story = {
  name: "Whole row draggable (no handle)",
  render: () => <WholeRowExample />,
};

function WholeRowExample() {
  const [items, setItems] = useState(initial.slice(0, 4));
  return (
    <StorySurface>
      <SortableList<Status>
        accessibilityLabel="Reorderable statuses"
        gap={8}
        itemKey={(s) => s.id}
        itemLabel={(s) => s.name}
        items={items}
        onReorder={(move) =>
          setItems((prev) => applySortableMove(prev, move, (s) => s.id))
        }
        renderItem={(item) => (
          <View style={styles.plainCard}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.title}>{item.name}</Text>
          </View>
        )}
      />
    </StorySurface>
  );
}

export const Horizontal: Story = {
  name: "Horizontal",
  render: () => <HorizontalExample />,
};

function HorizontalExample() {
  const [items, setItems] = useState(initial.slice(0, 4));
  return (
    <StorySurface>
      <SortableList<Status>
        accessibilityLabel="Reorderable columns"
        gap={10}
        handle="start"
        itemKey={(s) => s.id}
        itemLabel={(s) => s.name}
        items={items}
        onReorder={(move) =>
          setItems((prev) => applySortableMove(prev, move, (s) => s.id))
        }
        orientation="horizontal"
        renderItem={(item) => (
          <View style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.chipTitle}>{item.name}</Text>
          </View>
        )}
      />
    </StorySurface>
  );
}

export const CustomHandleAndDisabled: Story = {
  name: "Custom handle + a frozen row",
  render: () => <CustomExample />,
};

function CustomExample() {
  const [items, setItems] = useState(initial);
  return (
    <StorySurface>
      <SortableList<Status>
        accessibilityLabel="Statuses with a custom handle"
        gap={8}
        handle="end"
        // The Cancelled row is frozen: it keeps its slot but cannot be dragged.
        itemDisabled={(s) => s.id === "cancelled"}
        itemKey={(s) => s.id}
        itemLabel={(s) => s.name}
        items={items}
        onReorder={(move) =>
          setItems((prev) => applySortableMove(prev, move, (s) => s.id))
        }
        renderHandle={() => <Text style={styles.customHandle}>⣿</Text>}
        renderItem={(item) => (
          <View style={styles.plainCard}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.title}>{item.name}</Text>
          </View>
        )}
      />
    </StorySurface>
  );
}

export const Sizes: Story = {
  name: "Sizes",
  render: () => <SizesExample />,
};

function SizesExample() {
  return (
    <StorySurface>
      <View style={styles.stack}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <View key={size} style={styles.sizeBlock}>
            <Text style={styles.status}>{size}</Text>
            <SizedList size={size} />
          </View>
        ))}
      </View>
    </StorySurface>
  );
}

function SizedList({ size }: { size: "lg" | "md" | "sm" }) {
  const [items, setItems] = useState(initial.slice(0, 3));
  return (
    <SortableList<Status>
      accessibilityLabel={`Statuses (${size})`}
      handle="start"
      itemKey={(s) => s.id}
      itemLabel={(s) => s.name}
      items={items}
      onReorder={(move) =>
        setItems((prev) => applySortableMove(prev, move, (s) => s.id))
      }
      renderItem={(item) => (
        <View style={styles.plainCard}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.title}>{item.name}</Text>
        </View>
      )}
      size={size}
    />
  );
}

const styles = StyleSheet.create({
  actions: { alignItems: "center", flexDirection: "row", gap: 2 },
  card: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e8e0",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e8e0",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipTitle: { color: "#1c1f1d", fontSize: 14, fontWeight: "700" },
  customHandle: { color: "#a8aea7", fontSize: 16, lineHeight: 16 },
  dot: { borderRadius: 999, height: 12, width: 12 },
  hint: { color: "#69706a", fontSize: 12, maxWidth: 520 },
  iconButton: {
    alignItems: "center",
    borderRadius: 6,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  plainCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e8e0",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sizeBlock: { gap: 6 },
  stack: { gap: 12 },
  status: { color: "#3e4540", fontSize: 13, fontWeight: "700" },
  tag: {
    backgroundColor: "#eef2ed",
    borderRadius: 6,
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: "#5e645e",
    fontFamily: "Menlo, monospace",
    fontSize: 11,
    fontWeight: "700",
  },
  title: { color: "#1c1f1d", fontSize: 15, fontWeight: "700" },
});
