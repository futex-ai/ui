import { MoreHorizontal, Plus, Settings, Trash2 } from "lucide-react-native";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  ComboboxMultiSelect,
  DropdownIconBox,
  DropdownList,
  DropdownListEntry,
  DropdownPortal,
  DropdownSelector,
  Popover,
  SharedUiTheme,
  SharedUiThemeOverrides,
  SharedUiThemeProvider,
  WebModalFrame,
  defaultSharedUiTheme,
} from "../index";

const selectorOptions = [
  { label: "Standard", value: "standard" },
  { label: "Cash accounting", value: "cash" },
  { disabled: true, label: "Flat rate", value: "flat" },
];

const longSelectorOptions = Array.from({ length: 28 }, (_, index) => {
  const optionNumber = String(index + 1).padStart(2, "0");
  return {
    label: `Long option ${optionNumber}`,
    value: `long-${optionNumber}`,
  };
});

const books = [
  { color: "#4f7864", label: "Greenhouse Studio", mark: "G", value: "book_1" },
  { color: "#946727", label: "Payroll Reserve", mark: "P", value: "book_2" },
  { color: "#315f96", label: "VAT Archive", mark: "V", value: "book_3" },
];

const currencyOptions = [
  { label: "US Dollar", value: "usd" },
  { label: "Euro", value: "eur" },
  { label: "British Pound", value: "gbp" },
  { label: "Japanese Yen", value: "jpy" },
  { label: "Swiss Franc", value: "chf" },
  { label: "Canadian Dollar", value: "cad" },
  { label: "Australian Dollar", value: "aud" },
  { label: "Singapore Dollar", value: "sgd" },
  { label: "Hong Kong Dollar", value: "hkd" },
  { label: "Norwegian Krone", value: "nok" },
  { label: "Swedish Krona", value: "sek" },
  { label: "New Zealand Dollar", value: "nzd" },
];

export function SelectorExample() {
  const [value, setValue] = useState("standard");
  return (
    <DropdownSelector
      label="Scheme"
      onValueChange={setValue}
      options={selectorOptions}
      value={value}
    />
  );
}

const explicitSelectorOptions = [
  {
    accessibilityLabel: "Standard scheme",
    label: "Standard",
    value: "standard",
  },
  {
    accessibilityLabel: "Custom start date",
    label: "Custom",
    value: "custom-start",
  },
  {
    accessibilityLabel: "Custom end date",
    label: "Custom",
    value: "custom-end",
  },
];

export function ExplicitSelectorExample() {
  const [value, setValue] = useState("standard");
  return (
    <DropdownSelector
      label="Scheme"
      onValueChange={setValue}
      options={explicitSelectorOptions}
      triggerLabel="Scheme"
      value={value}
    />
  );
}

export function LongSelectorExample() {
  const [value, setValue] = useState("long-01");
  return (
    <DropdownSelector
      label="Long list"
      onValueChange={setValue}
      options={longSelectorOptions}
      value={value}
    />
  );
}

export function SelectorWithHeaderFooterExample() {
  const [value, setValue] = useState("long-01");
  return (
    <DropdownSelector
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => undefined}
          style={styles.menuFooterAction}
        >
          <Plus color="#2f5945" size={15} />
          <Text style={styles.menuFooterText}>Add scheme</Text>
        </Pressable>
      }
      header={<Text style={styles.menuHeaderText}>Choose a scheme</Text>}
      label="Scheme"
      onValueChange={setValue}
      options={longSelectorOptions}
      value={value}
    />
  );
}

export function SearchableSelectorExample() {
  const [value, setValue] = useState("usd");
  return (
    <DropdownSelector
      label="Currency"
      onValueChange={setValue}
      options={currencyOptions}
      searchable
      value={value}
    />
  );
}

export function ActionMenuExample() {
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      leading: <DropdownIconBox Icon={Settings} />,
      onPress: () => setOpen(false),
      role: "menuitem",
      type: "item",
    },
    { id: "divider", label: "divider", type: "divider" },
    {
      id: "delete",
      label: "Remove",
      leading: <DropdownIconBox Icon={Trash2} tone="danger" />,
      onPress: () => setOpen(false),
      role: "menuitem",
      tone: "danger",
      type: "item",
    },
  ];

  return (
    <View ref={anchorRef}>
      <Pressable
        accessibilityLabel="Open action menu"
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={styles.iconButton}
      >
        <MoreHorizontal color="#3e4540" size={18} />
      </Pressable>
      <DropdownPortal
        anchorRef={anchorRef}
        minWidth={180}
        onClose={() => setOpen(false)}
        open={open}
      >
        {(placement) => (
          <DropdownList
            entries={entries}
            maxHeight={placement.maxHeight}
            onClose={() => setOpen(false)}
          />
        )}
      </DropdownPortal>
    </View>
  );
}

