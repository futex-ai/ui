import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal, Settings, Trash2 } from "lucide-react-native";
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
  SharedUiThemeProvider,
  WebModalFrame,
  createSharedUiTheme,
  defaultSharedUiTheme,
  junoSharedUiTheme,
} from "../index";

const meta = {
  title: "Shared UI",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const selectorOptions = [
  { label: "Standard", value: "standard" },
  { label: "Cash accounting", value: "cash" },
  { disabled: true, label: "Flat rate", value: "flat" },
];

const books = [
  { color: "#4f7864", label: "Greenhouse Studio", mark: "G", value: "book_1" },
  { color: "#946727", label: "Payroll Reserve", mark: "P", value: "book_2" },
  { color: "#315f96", label: "VAT Archive", mark: "V", value: "book_3" },
];

const alternateTheme = createSharedUiTheme({
  colors: {
    primary: "#6F5BD0",
    primaryBorder: "#E2DAF5",
    primaryDeep: "#5A47BD",
    primarySoft: "#F0EBFA",
  },
});

export const DropdownSelectorDefault: Story = {
  name: "Dropdown selector",
  render: () => (
    <StorySurface>
      <SelectorExample />
    </StorySurface>
  ),
};

export const DropdownActionMenu: Story = {
  name: "Dropdown action menu",
  render: () => (
    <StorySurface>
      <ActionMenuExample />
    </StorySurface>
  ),
};

export const InputBackedCombobox: Story = {
  name: "Input-backed combobox",
  render: () => (
    <StorySurface>
      <ComboboxMultiSelect
        footer="Only active books can be selected."
        onChange={() => undefined}
        options={books}
        values={["book_1"]}
      />
    </StorySurface>
  ),
};

export const ChipMultiSelect: Story = {
  name: "Chip multi-select",
  render: () => (
    <StorySurface>
      <ChipMultiSelectExample />
    </StorySurface>
  ),
};

export const CenteredWebModal: Story = {
  name: "Centered web modal",
  render: () => (
    <StorySurface>
      <ModalExample placement="center" title="Invite teammate" />
    </StorySurface>
  ),
};

export const BottomSheetWebModal: Story = {
  name: "Bottom-sheet web modal",
  render: () => (
    <StorySurface>
      <ModalExample placement="bottom-sheet" title="Cookie preferences" />
    </StorySurface>
  ),
};

export const DefaultAccountingTheme: Story = {
  name: "Default accounting theme",
  render: () => (
    <StorySurface theme={defaultSharedUiTheme}>
      <ThemeSwatch label="Accounting default" />
    </StorySurface>
  ),
};

export const AlternatePrimaryTheme: Story = {
  name: "Alternate primary theme",
  render: () => (
    <StorySurface theme={junoSharedUiTheme}>
      <ThemeSwatch label="Juno primary" />
    </StorySurface>
  ),
};

function SelectorExample() {
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

function ActionMenuExample() {
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      leading: <DropdownIconBox Icon={Settings} />,
      onPress: () => setOpen(false),
      type: "item",
    },
    { id: "divider", label: "divider", type: "divider" },
    {
      id: "delete",
      label: "Remove",
      leading: <DropdownIconBox Icon={Trash2} tone="danger" />,
      onPress: () => setOpen(false),
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

function ChipMultiSelectExample() {
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

function ModalExample({
  placement,
  title,
}: {
  placement: "bottom-sheet" | "center";
  title: string;
}) {
  const [visible, setVisible] = useState(true);
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
            placeholder="Type here"
            style={styles.input}
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

function StorySurface({
  children,
  theme = defaultSharedUiTheme,
}: {
  children: ReactNode;
  theme?: Parameters<typeof SharedUiThemeProvider>[0]["theme"];
}) {
  return (
    <SharedUiThemeProvider theme={theme}>
      <View style={styles.surface}>{children}</View>
    </SharedUiThemeProvider>
  );
}

function ThemeSwatch({ label }: { label: string }) {
  return (
    <View style={styles.themeDemo}>
      <Text style={styles.heading}>{label}</Text>
      <SelectorExample />
    </View>
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
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
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
  modalBody: {
    gap: 12,
  },
  surface: {
    minWidth: 320,
    padding: 24,
  },
  themeDemo: {
    minWidth: 320,
  },
});
