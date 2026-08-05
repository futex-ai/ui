import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { RichTextEditor, darkSharedUiTheme } from "../index";
import type { SlashMenuItem } from "../index";
import { StorySurface } from "./sharedExamples";

const prefilledMarkdown = [
  "# Release summary",
  "",
  "Paragraph with **bold**, *italic*, ~~strike~~, and `code`.",
  "",
  "## Decisions",
  "",
  "- Keep the editor block-first",
  "- Preserve markdown round trips",
  "",
  "1. Draft",
  "2. Review",
  "",
  "- [ ] Wire slash menu later",
  "- [x] Ship M1 core",
  "",
  "> Quotes keep their own block treatment\\",
  "> across soft lines.",
  "",
  "```",
  'const status = "ready";',
  "```",
  "",
  "---",
  "",
  "### Tail section",
].join("\n");

const meta = {
  title: "RichText/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  name: "Playground",
  render: () => <PlaygroundExample />,
};

export const Prefilled: Story = {
  name: "Prefilled",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <RichTextEditor
          label="Notes"
          minHeight={260}
          placeholder="Write notes..."
          value={prefilledMarkdown}
        />
      </View>
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.stack}>
        <RichTextEditor
          label="Notes"
          minHeight={260}
          placeholder="Write notes..."
          value={prefilledMarkdown}
        />
      </View>
    </StorySurface>
  ),
};

export const ReadOnly: Story = {
  name: "Read only",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <RichTextEditor
          label="Published notes"
          minHeight={220}
          readOnly
          value={prefilledMarkdown}
        />
      </View>
    </StorySurface>
  ),
};

export const WithExtraSlashItems: Story = {
  name: "With extra slash items",
  render: () => <WithExtraSlashItemsExample />,
};

function PlaygroundExample() {
  const [markdown, setMarkdown] = useState("");
  return (
    <StorySurface>
      <View style={styles.stack}>
        <RichTextEditor
          label="Editor"
          minHeight={240}
          onChangeMarkdown={setMarkdown}
          placeholder="Write notes..."
          testID="rich-text-editor"
          value={markdown}
        />
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>Markdown</Text>
          <Text style={styles.readoutText} testID="rich-text-markdown-out">
            {markdown}
          </Text>
        </View>
      </View>
    </StorySurface>
  );
}

function WithExtraSlashItemsExample() {
  const [markdown, setMarkdown] = useState("");
  const extraItems = useMemo<SlashMenuItem[]>(
    () => [
      {
        execute: (commands) =>
          commands.insertBlocks([
            {
              spans: [{ marks: [], text: "Inserted from slash menu" }],
              type: "paragraph",
            },
          ]),
        icon: Plus,
        id: "insert-paragraph",
        keywords: ["custom"],
        label: "Insert paragraph",
        section: "Actions",
      },
    ],
    [],
  );
  return (
    <StorySurface>
      <View style={styles.stack}>
        <RichTextEditor
          label="Editor"
          minHeight={240}
          onChangeMarkdown={setMarkdown}
          placeholder="Write notes..."
          slashExtraItems={extraItems}
          testID="rich-text-editor"
          value={markdown}
        />
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>Markdown</Text>
          <Text style={styles.readoutText} testID="rich-text-markdown-out">
            {markdown}
          </Text>
        </View>
      </View>
    </StorySurface>
  );
}

const styles = StyleSheet.create({
  readout: {
    backgroundColor: "#f7f7f3",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  readoutLabel: {
    color: "#69706a",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 6,
  },
  readoutText: {
    color: "#1c1f1d",
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: 12,
    lineHeight: 18,
    minHeight: 54,
  },
  stack: {
    gap: 14,
    maxWidth: 760,
    minWidth: 360,
    width: "100%",
  },
});
