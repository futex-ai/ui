import type { Meta, StoryObj } from "@storybook/react-vite";
import { Paperclip } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Kanban,
  type KanbanCardMove,
  KanbanCard,
  KanbanChip,
  type KanbanChipColor,
  type KanbanColumnDef,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Kanban/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type ContentCard = {
  channel: string;
  channelColor?: KanbanChipColor;
  channelTone?: "danger" | "neutral" | "primary" | "warning";
  date: string;
  files?: number;
  id: string;
  owner: string;
  ownerColor: string;
  ownerInitials: string;
  score: string;
  status: string;
  title: string;
};

const columns: KanbanColumnDef[] = [
  { id: "drafted", title: "Drafted", tone: "warning" },
  {
    color: { backgroundColor: "#e3eee6", color: "#2f5945" },
    id: "approved",
    title: "Approved",
  },
  { id: "published", title: "Published", tone: "primary" },
  { id: "off-brand", title: "Off-brand", tone: "danger" },
  {
    color: { backgroundColor: "#fbe9f1", color: "#9c4471" },
    id: "duplicate",
    title: "Duplicate",
  },
  { id: "send-failed", title: "Send-failed" },
];

// Deepened from the mockup's #27867a (3.73:1 on the tint) to clear the 4.5:1 AA
// text-contrast floor (1.4.3) — the demo data models legible custom chip colors.
const linkedin: KanbanChipColor = {
  backgroundColor: "#e0f0ec",
  color: "#176b5d",
};

const cards: ContentCard[] = [
  {
    channel: "twitter/x",
    channelTone: "primary",
    date: "Jun 29",
    files: 1,
    id: "c1",
    owner: "Cal",
    ownerColor: "#5c47bd",
    ownerInitials: "CM",
    score: "0.81",
    status: "drafted",
    title:
      "We shipped per-step tool scoping today — every agent step runs with only the tools it was granted.",
  },
  {
    channel: "linkedin",
    channelColor: linkedin,
    date: "Jun 30",
    id: "c2",
    owner: "Pat",
    ownerColor: "#176f60",
    ownerInitials: "PA",
    score: "0.73",
    status: "drafted",
    title: "How scoped agents stay fully auditable",
  },
  {
    channel: "twitter/x",
    channelTone: "primary",
    date: "Jun 29",
    id: "c3",
    owner: "Cal",
    ownerColor: "#5c47bd",
    ownerInitials: "CM",
    score: "0.78",
    status: "approved",
    title: "Why we moved every workflow run into a fresh container",
  },
  {
    channel: "blog",
    channelTone: "warning",
    date: "Jun 27",
    files: 2,
    id: "c4",
    owner: "Cal",
    ownerColor: "#5c47bd",
    ownerInitials: "CM",
    score: "0.88",
    status: "published",
    title: "5 things we learned shipping automations on top of tables",
  },
  {
    channel: "twitter/x",
    channelTone: "primary",
    date: "Jun 29",
    id: "c5",
    owner: "Cal",
    ownerColor: "#5c47bd",
    ownerInitials: "CM",
    score: "0.42",
    status: "off-brand",
    title: "per-step tool scoping is live 🚀🚀 the future is HERE",
  },
  {
    channel: "twitter/x",
    channelTone: "primary",
    date: "Jun 28",
    id: "c6",
    owner: "Bea",
    ownerColor: "#875f1f",
    ownerInitials: "BR",
    score: "0.55",
    status: "duplicate",
    title: "Migrate your CRM in one dry-run",
  },
  {
    channel: "twitter/x",
    channelTone: "primary",
    date: "Jun 28",
    files: 1,
    id: "c7",
    owner: "Cal",
    ownerColor: "#5c47bd",
    ownerInitials: "CM",
    score: "0.64",
    status: "send-failed",
    title: "Tonight's deploy notes",
  },
];

