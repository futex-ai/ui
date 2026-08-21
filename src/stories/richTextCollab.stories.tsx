import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  Button,
  RichTextCollabRail,
  RichTextEditor,
  RichTextPresenceBar,
  Text as ThemedText,
  darkSharedUiTheme,
} from "../index";
import type {
  RichTextCollabRailItem,
  RichTextCollaborator,
  RichTextCommentThread,
  RichTextPresence,
  RichTextSuggestion,
  SharedUiTheme,
} from "../index";
import { StorySurface } from "./sharedExamples";

const markdown = [
  "# Launch note",
  "",
  "We are shipping the collaborative editor to every workspace this Thursday.",
  "",
  "## What reviewers see",
  "",
  "- Live carets for everyone in the document",
  "- Tracked changes they can accept or reject",
  "- Comment threads anchored to the words they discuss",
  "",
  "> Nothing here syncs on its own; the editor draws the session it is given.",
].join("\n");

const collaborators: readonly RichTextCollaborator[] = [
  { id: "cal", name: "Cal Moore" },
  { id: "robin", name: "Robin Alvarez" },
];

/**
 * The markdown above parses to seven blocks: the H1, the intro paragraph, the
 * H2, three bullets, and the quote. Offsets below are plain-text offsets inside
 * those blocks — block 1 is the paragraph, blocks 3–5 the bullets.
 */
const suggestions: readonly RichTextSuggestion[] = [
  // "this Thursday" in the intro paragraph.
  {
    authorId: "robin",
    id: "s-thursday",
    kind: "delete",
    range: markRange(1, 60, 1, 73),
    timestamp: "4m ago",
  },
  // "for everyone" in the first bullet.
  {
    authorId: "robin",
    id: "s-everyone",
    kind: "insert",
    range: markRange(3, 12, 3, 24),
    timestamp: "3m ago",
  },
];

const commentThreads: readonly RichTextCommentThread[] = [
  {
    comments: [
      {
        authorId: "robin",
        body: "Can we name the workspaces explicitly? “every workspace” reads broader than the rollout.",
        id: "c1",
        timestamp: "6m ago",
      },
      {
        authorId: "cal",
        body: "Good catch — I will list them once the flags are flipped.",
        id: "c2",
        timestamp: "5m ago",
      },
    ],
    // "every workspace" in the intro paragraph.
    id: "t-workspaces",
    range: markRange(1, 44, 1, 59),
  },
  {
    comments: [
      {
        authorId: "cal",
        body: "Worth spelling out that accept/reject is the caller's edit to apply.",
        id: "c3",
        timestamp: "2m ago",
      },
    ],
    // "Tracked changes" in the second bullet.
    id: "t-tracked",
    range: markRange(4, 0, 4, 15),
  },
];

/**
 * Where Robin's caret walks as the story's "Move Robin" button is pressed. The
 * last stop is the heading, where the name flag has the least room — the case
 * the flag's negative top margin is sized for.
 */
const peerPositions: readonly RichTextPresence[] = [
  { collaboratorId: "robin", selection: markRange(1, 44, 1, 59) },
  { collaboratorId: "robin", selection: markRange(3, 12, 3, 24) },
  { collaboratorId: "robin", selection: markRange(6, 30, 6, 30) },
  { collaboratorId: "robin", selection: markRange(0, 6, 0, 6) },
];

function markRange(
  fromBlock: number,
  fromOffset: number,
  toBlock: number,
  toOffset: number,
) {
  return {
    from: { block: fromBlock, offset: fromOffset },
    to: { block: toBlock, offset: toOffset },
  };
}

const meta = {
  title: "RichText/Collaboration",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoUserSession: Story = {
  name: "Two-user session",
  render: () => <SessionExample />,
};

export const DarkSession: Story = {
  name: "Two-user session (dark)",
  render: () => <SessionExample theme={darkSharedUiTheme} />,
};

export const ReadOnlyReview: Story = {
  name: "Read-only review",
  render: () => <SessionExample readOnly />,
};

export const NothingToReview: Story = {
  name: "Nothing to review",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <RichTextPresenceBar
          collaborators={collaborators}
          localCollaboratorId="cal"
          presence={[]}
          testID="rich-text-presence"
        />
        <RichTextEditor
          collaborators={collaborators}
          label="Launch note"
          localCollaboratorId="cal"
          minHeight={200}
          testID="rich-text-editor"
          value={markdown}
        />
        <RichTextCollabRail
          collaborators={collaborators}
          localCollaboratorId="cal"
          testID="rich-text-rail"
          value={markdown}
        />
      </View>
    </StorySurface>
  ),
};