export function PopoverExample() {
  return (
    <Popover
      minWidth={240}
      trigger={({ open, triggerProps }) => (
        <Pressable
          {...triggerProps}
          accessibilityLabel="Details"
          accessibilityRole="button"
          style={[styles.button, open ? styles.buttonOpen : null]}
        >
          <Text style={styles.buttonText}>Details</Text>
        </Pressable>
      )}
    >
      {({ close }) => (
        <View style={styles.popoverCard}>
          <Text style={styles.popoverTitle}>Greenhouse Studio</Text>
          <Text style={styles.popoverBody}>
            Standard VAT scheme · GBP · Reconciled to 31 May.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={styles.popoverClose}
          >
            <Text style={styles.popoverCloseText}>Close</Text>
          </Pressable>
        </View>
      )}
    </Popover>
  );
}

export function ControlledPopoverExample() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.controlledPopover}>
      <Text style={styles.popoverStatus}>
        {open ? "Popover is open" : "Popover is closed"}
      </Text>
      <Popover
        minWidth={240}
        onOpenChange={setOpen}
        open={open}
        trigger={({ open: isOpen, triggerProps }) => (
          <Pressable
            {...triggerProps}
            accessibilityLabel="Account"
            accessibilityRole="button"
            style={[styles.button, isOpen ? styles.buttonOpen : null]}
          >
            <Text style={styles.buttonText}>Account</Text>
          </Pressable>
        )}
      >
        {({ close }) => (
          <View style={styles.popoverCard}>
            <Text style={styles.popoverTitle}>Greenhouse Studio</Text>
            <Text style={styles.popoverBody}>
              Owner · billing@greenhouse.example
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={styles.popoverClose}
            >
              <Text style={styles.popoverCloseText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Popover>
    </View>
  );
}

export function InputBackedComboboxExample() {
  return (
    <ComboboxMultiSelect
      footer="Only active books can be selected."
      onChange={() => undefined}
      options={books}
      values={["book_1"]}
    />
  );
}

export function ChipMultiSelectExample() {
  const [values, setValues] = useState(["book_1"]);
  return (
    <ComboboxMultiSelect
      footer="Only active books can be selected."
      onChange={setValues}
      options={books}
      values={values}
    />
  );
}

export function ModalExample({
  placement,
  title,
}: {
  placement: "bottom-sheet" | "center";
  title: string;
}) {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState("");
  return (
    <View>
      <Pressable
        accessibilityLabel={`Open ${title}`}
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Open modal</Text>
      </Pressable>
      <WebModalFrame
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        }
        onClose={() => setVisible(false)}
        placement={placement}
        subtitle="Shared modal chrome with focus and close handling."
        title={title}
        visible={visible}
      >
        <View style={styles.modalBody}>
          <TextInput
            accessibilityLabel="Modal text field"
            onChangeText={setText}
            placeholder="Type here"
            style={styles.input}
            value={text}
          />
          <DropdownSelector
            label="Nested selector"
            onValueChange={() => undefined}
            options={selectorOptions}
            value="standard"
          />
        </View>
      </WebModalFrame>
    </View>
  );
}

export function ThemeSwatch({ label }: { label: string }) {
  return (
    <View style={styles.themeDemo}>
      <Text style={styles.heading}>{label}</Text>
      <SelectorExample />
    </View>
  );
}

export function StorySurface({
  children,
  theme = defaultSharedUiTheme,
}: {
  children: ReactNode;
  theme?: SharedUiTheme | SharedUiThemeOverrides;
}) {
  return (
    <SharedUiThemeProvider theme={theme}>
      <View style={styles.surface}>{children}</View>
    </SharedUiThemeProvider>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2f5945",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonOpen: {
    backgroundColor: "#24432f",
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  controlledPopover: {
    alignItems: "flex-start",
    gap: 8,
  },
  heading: {
    color: "#1c1f1d",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  input: {
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minWidth: 240,
    padding: 10,
  },
  menuFooterAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  menuFooterText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  menuHeaderText: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "800",
  },
  modalBody: {
    gap: 12,
  },
  popoverBody: {
    color: "#3e4540",
    fontSize: 13,
    lineHeight: 18,
  },
  popoverCard: {
    gap: 6,
    padding: 12,
  },
  popoverClose: {
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  popoverCloseText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  popoverStatus: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  popoverTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "800",
  },
  surface: {
    minWidth: 320,
    padding: 24,
  },
  themeDemo: {
    minWidth: 320,
  },
});