function renderContentCard(card: ContentCard) {
  const chips = [
    <KanbanChip color={card.channelColor} key="channel" tone={card.channelTone}>
      {card.channel}
    </KanbanChip>,
    <KanbanChip key="score">{`score ${card.score}`}</KanbanChip>,
  ];
  if (card.files) {
    chips.push(
      <KanbanChip
        key="files"
        leading={<Paperclip color="#69706a" size={13} />}
        plain
      >
        {`${card.files}`}
      </KanbanChip>,
    );
  }
  return (
    <KanbanCard
      avatar={
        <Avatar
          decorative
          label={card.ownerInitials}
          size={22}
          style={{ backgroundColor: card.ownerColor }}
          textColor="#fff"
        />
      }
      chips={chips}
      date={card.date}
      meta={card.owner}
      title={card.title}
    />
  );
}

export const GroupedByStatus: Story = {
  name: "Grouped by status",
  render: () => (
    <StorySurface>
      <Kanban<ContentCard>
        accessibilityLabel="Content board"
        cardColumnId={(card) => card.status}
        cardKey={(card) => card.id}
        cards={cards}
        columns={columns}
        renderCard={renderContentCard}
      />
    </StorySurface>
  ),
};

export const ClickableCards: Story = {
  name: "Clickable cards",
  render: () => <ClickableExample />,
};

function ClickableExample() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status}>
          {opened ? `Opened "${opened}"` : "Click or focus + Enter a card."}
        </Text>
        <Kanban<ContentCard>
          accessibilityLabel="Content board"
          cardColumnId={(card) => card.status}
          cardDisabled={(card) => card.status === "send-failed"}
          cardKey={(card) => card.id}
          cardLabel={(card) => `Open "${card.title}"`}
          cards={cards}
          columns={columns}
          onCardPress={(card) => setOpened(card.title)}
          renderCard={renderContentCard}
        />
        <Text style={styles.hint}>
          The Send-failed card is disabled and cannot be opened.
        </Text>
      </View>
    </StorySurface>
  );
}

// Move a card to a new status and position by editing the controlled `cards`.
// `move.toIndex` is a position in the destination column *with the moved card
// removed*, so we: (1) drop the card out of the flat list, (2) collect the flat
// positions of the destination column's remaining cards, (3) translate `toIndex`
// into a flat-array index — the `toIndex`-th destination position, or just past
// the last one when inserting at the end (or the list end when the column is
// empty) — and (4) splice the retagged card back in there.
function applyMove(list: ContentCard[], move: KanbanCardMove): ContentCard[] {
  const moved = list.find((card) => card.id === move.cardKey);
  if (!moved) {
    return list;
  }
  const without = list.filter((card) => card.id !== move.cardKey);
  const destPositions: number[] = [];
  without.forEach((card, index) => {
    if (card.status === move.toColumnId) {
      destPositions.push(index);
    }
  });
  const flatIndex =
    move.toIndex < destPositions.length
      ? destPositions[move.toIndex]
      : destPositions.length > 0
        ? destPositions[destPositions.length - 1] + 1
        : without.length;
  const result = [...without];
  result.splice(flatIndex, 0, { ...moved, status: move.toColumnId });
  return result;
}

export const DragAndDrop: Story = {
  name: "Drag and drop",
  render: () => <DragExample />,
};

function DragExample() {
  const [items, setItems] = useState(cards);
  const [last, setLast] = useState<string | null>(null);
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status}>
          {last ??
            "Drag a card to another column, or focus one and press Space."}
        </Text>
        <Kanban<ContentCard>
          accessibilityLabel="Content board"
          cardColumnId={(card) => card.status}
          cardKey={(card) => card.id}
          cardLabel={(card) => `Open ${card.id}`}
          cards={items}
          columns={columns}
          onCardMove={(move) => {
            setItems((prev) => applyMove(prev, move));
            setLast(
              `Moved ${move.cardKey} to ${move.toColumnId} at position ${move.toIndex + 1}`,
            );
          }}
          onCardPress={(card) => setLast(`Opened ${card.id}`)}
          renderCard={renderContentCard}
        />
        <Text style={styles.hint}>
          Cards are both draggable and clickable: click (or focus + Enter) to
          open, drag with the mouse, or grab with the keyboard — Space to grab,
          arrow keys to move, Space or Enter to drop, Escape to cancel.
        </Text>
      </View>
    </StorySurface>
  );
}

