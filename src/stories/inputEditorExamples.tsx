/** Textarea and inline editor examples for the Input stories. */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { InputFrame, Input, Textarea } from "../index";

export function InlineEditorExample() {
  const [title, setTitle] = useState("Untitled list");
  return (
    <View style={inlineStyles.row}>
      {/* A chrome-less inline title editor embedded in a row: it reads as plain
          text until focused, when the shared focus ring appears. It keeps the
          clear button and the accessible name, but drops the border/fill so it
          sits flush inside the row. */}
      <InputFrame
        accessibilityLabel="List title"
        clearable
        onChangeText={setTitle}
        size="sm"
        value={title}
        variant="plain"
      />
      <Text style={inlineStyles.count}>12 tasks</Text>
    </View>
  );
}

const inlineStyles = StyleSheet.create({
  count: { color: "#69706a", fontSize: 13 },
  row: {
    alignItems: "center",
    borderColor: "#e5e8e0",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export function SeamlessEditorExample() {
  const [title, setTitle] = useState("Untitled document");
  const [body, setBody] = useState(
    "This whole card reads as plain text, but every line is editable — click " +
      "in and type. The body grows to fit as you add lines.",
  );
  return (
    // A document-like surface whose heading and body ARE editable text: the
    // seamless fields carry no border, fill, or box height, so they sit flush in
    // the copy and only reveal a focus ring when you edit them. Each field styles
    // its text through `inputStyle` to match the surrounding type, and both keep
    // an accessible name because there is no visible label.
    <View style={seamlessStyles.doc}>
      <Input
        accessibilityLabel="Document title"
        inputStyle={seamlessStyles.title}
        onChangeText={setTitle}
        placeholder="Untitled document"
        value={title}
        variant="seamless"
      />
      <Textarea
        accessibilityLabel="Document body"
        inputStyle={seamlessStyles.body}
        // Seamless multiline grows to fit all its content (no maxLines cap), so
        // the field is exactly as tall as the text — like a paragraph you edit
        // in place. Start it as a single line.
        numberOfLines={1}
        onChangeText={setBody}
        placeholder="Start writing…"
        value={body}
        variant="seamless"
      />
    </View>
  );
}

const seamlessStyles = StyleSheet.create({
  body: { color: "#41463f", fontSize: 15, lineHeight: 22 },
  doc: {
    backgroundColor: "#fff",
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  // A matching line height keeps the larger heading glyphs clear of the
  // height-less, zero-padding seamless box (never clipped).
  title: { color: "#20241f", fontSize: 22, fontWeight: "700", lineHeight: 28 },
});

export function TextareaExample() {
  const [value, setValue] = useState(
    "Initial scope notes\nFollow up with implementation details",
  );
  return (
    <Textarea
      clearable
      hint="Use multiple lines for notes, comments, or descriptions."
      label="Project notes"
      onChangeText={setValue}
      placeholder="Add useful context"
      value={value}
    />
  );
}

export function AutoGrowingExample() {
  const [value, setValue] = useState("Two lines to start.\nDelete to shrink.");
  return (
    <Textarea
      hint="Starts at two rows, grows with content up to six, then scrolls."
      label="Release notes"
      // Start at two rows (the min it shrinks back to) and grow up to six rows.
      maxLines={6}
      numberOfLines={2}
      onChangeText={setValue}
      placeholder="Type a few lines..."
      value={value}
    />
  );
}