/**
 * The full session: a presence bar, the document with Robin's caret, tracked
 * changes, and comment anchors, and the review rail beside it. Accepting or
 * rejecting a change and resolving a thread are the caller's edits to make, so
 * the story keeps them in local state exactly the way an app would.
 */
function SessionExample({
  readOnly = false,
  theme,
}: {
  readOnly?: boolean;
  theme?: SharedUiTheme;
}) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    "t-workspaces",
  );
  const [reviewed, setReviewed] = useState<readonly string[]>([]);
  const [resolved, setResolved] = useState<readonly string[]>([]);
  const [peerStep, setPeerStep] = useState(0);
  const [value, setValue] = useState(markdown);

  const presence = useMemo(
    () => [peerPositions[peerStep % peerPositions.length]],
    [peerStep],
  );
  const liveSuggestions = useMemo(
    () =>
      suggestions.map((suggestion) =>
        reviewed.includes(suggestion.id)
          ? { ...suggestion, status: "accepted" as const }
          : suggestion,
      ),
    [reviewed],
  );
  const liveThreads = useMemo(
    () =>
      commentThreads.map((thread) =>
        resolved.includes(thread.id) ? { ...thread, resolved: true } : thread,
      ),
    [resolved],
  );

  const review = useCallback(
    (id: string) => setReviewed((current) => [...current, id]),
    [],
  );
  const selectItem = useCallback((item: RichTextCollabRailItem) => {
    setActiveThreadId(item.kind === "comment" ? item.id : null);
  }, []);

  return (
    <StorySurface theme={theme}>
      <View style={styles.stack}>
        <View style={styles.toolbar}>
          <RichTextPresenceBar
            collaborators={collaborators}
            localCollaboratorId="cal"
            presence={presence}
            testID="rich-text-presence"
          />
          <Button
            onPress={() => setPeerStep((step) => step + 1)}
            size="sm"
            testID="rich-text-move-peer"
            tone="ghost"
          >
            Move Robin
          </Button>
        </View>
        <View style={styles.split}>
          <View style={styles.document}>
            <RichTextEditor
              activeCommentThreadId={activeThreadId}
              collaborators={collaborators}
              commentThreads={liveThreads}
              label="Launch note"
              localCollaboratorId="cal"
              minHeight={320}
              onSelectCommentThread={setActiveThreadId}
              presence={presence}
              onChangeMarkdown={setValue}
              readOnly={readOnly}
              suggestions={liveSuggestions}
              testID="rich-text-editor"
              value={value}
            />
            <View style={styles.readout}>
              <ThemedText
                color="muted"
                style={styles.readoutText}
                testID="rich-text-collab-out"
              >
                {value}
              </ThemedText>
            </View>
          </View>
          <View style={styles.rail}>
            <RichTextCollabRail
              activeCommentThreadId={activeThreadId}
              collaborators={collaborators}
              commentThreads={liveThreads}
              localCollaboratorId="cal"
              onAcceptSuggestion={review}
              onRejectSuggestion={review}
              onResolveThread={(id) =>
                setResolved((current) => [...current, id])
              }
              onSelectItem={selectItem}
              suggestions={liveSuggestions}
              testID="rich-text-rail"
              value={value}
            />
          </View>
        </View>
      </View>
    </StorySurface>
  );
}

const styles = StyleSheet.create({
  document: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 340,
  },
  readout: {
    marginTop: 10,
  },
  readoutText: {
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: 11,
    lineHeight: 16,
  },
  rail: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 320,
    minWidth: 260,
  },
  split: {
    columnGap: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  stack: {
    gap: 14,
    maxWidth: 1000,
    minWidth: 360,
    width: "100%",
  },
  toolbar: {
    alignItems: "center",
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
});
