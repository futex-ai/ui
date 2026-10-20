/** A modal form whose first field carries help and chip controls, for Storybook. */
import { useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Button, ComboboxMultiSelect, Input, WebModalFrame } from "../index";

const bookOptions = [
  { label: "Greenhouse Studio", value: "book_1" },
  { label: "Payroll Reserve", value: "book_2" },
  { label: "VAT Archive", value: "book_3" },
];

/**
 * Every secondary control that precedes a field in DOM order is present: the
 * ⓘ help button beside the first label, the chip-remove buttons of a
 * pre-filled multi-select, and a clear button on a filled field. The modal
 * must still open on the first field, with every one of those controls kept
 * in the Tab cycle.
 */
export function ModalFormExample() {
  const [visible, setVisible] = useState(true);
  const [name, setName] = useState("");
  const [books, setBooks] = useState(["book_1", "book_2"]);
  const [email, setEmail] = useState("billing@acme.example");
  return (
    <View>
      <Button inline onPress={() => setVisible(true)}>
        Open workspace settings
      </Button>
      <WebModalFrame
        footer={<Button onPress={() => setVisible(false)}>Save</Button>}
        onClose={() => setVisible(false)}
        title="Workspace settings"
        visible={visible}
      >
        <View style={styles.form}>
          <Input
            label="Workspace name"
            labelInfo="Shown to teammates in the switcher and on every invitation."
            onChangeText={setName}
            placeholder="Acme Ltd"
            value={name}
          />
          <ComboboxMultiSelect
            label="Linked books"
            labelInfo="Linked books scope reports to specific ledgers."
            onChange={setBooks}
            options={bookOptions}
            values={books}
          />
          <Input
            clearable
            label="Billing email"
            onChangeText={setEmail}
            value={email}
          />
        </View>
      </WebModalFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
});
