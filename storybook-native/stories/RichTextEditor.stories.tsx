import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RichTextEditor } from "@firna/ui/rich-text";

const sample = [
  "# Product planning",
  "",
  "Keep the first release **focused** and learn from customer feedback.",
  "",
  "## Next steps",
  "",
  "- [x] Draft the mobile flow",
  "- [ ] Test the `markdown` round trip",
  "",
  "> The same document stays useful on every surface.",
].join("\n");

function NativeRichTextDemo({
  initialValue = "",
  readOnly = false,
}: {
  initialValue?: string;
  readOnly?: boolean;
}) {
  const [markdown, setMarkdown] = useState(initialValue);
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <RichTextEditor
        label={readOnly ? "Published notes" : "Notes"}
        maxHeight={430}
        minHeight={280}
        onChangeMarkdown={setMarkdown}
        placeholder="Write notes..."
        readOnly={readOnly}
        testID="native-rich-text-editor"
        value={markdown}
      />
      <View style={styles.readout}>
        <Text style={styles.readoutLabel}>Markdown</Text>
        <Text style={styles.readoutText}>{markdown || "No content yet"}</Text>
      </View>
    </ScrollView>
  );
}

const meta: Meta<typeof NativeRichTextDemo> = {
  component: NativeRichTextDemo,
  title: "RichText/Native editor",
};

export default meta;

type Story = StoryObj<typeof NativeRichTextDemo>;

export const Editable: Story = {};

export const Prefilled: Story = {
  args: { initialValue: sample },
};

export const ReadOnly: Story = {
  args: { initialValue: sample, readOnly: true },
};

const styles = StyleSheet.create({
  readout: {
    backgroundColor: "#f7f7f3",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  readoutLabel: {
    color: "#69706a",
    fontSize: 12,
    fontWeight: "700",
  },
  readoutText: {
    color: "#3e4540",
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 18,
  },
  screen: {
    backgroundColor: "#ffffff",
    flexGrow: 1,
    gap: 18,
    padding: 20,
  },
});