export const AddAndEmpty: Story = {
  name: "Add button + empty columns",
  render: () => <AddAndEmptyExample />,
};

function AddAndEmptyExample() {
  const [lastAdd, setLastAdd] = useState<string | null>(null);
  // Only the first three statuses have cards, so the rest show the empty state.
  const partial = cards.filter((card) =>
    ["drafted", "approved", "published"].includes(card.status),
  );
  return (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.status}>
          {lastAdd ? `Add to ${lastAdd}` : "Press a column's + to add a card."}
        </Text>
        <Kanban<ContentCard>
          accessibilityLabel="Content board"
          cardColumnId={(card) => card.status}
          cardKey={(card) => card.id}
          cards={partial}
          columnAddLabel={(column) => `Add card to ${String(column.title)}`}
          columns={columns}
          onColumnAdd={(column) => setLastAdd(String(column.title))}
          renderCard={renderContentCard}
          renderColumnEmpty={() => (
            <Text style={styles.empty}>No records yet</Text>
          )}
        />
      </View>
    </StorySurface>
  );
}

export const MinimalCards: Story = {
  name: "Minimal & custom footers",
  render: () => (
    <StorySurface>
      <Kanban<ContentCard>
        accessibilityLabel="Content board"
        cardColumnId={(card) => card.status}
        cardKey={(card) => card.id}
        cards={cards.slice(0, 3)}
        columns={columns.slice(0, 3)}
        renderCard={(card, index) =>
          index === 0 ? (
            // Title only — no chips, no footer.
            <KanbanCard title={card.title} />
          ) : index === 1 ? (
            // Title + a single chip, still no footer.
            <KanbanCard
              chips={[
                <KanbanChip key="channel" tone="primary">
                  {card.channel}
                </KanbanChip>,
              ]}
              title={card.title}
            />
          ) : (
            // A custom footer node replacing the avatar / meta / date slots.
            <KanbanCard
              footer={
                <Text style={styles.customFooter}>Updated by {card.owner}</Text>
              }
              title={card.title}
            />
          )
        }
      />
    </StorySurface>
  ),
};

export const Loading: Story = {
  name: "Loading",
  render: () => (
    <StorySurface>
      <Kanban<ContentCard>
        accessibilityLabel="Content board"
        cardColumnId={(card) => card.status}
        cardKey={(card) => card.id}
        cards={[]}
        columns={columns.slice(0, 4)}
        loading
        loadingCardCount={2}
        renderCard={renderContentCard}
      />
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <View key={size}>
            <Text style={styles.status}>{size}</Text>
            <Kanban<ContentCard>
              accessibilityLabel={`Content board (${size})`}
              cardColumnId={(card) => card.status}
              cardKey={(card) => card.id}
              cards={cards}
              columns={columns.slice(0, 3)}
              renderCard={(card) => renderSizedCard(card, size)}
              size={size}
            />
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

function renderSizedCard(card: ContentCard, size: "lg" | "md" | "sm") {
  return (
    <KanbanCard
      avatar={
        <Avatar
          decorative
          label={card.ownerInitials}
          size={size === "sm" ? 20 : size === "lg" ? 26 : 22}
          style={{ backgroundColor: card.ownerColor }}
          textColor="#fff"
        />
      }
      chips={[
        <KanbanChip
          color={card.channelColor}
          key="channel"
          tone={card.channelTone}
        >
          {card.channel}
        </KanbanChip>,
        <KanbanChip key="score">{`score ${card.score}`}</KanbanChip>,
      ]}
      date={card.date}
      meta={card.owner}
      size={size}
      title={card.title}
    />
  );
}

const styles = StyleSheet.create({
  customFooter: {
    color: "#69706a",
    fontFamily: "Menlo, monospace",
    fontSize: 11,
  },
  empty: {
    // Darker than the muted token so the placeholder clears 4.5:1 (1.4.3 AA) on
    // the soft-tinted column fill, matching the data table's on-band labels.
    color: "#5e645e",
    fontSize: 13,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  hint: { color: "#69706a", fontSize: 12 },
  stack: { gap: 12 },
  status: { color: "#3e4540", fontSize: 13, fontWeight: "700" },
});
